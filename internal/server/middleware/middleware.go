package middleware

import (
	"github.com/lindeneg/wager/internal/env"
	"github.com/lindeneg/wager/internal/services"
)

type Middleware struct {
	e env.Env
	s *services.Services
}

func New(e env.Env, s *services.Services) Middleware {
	return Middleware{e: e, s: s}
}
