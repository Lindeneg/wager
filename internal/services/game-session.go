package services

import (
	"encoding/json"
	"time"

	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/errvar"
	"github.com/lindeneg/wager/internal/pagination"
	"github.com/lindeneg/wager/internal/result"
)

type GameSessionDB struct {
	ID        db.ID      `json:"id"`
	SessionID db.ID      `json:"session_id"`
	GameID    db.ID      `json:"game_id"`
	Rounds    int        `json:"rounds"`
	Result    string     `json:"result"`
	Wager     int        `json:"wager"`
	Started   time.Time  `json:"started"`
	Ended     *time.Time `json:"ended"`
}

type GameSession struct {
	ID        db.ID            `json:"id"`
	SessionID db.ID            `json:"sessionId"`
	GameID    db.ID            `json:"gameId"`
	Rounds    int              `json:"rounds"`
	Result    result.ResultMap `json:"result"`
	Wager     int              `json:"wager"`
	Started   time.Time        `json:"started"`
	Ended     *time.Time       `json:"ended"`
}

type GameSessions []GameSession

func (gs *GameSessions) Scan(src any) error {
	var grs []GameSessionDB
	s, ok := src.(string)
	if !ok {
		return errvar.ErrScanError
	}
	err := json.Unmarshal([]byte(s), &grs)
	if err != nil {
		return err
	}
	if len(grs) == 0 {
		*gs = []GameSession{}
		return nil
	}
	for _, gr := range grs {
		*gs = append(*gs, GameSession{
			ID:        gr.ID,
			SessionID: gr.SessionID,
			GameID:    gr.GameID,
			Rounds:    gr.Rounds,
			Result:    result.FromString(gr.Result),
			Wager:     gr.Wager,
			Started:   gr.Started,
			Ended:     gr.Ended,
		})
	}
	return nil
}

func (g GameSession) ResultMap() result.ResultMap {
	return g.Result
}

type GameSessionService interface {
	HasActive(sessionID db.ID) bool
	FromSession(sessionID db.ID, p *pagination.P) ([]GameSession, error)
	ActiveFromSession(sessionID db.ID) (GameSession, error)
	CountFromSession(sessionID db.ID) (int, error)
	ByPK(id db.ID) (GameSession, error)
	Create(sessionID db.ID, gameID db.ID, wager int) (GameSession, error)

	NewRound(id db.ID, wager int) (GameSession, error)
	EndRound(id db.ID, winnerID db.ID) (GameSession, error)

	End(id db.ID) (GameSession, error)
	Cancel(id db.ID) error
}

type gsService struct {
	store *db.Datastore
	pt    ParticipantService
}

func (g *gsService) HasActive(sessionID db.ID) bool {
	var id db.ID
	err := g.store.DB.QueryRow(
		"SELECT id FROM game_session WHERE session_id = ? AND ended IS NULL",
		sessionID).Scan(&id)
	if err != nil {
		return false
	}
	return id > 0
}

func (g *gsService) FromSession(id db.ID, p *pagination.P) ([]GameSession, error) {
	var active GameSession
	var activeErr error
	if p != nil {
		active, activeErr = g.ActiveFromSession(id)
		if activeErr == nil {
			p.Limit -= 1
		}
	}
	sessions := make([]GameSession, 0)
	rows, err := g.store.DB.Query(
		pagination.MakeQuery(`SELECT * from game_session
WHERE session_id = ? ORDER BY ended DESC`, p), id)
	if err != nil {
		return sessions, err
	}
	defer rows.Close()
	for rows.Next() {
		var s GameSession
		var sResult string
		err = rows.Scan(
			&s.ID, &s.SessionID, &s.GameID,
			&sResult, &s.Rounds, &s.Wager,
			&s.Started, &s.Ended)
		if err != nil {
			return sessions, err
		}
		s.Result = result.FromString(sResult)
		sessions = append(sessions, s)
	}
	err = rows.Err()
	if err != nil {
		return sessions, err
	}
	if p != nil && activeErr == nil {
		p.Limit += 1
		s := sessions
		if len(sessions) > 0 && sessions[len(sessions)-1].Ended == nil {
			s = sessions[:len(sessions)-1]
		}
		sessions = append([]GameSession{active}, s...)
	}
	return sessions, nil
}

func (g *gsService) CountFromSession(sessionID db.ID) (int, error) {
	var r int
	err := g.store.DB.QueryRow(
		"SELECT COUNT(*) FROM game_session WHERE session_id = ?",
		sessionID,
	).Scan(&r)
	if err != nil {
		return 0, err
	}
	return r, nil
}

