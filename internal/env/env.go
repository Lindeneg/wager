package env

import (
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Mode string

const (
	ModeTest Mode = "test"
	ModeDev  Mode = "dev"
	ModeProd Mode = "prod"
)

type Env struct {
	Port             int
	ConnectionString string
	InviteCode       string
	JWTSecret        string
	JWTCookie        string
	Mode             Mode
}

func envFileFromMode(m Mode) string {
	switch m {
	case ModeTest:
		return ".test.env"
	case ModeProd:
		return ".prod.env"
	default:
		return ".env"
	}
}

func intOrDefault(s string, d int) int {
	v, err := strconv.Atoi(os.Getenv(s))
	if err != nil {
		return d
	}
	return v
}

func requiredValue(s string) string {
	e := os.Getenv(s)
	if e == "" {
		log.Fatal(fmt.Sprintf("%s is missing from environment", s))
	}
	return e
}

func optionalValue(s string, d string) string {
	e := os.Getenv(s)
	if e == "" {
		return d
	}
	return e
}

func New() Env {
	mode := ModeDev
	if len(os.Args) > 1 {
		m := Mode(os.Args[1])
		if m != ModeProd && m != ModeTest && m != ModeDev {
			log.Fatal(fmt.Sprintf("unknown mode: '%s'", m))
		}
		mode = m
	}
	err := godotenv.Load(envFileFromMode(mode))
	if err != nil {
		log.Fatal(err)
	}
	return Env{
		Port:             intOrDefault("PORT", 5000),
		ConnectionString: requiredValue("CONNECTION_STRING"),
		InviteCode:       requiredValue("INVITE_CODE"),
		JWTSecret:        requiredValue("JWT_SECRET"),
		JWTCookie:        optionalValue("JWT_COOKIE", "auth-wager-user"),
		Mode:             mode,
	}
}
