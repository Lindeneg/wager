package server

import (
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/lindeneg/wager/internal/env"
	"github.com/lindeneg/wager/internal/server/controller"
	"github.com/lindeneg/wager/internal/server/middleware"
	"github.com/lindeneg/wager/internal/services"
)

type Server struct {
	r    *chi.Mux
	port int
}

func New(e env.Env, s *services.Services, p fs.FS) *Server {
	m := middleware.New(e, s)
	c := controller.New(e, s)

	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Compress(5))
	r.Use(m.SetAuthUser)

	r.Handle("/favicon.ico", http.FileServer(http.FS(p)))
	r.Handle("/public/*", http.StripPrefix("/public/", http.FileServer(http.FS(p))))

	r.Get("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("pong"))
	})

	r.Mount("/api", apiRouter(c, m))
	r.Mount("/", viewRouter(c, m))

	return &Server{r, e.Port}
}

func (s *Server) Start() {
	addr := fmt.Sprintf("localhost:%d", s.port)
	fmt.Printf("Listening on: http://%s\n", addr)
	log.Fatal(http.ListenAndServe(addr, s.r))
}

func apiRouter(c controller.Controller, m middleware.Middleware) chi.Router {
	r := chi.NewRouter()

	r.Use(m.JSONContentType)

	r.Post("/login", c.Login)
	r.Post("/signup", c.Signup)
	r.Get("/signout", c.Signout)

	r.Route("/", func(r chi.Router) {
		r.Use(m.EnsureAuthUser)

		r.Get("/user", c.Users)
		r.Get("/user/{id}", c.User)

		r.Get("/result", c.Result)

		r.Route("/game", func(r chi.Router) {
			r.Get("/", c.Games)
			r.Post("/", c.NewGame)
		})

		r.Route("/game-session", func(r chi.Router) {
			r.Get("/{id}", c.GameSessions)
			r.Post("/", c.NewGameSession)
			r.Post("/{id}/new-round", c.NewGameSessionRound)
			r.Post("/{id}/end-round", c.EndGameSessionRound)
			r.Post("/{id}/end", c.EndGameSession)
			r.Delete("/{id}", c.CancelGameSession)
		})

		r.Route("/session", func(r chi.Router) {
			r.Get("/", c.Sessions)
			r.Get("/slim", c.SessionsSlim)
			r.Get("/{id}/has-active", c.HasActiveGameSession)
			r.Get("/has-active", c.HasActiveSession)
			r.Get("/{id}", c.Session)
			r.Post("/", c.NewSession)
			r.Post("/{id}/end", c.EndSession)
			r.Delete("/{id}", c.CancelSession)
		})
	})

	return r
}

func viewRouter(c controller.Controller, m middleware.Middleware) chi.Router {
	r := chi.NewRouter()

	r.Get("/login", c.LoginPage)
	r.Get("/signup", c.SignupPage)

	r.Route("/", func(r chi.Router) {
		r.Use(m.EnsureAuthUser)

		r.Get("/session/{id}", c.SessionPage)
		r.Get("/", c.HomePage)
	})
	return r
}
