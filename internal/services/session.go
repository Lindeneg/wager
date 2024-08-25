package services

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/errvar"
	"github.com/lindeneg/wager/internal/pagination"
	"github.com/lindeneg/wager/internal/result"
)

type Session struct {
	ID      db.ID            `json:"id"`
	Result  result.ResultMap `json:"result"`
	Started time.Time        `json:"started"`
	Ended   *time.Time       `json:"ended"`
}

func (s Session) ResultMap() result.ResultMap {
	return s.Result
}

type Users []db.ID

func (u *Users) Scan(src any) error {
	var usrs Users
	s, ok := src.(string)
	if !ok {
		return errvar.ErrScanError
	}
	err := json.Unmarshal([]byte(s), &usrs)
	if err != nil {
		return err
	}
	if len(usrs) == 0 {
		*u = Users{}
		return nil
	}
	*u = usrs
	return nil
}

type SessionWithGames struct {
	Session
	Users        `json:"users"`
	GameSessions `json:"gameSessions"`
}

type SessionService interface {
	ByPK(id db.ID) (Session, error)
	ByPKWithSessions(id db.ID) (SessionWithGames, error)
	Resolved(pg *pagination.P) ([]Session, error)
	All(pg *pagination.P) ([]Session, error)
	AllWithSessions(pg *pagination.P) ([]SessionWithGames, error)

	Count() (int, error)
	Result() (result.ResultMap, error)
	HasActive() bool

	Create(userIDs []db.ID) (SessionWithGames, error)

	End(id db.ID) (SessionWithGames, error)
	Cancel(id db.ID) error
}

type sService struct {
	store *db.Datastore
	u     UserService
	g     GameSessionService
	pt    ParticipantService
}

