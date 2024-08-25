package services

import (
	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/pagination"
)

type User struct {
	ID   db.ID  `json:"id"`
	Name string `json:"name"`
}

func (u User) ResultID() db.ID {
	return u.ID
}

func (u User) ResultName() string {
	return u.Name
}

type UserWithPassword struct {
	User
	Password string
}

func (u UserWithPassword) ResultID() db.ID {
	return u.ID
}

type UserService interface {
	Create(name, password string) (User, error)
	ByPK(id db.ID) (UserWithPassword, error)
	ByName(name string) (UserWithPassword, error)
	BySession(sessionID db.ID) ([]User, error)
	All(p *pagination.P) ([]User, error)
}

type uService struct {
	store *db.Datastore
}

func (u *uService) Create(name, password string) (User, error) {
	usr := User{Name: name}
	r, err := u.store.DB.Exec(
		"INSERT INTO user (name, password) VALUES (?, ?)",
		name, password,
	)
	if err != nil {
		return usr, err
	}
	id, err := r.LastInsertId()
	if err != nil {
		return usr, err
	}
	usr.ID = db.ID(id)
	return usr, nil
}

func (u *uService) ByPK(id db.ID) (UserWithPassword, error) {
	var usr UserWithPassword
	err := u.store.DB.QueryRow(
		"SELECT * from user WHERE id = ?",
		id,
	).Scan(&usr.ID, &usr.Name, &usr.Password)
	if err != nil {
		return usr, err
	}
	return usr, nil
}

func (u *uService) ByName(name string) (UserWithPassword, error) {
	var usr UserWithPassword
	err := u.store.DB.QueryRow(
		"SELECT id, name, password from user WHERE name = ?",
		name,
	).Scan(&usr.ID, &usr.Name, &usr.Password)
	if err != nil {
		return usr, err
	}
	return usr, nil
}

func (u *uService) BySession(sessionID db.ID) ([]User, error) {
	usrs := make([]User, 0)
	rows, err := u.store.DB.Query(`SELECT u.id, u.name
FROM main.session_participant p
         JOIN user u ON p.user_id = u.id
WHERE p.session_id = ?`, sessionID)
	if err != nil {
		return usrs, err
	}
	defer rows.Close()
	for rows.Next() {
		var usr User
		err = rows.Scan(&usr.ID, &usr.Name)
		if err != nil {
			return usrs, err
		}
		usrs = append(usrs, usr)
	}
	err = rows.Err()
	if err != nil {
		return usrs, err
	}
	return usrs, nil
}

func (u *uService) All(p *pagination.P) ([]User, error) {
	usrs := make([]User, 0)
	rows, err := u.store.DB.Query(
		pagination.MakeQuery("SELECT id, name from user ORDER BY id", p))
	if err != nil {
		return usrs, err
	}
	defer rows.Close()
	for rows.Next() {
		var usr User
		err = rows.Scan(&usr.ID, &usr.Name)
		if err != nil {
			return usrs, err
		}
		usrs = append(usrs, usr)
	}
	err = rows.Err()
	if err != nil {
		return usrs, err
	}
	return usrs, nil
}

func NewUserService(store *db.Datastore) UserService {
	return &uService{store}
}
