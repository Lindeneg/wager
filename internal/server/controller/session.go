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

type SessionsReponse []services.SessionWithGames

type SlimSessionsReponse []services.Session

type SessionReponse services.SessionWithGames

func (SessionsReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (SlimSessionsReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (SessionReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (c Controller) Sessions(w http.ResponseWriter, r *http.Request) {
	ss, err := c.s.Session.AllWithSessions(pagination.FromQuery(r.URL.Query()))
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, SessionsReponse(ss))
}

func (c Controller) SessionsSlim(w http.ResponseWriter, r *http.Request) {
	ss, err := c.s.Session.All(pagination.FromQuery(r.URL.Query()))
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, SlimSessionsReponse(ss))
}

func (c Controller) Session(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	ss, err := c.s.Session.ByPKWithSessions(id)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, SessionReponse(ss))
}

type BoolResponse bool

func (BoolResponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (c Controller) HasActiveSession(w http.ResponseWriter, r *http.Request) {
	render.Status(r, http.StatusOK)
	render.Render(w, r, BoolResponse(c.s.Session.HasActive()))
}

type NewSessionReq struct {
	Users []db.ID `json:"users"`
}

func (n *NewSessionReq) Bind(r *http.Request) error {
	var err error
	if len(n.Users) <= 1 {
		err = errors.Join(err, errors.New("'users' is required and must contain minimum 2 ids"))
	}
	return err
}

func (c Controller) NewSession(w http.ResponseWriter, r *http.Request) {
	data := &NewSessionReq{}
	if err := render.Bind(r, data); err != nil {
		utils.BadRequestErr(w, r, err)
		return
	}
	if c.s.Session.HasActive() {
		utils.RenderErr(w, r, errvar.ErrHasActiveSession)
		return
	}
	ss, err := c.s.Session.Create(data.Users)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusCreated)
	render.Render(w, r, SessionReponse(ss))
}

func (c Controller) EndSession(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	if _, err := c.s.GSession.ActiveFromSession(id); err == nil {
		utils.RenderErrSlim(w, r, errvar.ErrSessionActive)
		return
	}
	ss, err := c.s.Session.End(id)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, SessionReponse(ss))
}

func (c Controller) CancelSession(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	if _, err := c.s.GSession.ActiveFromSession(id); err == nil {
		utils.RenderErrSlim(w, r, errvar.ErrSessionActive)
		return
	}
	if err = c.s.Session.Cancel(id); err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
