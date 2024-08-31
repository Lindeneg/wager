package services

import (
	"github.com/lindeneg/wager/internal/db"
)

type Services struct {
	User        UserService
	Game        GameService
	Participant ParticipantService
	GSession    GameSessionService
	Session     SessionService
}

func InitServices(store *db.Datastore) *Services {
	u := NewUserService(store)
	pt := NewParticipantService(store)
	r := NewGameSessionRoundService(store)
	s := NewSessionService(store, u)
	return &Services{
		User:        u,
		Game:        NewGameService(store),
		Participant: pt,
		GSession:    NewGameSessionService(store, s, r, pt),
		Session:     s,
	}
}
