package services

import (
	"encoding/json"
	"errors"

	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/errvar"
	"github.com/lindeneg/wager/internal/result"
)

type GameSessionRoundShared[T string | result.ResultMap] struct {
	ID     db.ID `json:"id"`
	Round  int   `json:"round"`
	Wager  int   `json:"wager"`
	Active int   `json:"active"`
	Result T     `json:"result"`
}

type GameSessionRound struct {
	GameSessionRoundShared[result.ResultMap]
	GameSessionID db.ID `json:"gameSessionId"`
}

type GameSessionRoundDB struct {
	GameSessionRoundShared[string]
	GameSessionID db.ID `json:"game_session_id"`
}

type GameSessionRounds []GameSessionRound

func (gs *GameSessionRounds) Active() (GameSessionRound, int) {
	for i, v := range *gs {
		if v.Active == 1 {
			return v, i
		}
	}
	return GameSessionRound{}, -1
}

func (gs *GameSessionRounds) UnmarshalJSON(s []byte) error {
	return gs.Scan(string(s))
}

func (gs *GameSessionRounds) Scan(src any) error {
	var grs []GameSessionRoundDB
	s, ok := src.(string)
	if !ok {
		return errvar.ErrScanError
	}
	err := json.Unmarshal([]byte(s), &grs)
	if err != nil {
		return err
	}
	if len(grs) == 0 {
		*gs = []GameSessionRound{}
		return nil
	}
	for _, gr := range grs {
		*gs = append(*gs, GameSessionRound{
			GameSessionRoundShared: GameSessionRoundShared[result.ResultMap]{
				ID:     gr.ID,
				Round:  gr.Round,
				Wager:  gr.Wager,
				Result: result.FromString(gr.Result),
				Active: gr.Active,
			},
			GameSessionID: gr.GameSessionID,
		})
	}
	return nil
}

func (g GameSessionRound) ResultMap() result.ResultMap {
	return g.Result
}

type GameSessionRoundService interface {
	Active(gameSessionID db.ID) (GameSessionRound, error)
	HasActive(gameSessionID db.ID) bool
	FromSession(gameSessionID db.ID) ([]GameSessionRound, error)

	Create(gameSessionID db.ID, wager int, p []Participant, r int) (GameSessionRound, error)
	EndActive(gameSessionID db.ID, winnerID db.ID) (GameSessionRound, error)
}

type gsrService struct {
	store *db.Datastore
}

func (g *gsrService) Active(gameSessionId db.ID) (GameSessionRound, error) {
	var gs GameSessionRound
	var sResult string
	err := g.store.DB.QueryRow(
		"SELECT * FROM game_session_round WHERE game_session_id = ? AND active = 1",
		gameSessionId).Scan(
		&gs.ID, &gs.GameSessionID, &sResult, &gs.Round, &gs.Wager, &gs.Active)
	if err != nil {
		return gs, err
	}
	gs.Result = result.FromString(sResult)
	return gs, nil
}

func (g *gsrService) HasActive(gameSessionId db.ID) bool {
	var id db.ID
	err := g.store.DB.QueryRow(
		"SELECT id FROM game_session_round WHERE game_session_id = ? AND active = 1",
		gameSessionId).Scan(&id)
	if err != nil {
		return false
	}
	return id > 0
}

func (g *gsrService) FromSession(id db.ID) ([]GameSessionRound, error) {
	rounds := make([]GameSessionRound, 0)
	rows, err := g.store.DB.Query(
		"SELECT * from game_session_round WHERE game_session_id = ? ORDER BY round DESC",
		id)
	if err != nil {
		return rounds, err
	}
	defer rows.Close()
	for rows.Next() {
		var s GameSessionRound
		var sResult string
		err = rows.Scan(&s.ID, &s.Round, &sResult, s.Wager)
		if err != nil {
			return rounds, err
		}
		s.Result = result.FromString(sResult)
		rounds = append(rounds, s)
	}
	err = rows.Err()
	if err != nil {
		return rounds, err
	}
	return rounds, nil
}

func (g *gsrService) Create(gid db.ID, w int, p []Participant, r int) (GameSessionRound, error) {
	_, err := g.Active(gid)
	if err == nil {
		return GameSessionRound{}, errors.New("already have active round")
	}
	gr := GameSessionRound{
		GameSessionRoundShared: GameSessionRoundShared[result.ResultMap]{
			Round:  r,
			Wager:  w,
			Result: result.New(p),
		},
		GameSessionID: gid,
	}
	e, err := g.store.DB.Exec(`INSERT 
INTO game_session_round (game_session_id, result, wager, round)
    VALUES (?, ?, ?, ?)`,
		gr.GameSessionID,
		gr.Result.String(),
		gr.Wager, gr.Round)
	if err != nil {
		return gr, err
	}
	id, err := e.LastInsertId()
	if err != nil {
		return gr, err
	}
	gr.ID = db.ID(id)
	return gr, nil
}

func (g *gsrService) EndActive(gid db.ID, w db.ID) (GameSessionRound, error) {
	gs, err := g.Active(gid)
	if err != nil {
		return gs, err
	}
	gs.Result.AddWinner(w, gs.Wager)
	gs.Active = 0
	_, err = g.store.DB.Exec(
		"UPDATE game_session_round SET result = ?, active = ? WHERE id = ?",
		gs.Result.String(), gs.Active, gs.ID)
	if err != nil {
		return gs, err
	}
	return gs, nil
}

func NewGameSessionRoundService(store *db.Datastore) GameSessionRoundService {
	return &gsrService{store}
}
