package utils

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/render"
	e "github.com/lindeneg/wager/internal/errvar"
	"github.com/mattn/go-sqlite3"
)

type ErrorResponse struct {
	Message string `json:"message"`
	Status  int    `json:"status"`
	Error   string `json:"error"`
}

func (e *ErrorResponse) Render(w http.ResponseWriter, r *http.Request) error {
	render.Status(r, e.Status)
	return nil
}

func message(code int) string {
	switch code {
	case http.StatusBadRequest:
		return "The requested action could not be exercised due to malformed syntax."
	case http.StatusUnauthorized:
		return "The provided credentials are either invalid or has insufficient privilege to perform the requested action."
	case http.StatusNotFound:
		return "The requested resource could not be found."
	case http.StatusUnprocessableEntity:
		return "The request was well-formed but not honored. Perhaps the action trying to be performed has already been done?"
	default:
		return "Something went wrong. Please try again later."
	}

}

func code(err error) int {
	switch err.(type) {
	case sqlite3.Error:
		err = err.(sqlite3.Error).ExtendedCode
	}
	switch err {
	case sql.ErrNoRows, e.ErrInviteCodeNotFound, e.ErrIDParam:
		return http.StatusNotFound
	case sqlite3.ErrConstraintUnique, e.ErrSessionEnded, e.ErrGameSessionEnded,
		e.ErrSessionActive, e.ErrGameSessionActive, e.ErrGameSessionWager,
		e.ErrWinnerIsNotParticipant, e.ErrGameSessionNoActive, e.ErrHasActiveSession:
		return http.StatusUnprocessableEntity
	default:
		return http.StatusInternalServerError
	}
}

func includeErr(err error) bool {
	switch err.(type) {
	case sqlite3.Error:
		err = err.(sqlite3.Error).ExtendedCode
	}
	return err != sql.ErrNoRows && err != sqlite3.ErrConstraintUnique
}

func BadRequestErr(w http.ResponseWriter, r *http.Request, err error) {
	RenderErrEx(w, r, http.StatusBadRequest, err)
}

func NotFoundErr(w http.ResponseWriter, r *http.Request) {
	RenderErrEx(w, r, http.StatusNotFound, nil)
}

func InternalErr(w http.ResponseWriter, r *http.Request) {
	RenderErrEx(w, r, http.StatusInternalServerError, nil)
}

func UnprocessableErr(w http.ResponseWriter, r *http.Request) {
	RenderErrEx(w, r, http.StatusUnprocessableEntity, nil)
}

func RenderErr(w http.ResponseWriter, r *http.Request, err error) {
	fmt.Printf("ERROR [%s] '%s'\n", r.Context().Value(middleware.RequestIDKey), err)
	RenderErrEx(w, r, code(err), err)
}

func RenderErrSlim(w http.ResponseWriter, r *http.Request, err error) {
	s := code(err)
	var e error
	if includeErr(err) && s != http.StatusInternalServerError {
		e = err
	}
	fmt.Printf("ERROR [%s] '%s'\n", r.Context().Value(middleware.RequestIDKey), err)
	RenderErrEx(w, r, code(err), e)
}

func RenderErrEx(w http.ResponseWriter, r *http.Request, status int, err error) {
	msg := message(status)
	if strings.Contains(r.URL.Path, "/api/") {
		JSONContentType(w)
		e := ""
		if err != nil {
			e = err.Error()
		}
		render.Render(w, r, &ErrorResponse{msg, status, e})
		return
	}
	HTMLContentType(w)
	http.Error(w, msg, status)
}
