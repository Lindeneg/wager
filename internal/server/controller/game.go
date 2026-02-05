package controller

import (
	"errors"
	"net/http"

	"github.com/go-chi/render"
	"github.com/lindeneg/wager/internal/server/utils"
	"github.com/lindeneg/wager/internal/services"
)

type GamesReponse []services.Game

type GameReponse services.Game

func (g GamesReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (g GameReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (c Controller) Games(w http.ResponseWriter, r *http.Request) {
	gms, err := c.s.Game.All(nil)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, GamesReponse(gms))
}

type NewGameReq struct {
	Name string `json:"name"`
}

func (g *NewGameReq) Bind(r *http.Request) error {
	if g.Name == "" {
		return errors.New("'name' is required")
	}
	if len(g.Name) < 2 || len(g.Name) > 12 {
		return errors.New("'name' must be between 2-12 characters")
	}
	return nil
}

func (c Controller) NewGame(w http.ResponseWriter, r *http.Request) {
	data := &NewGameReq{}
	if err := render.Bind(r, data); err != nil {
		utils.BadRequestErr(w, r, err)
		return
	}
	gm, err := c.s.Game.Create(data.Name)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusCreated)
	render.Render(w, r, GameReponse(gm))
}
