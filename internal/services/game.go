package services

import (
	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/pagination"
)

type Game struct {
	ID   db.ID  `json:"id"`
	Name string `json:"name"`
}

func (g Game) ResultID() db.ID {
	return g.ID
}

func (g Game) ResultName() string {
	return g.Name
}

type GameService interface {
	Create(name string) (Game, error)
	ByPK(id db.ID) (Game, error)
	All(pg *pagination.P) ([]Game, error)
}

type gService struct {
	store *db.Datastore
}

func (g *gService) Create(name string) (Game, error) {
	game := Game{Name: name}
	r, err := g.store.DB.Exec(
		"INSERT INTO game (name) VALUES (?)",
		name,
	)
	if err != nil {
		return game, err
	}
	id, err := r.LastInsertId()
	if err != nil {
		return game, err
	}
	game.ID = db.ID(id)
	return game, nil
}

func (g *gService) ByPK(id db.ID) (Game, error) {
	var game Game
	err := g.store.DB.QueryRow(
		"SELECT * from game WHERE id = ?",
		id,
	).Scan(&game.ID, &game.Name)
	if err != nil {
		return Game{}, err
	}
	return game, nil
}

func (g *gService) All(p *pagination.P) ([]Game, error) {
	games := make([]Game, 0)
	rows, err := g.store.DB.Query(
		pagination.MakeQuery("SELECT id, name from game ORDER BY id", p))
	if err != nil {
		return games, err
	}
	defer rows.Close()
	for rows.Next() {
		var game Game
		err = rows.Scan(&game.ID, &game.Name)
		if err != nil {
			return games, err
		}
		games = append(games, game)
	}
	err = rows.Err()
	if err != nil {
		return games, err
	}
	return games, nil
}

func NewGameService(store *db.Datastore) GameService {
	return &gService{store}
}
