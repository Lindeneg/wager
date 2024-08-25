package services

import "time"

// https://stackoverflow.com/questions/30744965/how-to-get-the-pointer-of-return-value-from-function-call
func GetPtr[T any](x T) *T {
	return &x
}

func NewTime() time.Time {
	return time.Now().UTC()
}

func FormatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}
