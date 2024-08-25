package controller

import (
	"errors"
	"net/http"

	"github.com/go-chi/render"
	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/errvar"
	"github.com/lindeneg/wager/internal/pagination"
	"github.com/lindeneg/wager/internal/server/utils"
	"github.com/lindeneg/wager/internal/services"
)

type NewGameSessionReq struct {
	SessionID db.ID `json:"sessionId"`
	GameID    db.ID `json:"gameId"`
	Wager     int   `json:"wager"`
}

func (n *NewGameSessionReq) Bind(r *http.Request) error {
	var err error
	if n.SessionID == 0 {
		err = errors.Join(err, errors.New("'sessionId' is required"))
	}
	if n.GameID == 0 {
		err = errors.Join(err, errors.New("'gameId' is required"))
	}
	if n.Wager == 0 {
		err = errors.Join(err, errors.New("'wager' is required"))
	}
	return err
}

type GameSessionRes services.GameSession
type GameSessionsRes []services.GameSession

func (GameSessionRes) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (GameSessionsRes) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (c Controller) NewGameSession(w http.ResponseWriter, r *http.Request) {
	data := &NewGameSessionReq{}
	if err := render.Bind(r, data); err != nil {
		utils.BadRequestErr(w, r, err)
		return
	}
	ss, err := c.s.Session.ByPK(data.SessionID)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	if ss.Ended != nil {
		utils.RenderErr(w, r, errvar.ErrSessionEnded)
		return
	}
	_, err = c.s.GSession.ActiveFromSession(data.SessionID)
	if err == nil {
		utils.RenderErr(w, r, errvar.ErrSessionActive)
		return
	}
	gs, err := c.s.GSession.Create(data.SessionID, data.GameID, data.Wager)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusCreated)
	render.Render(w, r, GameSessionRes(gs))
}

type NewGameSessionRoundReq struct {
	Wager int `json:"wager"`
}

func (n *NewGameSessionRoundReq) Bind(r *http.Request) error {
	var err error
	if n.Wager == 0 {
		err = errors.Join(err, errors.New("'wager' is required"))
	}
	if n.Wager < 0 {
		err = errors.Join(err, errors.New("'wager' must be a non-negative number"))
	}
	return err
}

func (c Controller) NewGameSessionRound(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	data := &NewGameSessionRoundReq{}
	if err := render.Bind(r, data); err != nil {
		utils.BadRequestErr(w, r, err)
		return
	}
	gs, err := c.s.GSession.NewRound(id, data.Wager)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, GameSessionRes(gs))
}

func (c Controller) GameSessions(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	gs, err := c.s.GSession.FromSession(id, pagination.FromQuery(r.URL.Query()))
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, GameSessionsRes(gs))
}

func (c Controller) HasActiveGameSession(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, BoolResponse(c.s.GSession.HasActive(id)))
}

type EndGameSessionRoundReq struct {
	WinnerID db.ID `json:"winnerId"`
}

func (n *EndGameSessionRoundReq) Bind(r *http.Request) error {
	var err error
	if n.WinnerID == 0 {
		err = errors.Join(err, errors.New("'winnerId' is required"))
	}
	return err
}

func (c Controller) EndGameSessionRound(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	data := &EndGameSessionRoundReq{}
	if err := render.Bind(r, data); err != nil {
		utils.BadRequestErr(w, r, err)
		return
	}
	gs, err := c.s.GSession.EndRound(id, data.WinnerID)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, GameSessionRes(gs))
}

func (c Controller) EndGameSession(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	gs, err := c.s.GSession.End(id)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, GameSessionRes(gs))
}

func (c Controller) CancelGameSession(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	if err := c.s.GSession.Cancel(id); err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
