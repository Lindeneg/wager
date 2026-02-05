package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/render"
	"github.com/lindeneg/wager/internal/errvar"
	"github.com/lindeneg/wager/internal/server/utils"
)

type LoginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (l *LoginReq) Bind(r *http.Request) error {
	var err error
	if l.Username == "" {
		err = errors.Join(err, errors.New("'username' is required"))
	}
	if l.Password == "" {
		err = errors.Join(err, errors.New("'password' is required"))
	}
	l.Username = strings.ToLower(l.Username)
	return err
}

func (c Controller) Login(w http.ResponseWriter, r *http.Request) {
	data := &LoginReq{}
	if err := render.Bind(r, data); err != nil {
		utils.BadRequestErr(w, r, err)
		return
	}
	usr, err := c.s.User.ByName(data.Username)
	if err != nil {
		utils.NotFoundErr(w, r)
		return
	}
	if ok := utils.ComparePassword(usr.Password, data.Password); !ok {
		utils.NotFoundErr(w, r)
		return
	}
	t, err := utils.CreateToken(c.e.JWTSecret, usr.ID, usr.Name)
	if err != nil {
		utils.InternalErr(w, r)
		return
	}
	utils.SetAuthCookie(w, c.e, t)
	w.WriteHeader(http.StatusNoContent)
}

type SignupReq struct {
	Username   string `json:"username"`
	Password   string `json:"password"`
	InviteCode string `json:"inviteCode"`
}

func (l *SignupReq) Bind(r *http.Request) error {
	var err error
	if len(l.Username) < 3 || len(l.Username) > 12 {
		err = errors.Join(err, errors.New("'username' must be more between 3-12 characters"))
	}
	if len(l.Password) < 8 || len(l.Username) > 32 {
		err = errors.Join(err, errors.New("'password' must be more between 8-32 characters"))
	}
	if l.InviteCode == "" {
		err = errors.Join(err, errors.New("'inviteCode' is required"))
	}
	l.Username = strings.ToLower(l.Username)
	return err
}

func (c Controller) Signup(w http.ResponseWriter, r *http.Request) {
	data := &SignupReq{}
	if err := render.Bind(r, data); err != nil {
		utils.BadRequestErr(w, r, err)
		return
	}
	if data.InviteCode != c.e.InviteCode {
		utils.RenderErr(w, r, errvar.ErrInviteCodeNotFound)
		return
	}
	_, err := c.s.User.ByName(data.Username)
	if err == nil {
		utils.UnprocessableErr(w, r)
		return
	}
	hash, err := utils.HashPassword(data.Password)
	if err != nil {
		utils.InternalErr(w, r)
		return
	}
	usr, err := c.s.User.Create(data.Username, hash)
	if err != nil {
		utils.InternalErr(w, r)
		return
	}
	t, err := utils.CreateToken(c.e.JWTSecret, usr.ID, data.Username)
	if err != nil {
		utils.InternalErr(w, r)
		return
	}
	err = c.s.Result.UpdateUsers()
	if err != nil {
		utils.InternalErr(w, r)
		return
	}
	utils.SetAuthCookie(w, c.e, t)
	w.WriteHeader(http.StatusCreated)
}

func (c Controller) Signout(w http.ResponseWriter, r *http.Request) {
	utils.RemoveAuthCookie(w, c.e)
	w.WriteHeader(http.StatusNoContent)
}
