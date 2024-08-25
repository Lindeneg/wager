package db

import (
	"context"
	"database/sql"
	"os"
	"path"

	_ "github.com/mattn/go-sqlite3"
)

type ID uint

type Datastore struct {
	DB      *sql.DB
	Context context.Context
}

func (d *Datastore) RunFile(name string) error {
	p := path.Join(".", "sql", name+".sql")
	s, err := os.ReadFile(p)
	if err != nil {
		return err
	}
	_, err = d.DB.Exec(string(s))
	if err != nil {
		return err
	}
	return nil
}

func New(driver string, connectionString string) (*Datastore, error) {
	db, err := sql.Open(driver, connectionString)
	if err != nil {
		return nil, err
	}
	ctx := context.Background()
	err = db.PingContext(ctx)
	if err != nil {
		return nil, err
	}
	return &Datastore{db, ctx}, nil
}
