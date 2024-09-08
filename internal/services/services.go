package services

import (
	"github.com/lindeneg/wager/internal/db"
)

type Services struct {
	User        UserService
	Result      ResultService
	Game        GameService
	Participant ParticipantService
	GSession    GameSessionService
	Session     SessionService
}

func InitServices(store *db.Datastore) *Services {
	u := NewUserService(store)
	rs := NewResultService(store, u)
	pt := NewParticipantService(store)
	r := NewGameSessionRoundService(store)
	s := NewSessionService(store, u, rs)
	return &Services{
		User:        u,
		Result:      rs,
		Game:        NewGameService(store),
		Participant: pt,
		GSession:    NewGameSessionService(store, s, r, pt),
		Session:     s,
	}
}