func (g *gsService) ActiveFromSession(sessionID db.ID) (GameSession, error) {
	var gs GameSession
	var sResult string
	err := g.store.DB.QueryRow(
		"SELECT * FROM game_session WHERE session_id = ? AND ended IS NULL",
		sessionID,
	).Scan(
		&gs.ID, &gs.SessionID, &gs.GameID, &sResult,
		&gs.Rounds, &gs.Wager, &gs.Started, &gs.Ended)
	if err != nil {
		return gs, err
	}
	gs.Result = result.FromString(sResult)
	return gs, nil
}

func (g *gsService) ByPK(id db.ID) (GameSession, error) {
	var gs GameSession
	var sResult string
	err := g.store.DB.QueryRow(
		"SELECT * from game_session WHERE id = ?",
		id,
	).Scan(
		&gs.ID, &gs.SessionID, &gs.GameID, &sResult,
		&gs.Rounds, &gs.Wager, &gs.Started, &gs.Ended)
	if err != nil {
		return gs, err
	}
	gs.Result = result.FromString(sResult)
	return gs, nil
}

func (g *gsService) Create(sessionID db.ID, gameID db.ID, wager int) (GameSession, error) {
	pt, err := g.pt.FromSession(sessionID, nil)
	if err != nil {
		return GameSession{}, err
	}
	gs := GameSession{
		SessionID: sessionID,
		GameID:    gameID,
		Wager:     wager,
		Rounds:    1,
		Result:    result.New(pt),
		Started:   NewTime(),
		Ended:     nil,
	}
	e, err := g.store.DB.Exec(`INSERT 
INTO game_session (session_id, game_id, wager, started, result)
    VALUES (?, ?, ?, ?, ?)`,
		gs.SessionID,
		gs.GameID,
		gs.Wager,
		FormatTime(gs.Started),
		gs.Result.String())
	if err != nil {
		return gs, err
	}
	id, err := e.LastInsertId()
	if err != nil {
		return gs, err
	}
	gs.ID = db.ID(id)
	return gs, nil
}

func (g *gsService) NewRound(id db.ID, wager int) (GameSession, error) {
	gs, err := g.ByPK(id)
	if err != nil {
		return gs, err
	}
	if gs.Ended != nil {
		return gs, errvar.ErrGameSessionEnded
	}
	if gs.Wager > 0 {
		return gs, errvar.ErrGameSessionActive
	}
	gs.Rounds += 1
	gs.Wager = wager
	_, err = g.store.DB.Exec(
		"UPDATE game_session SET rounds = ?, wager = ? WHERE id = ?",
		gs.Rounds,
		gs.Wager,
		id)
	if err != nil {
		return gs, err
	}
	return gs, nil
}

func (g *gsService) EndRound(id db.ID, winnerID db.ID) (GameSession, error) {
	gs, err := g.ByPK(id)
	if err != nil {
		return gs, err
	}
	if gs.Ended != nil {
		return gs, errvar.ErrGameSessionEnded
	}
	if gs.Wager <= 0 {
		return gs, errvar.ErrGameSessionNoActive
	}
	if !gs.Result.Exists(winnerID) {
		return gs, errvar.ErrWinnerIsNotParticipant
	}
	gs.Result.AddWinner(winnerID, gs.Wager)
	gs.Result.Resolve()
	gs.Wager = 0
	_, err = g.store.DB.Exec(
		"UPDATE game_session SET result = ?, wager = ? WHERE id = ?",
		gs.Result.String(), gs.Wager, id)
	if err != nil {
		return gs, err
	}
	return gs, nil
}

func (g *gsService) End(id db.ID) (GameSession, error) {
	gs, err := g.ByPK(id)
	if err != nil {
		return gs, err
	}
	if gs.Ended != nil {
		return gs, errvar.ErrGameSessionEnded
	}
	if gs.Wager > 0 {
		return gs, errvar.ErrGameSessionActive
	}
	gs.Ended = GetPtr(NewTime())
	_, err = g.store.DB.Exec(
		"UPDATE game_session SET ended = ? WHERE id = ?",
		FormatTime(*gs.Ended), id)
	if err != nil {
		return gs, err
	}
	return gs, nil
}

func (g *gsService) Cancel(id db.ID) error {
	gs, err := g.ByPK(id)
	if err != nil {
		return err
	}
	if gs.Ended != nil {
		return errvar.ErrGameSessionActive
	}
	if gs.Rounds > 1 {
		return errvar.ErrGameSessionWager
	}
	_, err = g.store.DB.Exec("DELETE FROM game_session WHERE id = ?", id)
	if err != nil {
		return err
	}
	return nil
}

func NewGameSessionService(store *db.Datastore, pt ParticipantService) GameSessionService {
	return &gsService{store, pt}
}
