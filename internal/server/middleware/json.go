package middleware

import (
	"net/http"

	"github.com/lindeneg/wager/internal/server/utils"
)

func (m Middleware) JSONContentType(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		utils.JSONContentType(w)
		next.ServeHTTP(w, r)
	})
}
