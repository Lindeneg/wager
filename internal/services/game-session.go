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

type GameSessionShared[T string | result.ResultMap] struct {
	ID      db.ID             `json:"id"`
	Rounds  GameSessionRounds `json:"rounds"`
	Result  T                 `json:"result"`
	Started time.Time         `json:"started"`
	Ended   *time.Time        `json:"ended"`
}

type GameSession struct {
	GameSessionShared[result.ResultMap]
	SessionID db.ID `json:"sessionId"`
	GameID    db.ID `json:"gameId"`
}

type GameSessionDB struct {
	GameSessionShared[string]
	SessionID db.ID `json:"session_id"`
	GameID    db.ID `json:"game_id"`
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
			GameSessionShared: GameSessionShared[result.ResultMap]{
				ID:      gr.ID,
				Rounds:  gr.Rounds,
				Result:  result.FromString(gr.Result),
				Started: gr.Started,
				Ended:   gr.Ended,
			},
			SessionID: gr.SessionID,
			GameID:    gr.GameID,
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
	s     SessionService
	r     GameSessionRoundService
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
		pagination.MakeQuery(withRounds("WHERE session_id = ? ORDER BY ended DESC"), p), id)
	if err != nil {
		return sessions, err
	}
	defer rows.Close()
	for rows.Next() {
		var s GameSession
		var sResult string
		err = rows.Scan(
			&s.ID, &s.SessionID, &s.GameID,
			&sResult, &s.Started, &s.Ended, &s.Rounds)
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
	err := g.store.DB.QueryRow(withRounds("WHERE session_id = ? AND ended IS NULL"),
		sessionID,
	).Scan(
		&gs.ID, &gs.SessionID, &gs.GameID, &sResult,
		&gs.Started, &gs.Ended, &gs.Rounds)
	if err != nil {
		return gs, err
	}
	gs.Result = result.FromString(sResult)
	return gs, nil
}

func (g *gsService) ByPK(id db.ID) (GameSession, error) {
	var gs GameSession
	var sResult string
	err := g.store.DB.QueryRow(withRounds("WHERE id = ?"), id).Scan(
		&gs.ID, &gs.SessionID, &gs.GameID, &sResult,
		&gs.Started, &gs.Ended, &gs.Rounds)
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
		GameSessionShared: GameSessionShared[result.ResultMap]{
			Rounds:  GameSessionRounds{},
			Result:  result.New(pt),
			Started: NewTime(),
			Ended:   nil,
		},
		SessionID: sessionID,
		GameID:    gameID,
	}
	e, err := g.store.DB.Exec(`INSERT
INTO game_session (session_id, game_id, started, result)
    VALUES (?, ?, ?, ?)`,
		gs.SessionID,
		gs.GameID,
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
	gr, err := g.r.Create(gs.ID, wager, pt, 1)
	if err != nil {
		return gs, err
	}
	gs.Rounds = append(gs.Rounds, gr)
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
	pt, err := g.pt.FromSession(gs.SessionID, nil)
	if err != nil {
		return gs, err
	}
	gr, err := g.r.Create(id, wager, pt, len(gs.Rounds)+1)
	if err != nil {
		return gs, err
	}
	gs.Rounds = append([]GameSessionRound{gr}, gs.Rounds...)
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
	if !gs.Result.Exists(winnerID) {
		return gs, errvar.ErrWinnerIsNotParticipant
	}
	_, idx := gs.Rounds.Active()
	if idx == -1 {
		return gs, errvar.ErrGameSessionNoActive
	}
	gr, err := g.r.EndActive(id, winnerID)
	if err != nil {
		return gs, err
	}
	gs.Result.AddWinner(winnerID, gr.Wager)
	gs.Result.Resolve()
	gs.Rounds[idx] = gr
	_, err = g.store.DB.Exec(
		"UPDATE game_session SET result = ? WHERE id = ?",
		gs.Result.String(), id)
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
	if g.r.HasActive(id) {
		return gs, errvar.ErrGameSessionActive
	}
	pt, err := g.pt.FromSession(gs.SessionID, nil)
	if gs.Ended != nil {
		return gs, err
	}
	gs.Ended = GetPtr(NewTime())
	_, err = g.store.DB.Exec(
		"UPDATE game_session SET ended = ? WHERE id = ?",
		FormatTime(*gs.Ended), id)
	if err != nil {
		return gs, err
	}
	err = g.s.UpdateResult(gs.SessionID, pt, gs.Result)
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
	if len(gs.Rounds) > 1 {
		return errvar.ErrGameSessionWager
	}
	_, err = g.store.DB.Exec("DELETE FROM game_session WHERE id = ?", id)
	if err != nil {
		return err
	}
	return nil
}

func NewGameSessionService(
	store *db.Datastore,
	s SessionService,
	r GameSessionRoundService,
	pt ParticipantService,
) GameSessionService {
	return &gsService{store, s, r, pt}
}

func withRounds(q string) string {
	return fmt.Sprintf(`WITH ordered_rounds AS (
    SELECT
        gr.id,
        gr.game_session_id,
        gr.round,
        gr.wager,
        gr.active,
        gr.result
    FROM
        game_session_round gr
    WHERE
        gr.game_session_id = s.id
    ORDER BY
        gr.round DESC
)

SELECT
    s.id,
    s.session_id,
    s.game_id,
    s.result,
    s.started,
    s.ended,
    COALESCE(
            (
                SELECT json_group_array(
                               json_object(
                                       'id', o.id,
                                       'game_session_id', o.game_session_id,
                                       'round', o.round,
                                       'wager', o.wager,
                                       'active', o.active,
                                       'result', o.result
                               )
                       )
                FROM ordered_rounds o
            ), '[]'
    ) AS rounds
FROM
    game_session s %s`, q)
}
