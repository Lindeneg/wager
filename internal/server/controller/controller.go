package controller

import (
	"github.com/lindeneg/wager/internal/env"
	"github.com/lindeneg/wager/internal/server/utils"
	"github.com/lindeneg/wager/internal/services"
	"github.com/lindeneg/wager/internal/templates"
)

type Controller struct {
	t struct {
		home    utils.Template
		auth    utils.Template
		session utils.Template
	}
	e env.Env
	s *services.Services
}

func New(e env.Env, s *services.Services) Controller {
	c := Controller{e: e, s: s}
	c.t.home = utils.ParseFS(
		templates.FS, "index.gohtml", "common.gohtml")
	c.t.session = utils.ParseFS(templates.FS, "session.gohtml", "common.gohtml")
	c.t.auth = utils.ParseFS(templates.FS, "auth.gohtml", "common.gohtml")
	return c
}
