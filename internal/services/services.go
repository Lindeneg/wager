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
	g := NewGameSessionService(store, pt)
	return &Services{
		User:        u,
		Game:        NewGameService(store),
		Participant: pt,
		GSession:    g,
		Session:     NewSessionService(store, u, g, pt),
	}
}