func (s *sService) Count() (int, error) {
	var count int
	err := s.store.DB.QueryRow("SELECT COUNT(*) FROM session").Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (s *sService) ByPK(id db.ID) (Session, error) {
	var gs Session
	var sResult *string
	err := s.store.DB.QueryRow(
		"SELECT * FROM session WHERE id = ?",
		id,
	).Scan(&gs.ID, &sResult, &gs.Started, &gs.Ended)
	if err != nil {
		return gs, err
	}
	if sResult != nil {
		gs.Result = result.FromString(*sResult)
	}
	return gs, nil
}

func (s *sService) HasActive() bool {
	var id db.ID
	err := s.store.DB.QueryRow("SELECT id FROM session WHERE ended IS NULL").Scan(&id)
	if err != nil {
		return false
	}
	return id > 0
}

func (s *sService) ByPKWithSessions(id db.ID) (SessionWithGames, error) {
	var gs SessionWithGames
	var sResult *string
	err := s.store.DB.QueryRow(withSessions("WHERE s.id = ?"), id).Scan(
		&gs.ID, &sResult, &gs.Started, &gs.Ended, &gs.GameSessions, &gs.Users)
	if err != nil {
		return gs, err
	}
	if sResult != nil {
		gs.Result = result.FromString(*sResult)
	}
	return gs, nil
}

func (s *sService) all(q string, p *pagination.P) ([]Session, error) {
	ss := make([]Session, 0)
	rows, err := s.store.DB.Query(
		pagination.MakeQuery(q, p))
	if err != nil {
		return ss, err
	}
	defer rows.Close()
	for rows.Next() {
		var ses Session
		var sResult *string
		err = rows.Scan(&ses.ID, &sResult, &ses.Started, &ses.Ended)
		if err != nil {
			return ss, err
		}
		if sResult != nil {
			ses.Result = result.FromString(*sResult)
		}
		ss = append(ss, ses)
	}
	err = rows.Err()
	if err != nil {
		return ss, err
	}
	return ss, nil
}

func (s *sService) All(p *pagination.P) ([]Session, error) {
	return s.all("SELECT * FROM session ORDER BY ended DESC", p)
}

func (s *sService) Resolved(p *pagination.P) ([]Session, error) {
	return s.all("SELECT * FROM session WHERE ended IS NOT NULL AND result IS NOT NULL", p)
}

func (s *sService) getActive() (SessionWithGames, error) {
	var sResult *string
	active := SessionWithGames{}
	err := s.store.DB.QueryRow(withSessions("WHERE s.ended IS NULL")).Scan(&active.ID, &sResult, &active.Started, &active.Ended, &active.GameSessions, &active.Users)
	if err != nil {
		return active, err
	}
	if sResult != nil {
		active.Result = result.FromString(*sResult)
	}
	return active, nil
}

func (s *sService) AllWithSessions(p *pagination.P) ([]SessionWithGames, error) {
	var active SessionWithGames
	var activeErr error
	if p != nil {
		active, activeErr = s.getActive()
		if activeErr == nil {
			p.Limit -= 1
		}
	}
	ss := make([]SessionWithGames, 0)
	rows, err := s.store.DB.Query(
		pagination.MakeQuery(withSessions("WHERE s.id != ? ORDER BY s.ended DESC"), p), active.ID)
	if err != nil {
		return ss, err
	}
	defer rows.Close()
	for rows.Next() {
		var ses SessionWithGames
		var sResult *string
		err = rows.Scan(
			&ses.ID, &sResult, &ses.Started, &ses.Ended, &ses.GameSessions, &ses.Users)
		if err != nil {
			return ss, err
		}
		if sResult != nil {
			ses.Result = result.FromString(*sResult)
		}
		ss = append(ss, ses)
	}
	err = rows.Err()
	if err != nil {
		return ss, err
	}
	if p != nil && activeErr == nil {
		p.Limit += 1
		sss := ss
		if len(ss) > 0 && ss[len(ss)-1].Ended == nil {
			sss = ss[:len(ss)-1]
		}
		ss = append([]SessionWithGames{active}, sss...)
	}
	return ss, nil
}

func (s *sService) Create(userIDs []db.ID) (SessionWithGames, error) {
	ss := SessionWithGames{}
	ss.Started = NewTime()
	ss.GameSessions = []GameSession{}
	ss.Users = userIDs
	tx, err := s.store.DB.Begin()
	if err != nil {
		return ss, err
	}
	e, err := tx.Exec(
		"INSERT INTO session (started) VALUES (?)",
		FormatTime(ss.Started))
	if err != nil {
		return ss, err
	}
	id, err := e.LastInsertId()
	if err != nil {
		return ss, err
	}
	ss.ID = db.ID(id)
	stmt, err := tx.Prepare(
		"INSERT INTO session_participant (session_id, user_id) VALUES (?, ?)")
	if err != nil {
		return ss, err
	}
	defer stmt.Close()
	for _, userID := range userIDs {
		_, err := stmt.Exec(ss.ID, userID)
		if err != nil {
			tx.Rollback()
			return ss, err
		}
	}
	err = tx.Commit()
	if err != nil {
		return ss, err
	}
	return ss, nil
}

func (s *sService) End(id db.ID) (SessionWithGames, error) {
	ss, err := s.ByPKWithSessions(id)
	if err != nil {
		return ss, err
	}
	if ss.Ended != nil || ss.Result != nil {
		return ss, errvar.ErrSessionEnded
	}
	pts, err := s.pt.FromSession(id, nil)
	if err != nil {
		return ss, err
	}
	gs, err := s.g.FromSession(id, nil)
	if err != nil {
		return ss, err
	}
	ss.Result = result.Merge(pts, gs...)
	ss.Result.Resolve()
	ss.Ended = GetPtr(NewTime())
	_, err = s.store.DB.Exec(
		"UPDATE session SET ended = ?, result = ? WHERE id = ?",
		FormatTime(*ss.Ended), ss.Result.String(), id)
	if err != nil {
		return ss, err
	}
	return ss, nil
}

func (s *sService) Cancel(id db.ID) error {
	ss, err := s.ByPK(id)
	if err != nil {
		return err
	}
	if ss.Ended != nil || ss.Result != nil {
		return errvar.ErrSessionEnded
	}
	_, err = s.store.DB.Exec("DELETE FROM session WHERE id = ?", id)
	if err != nil {
		return err
	}
	return nil
}

func (s *sService) Result() (result.ResultMap, error) {
	ses, err := s.Resolved(nil)
	if err != nil {
		return result.ResultMap{}, err
	}
	usrs, err := s.u.All(nil)
	if err != nil {
		return result.ResultMap{}, err
	}
	rr := result.Merge(usrs, ses...)
	rr.Resolve()
	return rr, nil
}

func NewSessionService(
	s *db.Datastore, u UserService, g GameSessionService, pt ParticipantService,
) SessionService {
	return &sService{s, u, g, pt}
}

func withSessions(q string) string {
	return fmt.Sprintf(`SELECT
    s.id,
    s.result,
    s.started,
    s.ended,
    COALESCE(
            (SELECT json_group_array(
                            json_object(
                                    'id', gs.id,
                                    'session_id', gs.session_id,
                                    'game_id', gs.game_id,
                                    'result', gs.result,
                                    'rounds', gs.rounds,
                                    'wager', gs.wager,
                                    'started', gs.started,
                                    'ended', gs.ended
                            )
                    )
             FROM game_session gs
             WHERE gs.session_id = s.id
             ORDER BY gs.ended DESC
            ), '[]'
    ) AS gameSessions,
    COALESCE(
            (SELECT json_group_array(p.user_id)
             FROM session_participant p
             WHERE p.session_id = s.id
            ), '[]'
    ) AS users
FROM
    session s %s`, q)
}
