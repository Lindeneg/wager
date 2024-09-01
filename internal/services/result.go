package services

import (
	"database/sql"
	"errors"

	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/result"
)

type ResultService interface {
	Current() (result.ResultMap, error)
	Update(rm result.ResultMap) error
	UpdateUsers() error
}

type rService struct {
	store *db.Datastore
	u     UserService
}

func (r *rService) create() (result.ResultMap, error) {
	u, err := r.u.All(nil)
	if err != nil {
		return result.ResultMap{}, err
	}
	rm := result.New(u)
	_, err = r.store.DB.Exec("INSERT INTO result (data) VALUES (?)",
		rm.String())
	if err != nil {
		return rm, err
	}
	return rm, nil
}

func (r *rService) Current() (result.ResultMap, error) {
	var sResult *string
	err := r.store.DB.QueryRow("SELECT data FROM result WHERE id = 1").Scan(&sResult)
	if err != nil {
		if err == sql.ErrNoRows {
			return r.create()
		}
		return result.ResultMap{}, err
	}
	if sResult == nil {
		return result.ResultMap{}, errors.New("failed to parse result.data")
	}
	return result.FromString(*sResult), nil
}

func (r *rService) Update(rm result.ResultMap) error {
	c, err := r.Current()
	if err != nil {
		return err
	}
	u, err := r.u.All(nil)
	if err != nil {
		return err
	}
	rmn := result.Merge(u, c, rm)
	rmn.Resolve()
	_, err = r.store.DB.Exec("UPDATE result SET data = ? WHERE id = 1", rmn.String())
	return nil
}

func (r *rService) UpdateUsers() error {
	c, err := r.Current()
	if err != nil {
		return err
	}
	u, err := r.u.All(nil)
	if err != nil {
		return err
	}
	_, err = r.store.DB.Exec("UPDATE result SET data = ? WHERE id = 1",
		result.Merge(u, c).String())
	if err != nil {
		return err
	}
	return nil
}

func NewResultService(s *db.Datastore, u UserService) ResultService {
	return &rService{s, u}
}
