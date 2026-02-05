package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/lindeneg/wager/internal/server/utils"
)

func (m Middleware) SetAuthUser(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		cookie, err := r.Cookie(m.e.JWTCookie)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		authModel, err := utils.VerifyToken(m.e.JWTSecret, cookie.Value)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		usr, err := m.s.User.ByPK(authModel.ID)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		if usr.Name != authModel.Name {
			next.ServeHTTP(w, r)
			return
		}
		if r.URL.Path == "/login" || r.URL.Path == "/signup" {
			http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
			return
		}
		ctx = context.WithValue(ctx, utils.AuthModelKey, authModel)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
	return http.HandlerFunc(fn)
}

func (m Middleware) EnsureAuthUser(next http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		if _, err := utils.GetCtxAuthModel(r); err == nil {
			next.ServeHTTP(w, r)
			return
		}
		if strings.Contains(r.URL.Path, "/api/") {
			utils.RenderErrEx(w, r, http.StatusUnauthorized, nil)
		} else {
			http.Redirect(w, r, "/login", http.StatusTemporaryRedirect)
		}
	}
	return http.HandlerFunc(fn)
}
