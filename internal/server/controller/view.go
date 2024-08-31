package controller

import (
	"math"
	"net/http"

	"github.com/lindeneg/wager/internal/pagination"
	"github.com/lindeneg/wager/internal/result"
	"github.com/lindeneg/wager/internal/server/utils"
	"github.com/lindeneg/wager/internal/services"
	"github.com/lindeneg/wager/internal/templates"
)

type AuthProps struct {
	Title string
	Name  string
}

func (c Controller) LoginPage(w http.ResponseWriter, r *http.Request) {
	c.t.auth.Execute(w, r, AuthProps{
		Title: "Bankmand Login",
		Name:  "login",
	})
}

func (c Controller) SignupPage(w http.ResponseWriter, r *http.Request) {
	c.t.auth.Execute(w, r, AuthProps{
		Title: "Bankmand Signup",
		Name:  "signup",
	})
}

type commonProps struct {
	Title       string
	Results     []templates.ResultBox
	Cols        []string
	Rows        []templates.SessionRow
	MaxPage     int
	CurrentPage int
	Limit       int
	Offset      int
	SizeConfig  []int
	Count       int
}

var sizeConfig = []int{10, 20, 50, 100}

func newCommonProps(
	c []string, r result.ResultMap, p *pagination.P, u []services.User, count int,
) commonProps {
	l := float64(p.Limit)
	o := float64(p.Offset)
	return commonProps{
		Title:       "Bankmanden",
		Results:     templates.NewResultBoxes(r, u),
		Cols:        c,
		MaxPage:     int(math.Max((math.Ceil((float64(count)+l)/l) - 1), 1)),
		CurrentPage: int(math.Ceil(o/l)) + 1,
		Limit:       p.Limit,
		Offset:      p.Offset,
		SizeConfig:  sizeConfig,
		Count:       count,
	}
}

func (c Controller) HomePage(w http.ResponseWriter, r *http.Request) {
	rs, err := c.s.Session.Result()
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	usrs, err := c.s.User.All(nil)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	p := pagination.FromQuery(r.URL.Query())
	s, err := c.s.Session.AllWithSessions(p)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	count, err := c.s.Session.Count()
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	props := newCommonProps(templates.SessionCols, rs, p, usrs, count)
	props.Title += " Sessions"
	props.Rows = templates.NewSessionRows(s, usrs)
	c.t.home.Execute(w, r, props)
}

type sessionProps struct {
	commonProps
	Games             []services.Game
	Users             []services.User
	IsSessionOver     bool
	ActiveGameSession *services.GameSession
	Wager             int
	EndSession        bool
	CancelSession     bool
	NewRound          bool
	EndRound          bool
	StartGame         bool
	EndGame           bool
	CancelGame        bool
	HideActiveResult  bool
}

func (c Controller) SessionPage(w http.ResponseWriter, r *http.Request) {
	id, err := utils.IDParam(r)
	if err != nil {
		utils.NotFoundErr(w, r)
		return
	}
	ss, err := c.s.Session.ByPK(id)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	p := pagination.FromQuery(r.URL.Query())
	gs, err := c.s.GSession.FromSession(id, p)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	games, err := c.s.Game.All(nil)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	count, err := c.s.GSession.CountFromSession(id)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	usrs, err := c.s.User.BySession(id)
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	isSessionOver := ss.Ended != nil
	var activeGameSession *services.GameSession = nil
	var rs result.ResultMap
	wager := 0
	if isSessionOver {
		rs = ss.Result
	} else if len(gs) > 0 && gs[0].Ended == nil {
		activeGameSession = &gs[0]
		rs = gs[0].Result
		if active, idx := activeGameSession.Rounds.Active(); idx > -1 {
			wager = active.Wager
		}
	}
	props := sessionProps{
		commonProps:       newCommonProps(templates.GameSessionCols, rs, p, usrs, count),
		Games:             games,
		Users:             usrs,
		IsSessionOver:     isSessionOver,
		ActiveGameSession: activeGameSession,
		Wager:             wager,
		EndSession:        !isSessionOver && len(gs) > 0 && activeGameSession == nil,
		CancelSession:     !isSessionOver && len(gs) == 0,
		NewRound:          !isSessionOver && activeGameSession != nil && wager == 0,
		EndRound:          !isSessionOver && activeGameSession != nil && wager > 0,
		StartGame:         !isSessionOver && activeGameSession == nil,
		EndGame: !isSessionOver && activeGameSession != nil &&
			wager == 0 && activeGameSession.Result.ResolvedOnce(),
		CancelGame: !isSessionOver && activeGameSession != nil &&
			len(activeGameSession.Rounds) == 1 && !activeGameSession.Result.ResolvedOnce(),
		HideActiveResult: !isSessionOver && activeGameSession == nil,
	}
	props.Title += " Session"
	props.Rows = templates.NewGameSessionRows(gs, games)
	c.t.session.Execute(w, r, props)
}
