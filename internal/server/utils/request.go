package utils

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/errvar"
)

func IDParam(r *http.Request) (db.ID, error) {
	sid := chi.URLParam(r, "id")
	if sid == "" {
		return 0, errvar.ErrIDParam
	}
	id, err := strconv.Atoi(sid)
	if err != nil {
		return 0, errvar.ErrIDParam
	}
	return db.ID(id), nil
}
