package main

import (
	"log"
	"math/rand"
	"os"

	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/env"
	"github.com/lindeneg/wager/internal/server/utils"
	"github.com/lindeneg/wager/internal/services"
)

type seedGameSession struct {
	gameID db.ID
	wager  int
	after  func(id db.ID)
}

type seedSession struct {
	gameSessions []seedGameSession
	users        []db.ID
}

var users = []string{
	"miles",
	"bill",
	"jane",
}

var games = []string{
	"Golf",
	"Fifa",
	"CS",
	"Trackmania",
	"Rocket League",
}

var wagers = []int{50, 100, 150, 200, 300, 400, 800, 1150}

func main() {
	if len(os.Args) < 4 {
		log.Fatal("seed MODE ACTIVE")
	}
	var seedMode string
	var open bool
	if len(os.Args) > 3 {
		seedMode = os.Args[2]
		open = os.Args[3] == "open"
	}

	e := env.New()
	s, err := db.New("sqlite3", e.ConnectionString)
	if err != nil {
		log.Fatal(err)
	}
	defer s.DB.Close()

	srv := services.InitServices(s)

	s.RunFile("drop")
	s.RunFile("schema")

	if seedMode == "none" {
		return
	}

	for _, u := range users {
		h, _ := utils.HashPassword("test-password")
		srv.User.Create(u, h)
	}
	for _, g := range games {
		srv.Game.Create(g)
	}

	var sessions []seedSession
	if seedMode == "fixed" {
		sessions = fixedSessions(srv)
	} else {
		sessions = randomSessions(srv, 53)
	}

	for i, ss := range sessions {
		sn, _ := srv.Session.Create(ss.users)
		for _, gs := range ss.gameSessions {
			gsn, _ := srv.GSession.Create(sn.ID, gs.gameID, gs.wager)
			gs.after(gsn.ID)
			srv.GSession.End(gsn.ID)
		}
		if !open || i < len(sessions)-1 {
			srv.Session.End(sn.ID)
		}
	}
}

func roll() bool {
	return rand.Intn(2) > 0
}

func wager() int {
	return wagers[rand.Intn(len(wagers))]
}

func game() db.ID {
	return db.ID(rand.Intn(len(games)) + 1)
}

func winner(p []db.ID) db.ID {
	return p[rand.Intn(len(p))]
}

func participants() []db.ID {
	n := rand.Intn(3)
	if n >= 2 {
		return []db.ID{1, 3}
	} else if n >= 1 {

		return []db.ID{2, 3}
	}
	return []db.ID{1, 2, 3}
}

func randomSessions(srv *services.Services, n int) []seedSession {
	s := []seedSession{}
	for i := 0; i < n; i++ {
		p := participants()
		s = append(s, seedSession{
			users:        p,
			gameSessions: randomGameSessions(srv, p, rand.Intn(19)+1),
		})
	}
	return s
}

func randomGameSessions(srv *services.Services, p []db.ID, n int) []seedGameSession {
	gs := []seedGameSession{}
	for i := 0; i < n; i++ {
		gs = append(gs, seedGameSession{
			gameID: game(),
			wager:  wager(),
			after: func(id db.ID) {
				srv.GSession.EndRound(id, winner(p))
				if roll() {
					srv.GSession.NewRound(id, wager())
					srv.GSession.EndRound(id, winner(p))
				}
			},
		})
	}
	return gs
}

func fixedSessions(srv *services.Services) []seedSession {
	return []seedSession{
		{
			users: []db.ID{1, 2, 3},
			gameSessions: []seedGameSession{
				{
					gameID: 2,
					wager:  200,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 1)
						srv.GSession.NewRound(id, 400)
						srv.GSession.EndRound(id, 2)
					},
				},
				{
					gameID: 3,
					wager:  400,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 1)
						srv.GSession.NewRound(id, 200)
						srv.GSession.EndRound(id, 1)
					},
				},
				{
					gameID: 1,
					wager:  100,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 2)
					},
				},
				{
					gameID: 4,
					wager:  400,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 3)
					},
				},
			},
		},
		{
			users: []db.ID{1, 2, 3},
			gameSessions: []seedGameSession{
				{
					gameID: 2,
					wager:  200,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 1)
						srv.GSession.NewRound(id, 400)
						srv.GSession.EndRound(id, 2)
					},
				},
				{
					gameID: 3,
					wager:  400,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 1)
						srv.GSession.NewRound(id, 200)
						srv.GSession.EndRound(id, 1)
					},
				},
				{
					gameID: 3,
					wager:  400,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 2)
					},
				},
				{
					gameID: 4,
					wager:  800,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 3)
					},
				},
			},
		},
		{
			users: []db.ID{1, 2},
			gameSessions: []seedGameSession{
				{
					gameID: 2,
					wager:  200,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 2)
						srv.GSession.NewRound(id, 200)
						srv.GSession.EndRound(id, 2)
					},
				},
				{
					gameID: 2,
					wager:  600,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 1)
					},
				},
			},
		},
		{
			users: []db.ID{1, 3},
			gameSessions: []seedGameSession{
				{
					gameID: 2,
					wager:  200,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 3)
					},
				},
				{
					gameID: 2,
					wager:  400,
					after: func(id db.ID) {
						srv.GSession.EndRound(id, 1)
						srv.GSession.NewRound(id, 800)
					},
				},
			},
		},
	}
}
