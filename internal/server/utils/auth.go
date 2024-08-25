package utils

import (
	"errors"
	"fmt"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"github.com/golang-jwt/jwt/v5"
	"github.com/lindeneg/wager/internal/db"
	"github.com/lindeneg/wager/internal/env"
)

type AuthModel struct {
	ID   db.ID
	Name string
}

const cookieExpire = 7 * 24 * 60 * 60

const AuthModelKey = "auth-model"

func GetCtxAuthModel(r *http.Request) (AuthModel, error) {
	usr := r.Context().Value(AuthModelKey)
	authModel, ok := usr.(AuthModel)
	if !ok {
		return AuthModel{}, errors.New("failed to get auth model from context")
	}
	return authModel, nil
}

func VerifyToken(secret string, value string) (AuthModel, error) {
	validated, err := jwt.Parse(value, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return AuthModel{}, err
	}
	claims, ok := validated.Claims.(jwt.MapClaims)
	if !ok {
		return AuthModel{}, errors.New("failed to get jwt claims")
	}
	id, ok := (claims["id"].(float64))
	if !ok {
		return AuthModel{}, errors.New("failed to get jwt id claim")
	}
	name, ok := (claims["name"].(string))
	if !ok {
		return AuthModel{}, errors.New("failed to get jwt name claim")
	}
	return AuthModel{ID: db.ID(id), Name: name}, nil
}

func CreateToken(secret string, id db.ID, name string) (string, error) {
	t := jwt.NewWithClaims(jwt.SigningMethodHS512,
		jwt.MapClaims{
			"id":   id,
			"name": name,
		})
	s, err := t.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}
	return s, nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func ComparePassword(hash string, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func SetAuthCookie(w http.ResponseWriter, e env.Env, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     e.JWTCookie,
		Value:    token,
		Path:     "/",
		SameSite: http.SameSiteStrictMode,
		HttpOnly: true,
		Secure:   e.Mode == env.ModeProd,
		MaxAge:   cookieExpire,
	})
}

func RemoveAuthCookie(w http.ResponseWriter, e env.Env) {
	http.SetCookie(w, &http.Cookie{
		Name:   e.JWTCookie,
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
}
