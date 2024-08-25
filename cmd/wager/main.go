package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"

	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/env"
	"github.com/lindeneg/wager/internal/server"
	"github.com/lindeneg/wager/internal/services"
)

//go:embed public/*
var publicFS embed.FS

// TODO use file logger in chi middleware (possibly look into slog)
// TODO setup docker and nginx

func main() {
	e := env.New()
	s, err := db.New("sqlite3", e.ConnectionString)
	if err != nil {
		log.Fatal(err)
	}
	defer s.DB.Close()
	if e.Mode == env.ModeTest {
		fmt.Println("ENV", e)
		s.RunFile("schema")
	}
	p, err := fs.Sub(publicFS, "public")
	if err != nil {
		log.Fatal(err)
	}
	server.New(e, services.InitServices(s), p).Start()
}
