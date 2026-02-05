package services

import (
	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/pagination"
)

type Participant struct {
	ID        db.ID `json:"id"`
	UserID    db.ID `json:"user_id"`
	SessionID db.ID `json:"session_id"`
}

func (p Participant) ResultID() db.ID {
	return p.UserID
}

type ParticipantService interface {
	FromSession(sessionID db.ID, pg *pagination.P) ([]Participant, error)
}

type pService struct {
	store *db.Datastore
}

func (p *pService) FromSession(sessionID db.ID, pg *pagination.P) ([]Participant, error) {
	pts := make([]Participant, 0)
	rows, err := p.store.DB.Query(
		pagination.MakeQuery(
			"SELECT id, user_id, session_id FROM session_participant WHERE session_id = ?",
			pg),
		sessionID)
	if err != nil {
		return pts, err
	}
	defer rows.Close()
	for rows.Next() {
		var pt Participant
		err = rows.Scan(&pt.ID, &pt.UserID, &pt.SessionID)
		if err != nil {
			return pts, err
		}
		pts = append(pts, pt)
	}
	err = rows.Err()
	if err != nil {
		return pts, err
	}
	return pts, nil
}

func NewParticipantService(store *db.Datastore) ParticipantService {
	return &pService{store}
}
