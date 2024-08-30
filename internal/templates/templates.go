package templates

import (
	"embed"
	"strings"

	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/result"
	"github.com/lindeneg/wager/internal/services"
)

//go:embed *.gohtml
var FS embed.FS

type ResultBox struct {
	ID        db.ID
	Name      string
	TotalOwe  int
	TotalOwed int
	Owe       map[string]int
	Owed      map[string]int
}

func NewResultBoxes(r result.ResultMap, u []services.User) []ResultBox {
	var rb []ResultBox
	for _, usr := range u {
		rb = append(rb, newResultBox(r, u, usr))
	}
	return rb
}

var SessionCols = []string{"id", "users", "sessions", "started", "ended", "duration"}
var GameSessionCols = []string{"id", "game", "rounds", "started", "ended", "duration"}

type SessionRow map[string]any

func NewSessionRows(sessions []services.SessionWithGames, usrs []services.User) []SessionRow {
	return newRows(sessions, func(s services.SessionWithGames) SessionRow {
		return SessionRow{
			"id":       s.ID,
			"users":    userIDsToNames(s.Users, usrs),
			"sessions": len(s.GameSessions),
			"started":  s.Started,
			"ended":    s.Ended,
			"duration": 0,
		}
	})
}

func NewGameSessionRows(sessions []services.GameSession, games []services.Game) []SessionRow {
	return newRows(sessions, func(s services.GameSession) SessionRow {
		return SessionRow{
			"id":       s.ID,
			"game":     getNameFromID(s.GameID, games),
			"rounds":   len(s.Rounds),
			"started":  s.Started,
			"result":   s.Result,
			"ended":    s.Ended,
			"duration": 0,
		}
	})
}

func newRows[T any](t []T, cb func(T) SessionRow) []SessionRow {
	srs := []SessionRow{}
	var active SessionRow = nil
	for _, s := range t {
		sr := cb(s)
		if sr["ended"] == nil {
			if active != nil {
				panic("two active sessions")
			}
			active = sr
		} else {
			srs = append(srs, sr)
		}
	}
	if active != nil {
		srs = append([]SessionRow{active}, srs...)
	}
	return srs
}

type nameable interface {
	ResultID() db.ID
	ResultName() string
}

func getNameFromID[T nameable](id db.ID, n []T) string {
	for _, e := range n {
		if e.ResultID() == id {
			return e.ResultName()
		}
	}
	return ""
}

func userIDsToNames(ids services.Users, usrs []services.User) string {
	s := []string{}
	for _, id := range ids {
		s = append(s, getNameFromID(id, usrs))
	}
	return strings.Join(s, ", ")
}

func newResultBox(r result.ResultMap, u []services.User, usr services.User) ResultBox {
	rb := ResultBox{
		ID:        usr.ID,
		Name:      usr.Name,
		TotalOwe:  0,
		TotalOwed: 0,
		Owe:       map[string]int{},
		Owed:      map[string]int{},
	}
Outer:
	for id, owe := range r {
		if id == usr.ID {
		Inner:
			for i, v := range owe {
				if v == 0 {
					continue Inner
				}
				rb.Owe[getNameFromID(i, u)] = v
				rb.TotalOwe += v
			}
			continue Outer
		}
		v := owe[usr.ID]
		if v == 0 {
			continue Outer
		}
		rb.Owed[getNameFromID(id, u)] = v
		rb.TotalOwed += v
	}
	return rb
}
