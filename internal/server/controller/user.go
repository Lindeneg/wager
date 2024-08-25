package controller

import (
	"net/http"

	"github.com/go-chi/render"
	"github.com/lindeneg/wager/internal/server/utils"
	"github.com/lindeneg/wager/internal/services"
)

type UsersReponse []services.User

type UserReponse services.User

func (u UsersReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (u UserReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (c Controller) Users(w http.ResponseWriter, r *http.Request) {
	usrs, err := c.s.User.All(nil)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, UsersReponse(usrs))
}

func (c Controller) User(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	usr, err := c.s.User.ByPK(id)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, UserReponse{usr.ID, usr.Name})
}
