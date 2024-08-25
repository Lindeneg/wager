package errvar

import (
	"errors"
)

var ErrScanError = errors.New("unexpected src from gs.Scan")
var ErrIDParam = errors.New("could not convert to int")
var ErrHasActiveSession = errors.New("already has active session")
var ErrSessionEnded = errors.New("session has ended")
var ErrSessionActive = errors.New("session has active game-session")
var ErrInviteCodeNotFound = errors.New("'inviteCode' not found")
var ErrGameSessionEnded = errors.New("game-session has ended")
var ErrGameSessionActive = errors.New("game-session has active round")
var ErrGameSessionNoActive = errors.New("game-session has no active round")
var ErrGameSessionWager = errors.New("game-session has resolved wager")
var ErrWinnerIsNotParticipant = errors.New("winner is not participant")
