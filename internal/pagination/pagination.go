package pagination

import (
	"fmt"
	"net/url"
	"strconv"
)

type P struct {
	Limit  int
	Offset int
}

func New(limit int, offset int) *P {
	return &P{Limit: limit, Offset: offset}
}

func FromQuery(values url.Values) *P {
	return New(
		intFromQuery("limit", values, 10),
		intFromQuery("offset", values, 0))
}

func MakeQuery(sql string, p *P) string {
	if p == nil {
		return sql
	}
	q := fmt.Sprintf("LIMIT %d OFFSET %d", p.Limit, p.Offset)
	return fmt.Sprintf("%s %s", sql, q)
}

func intFromQuery(name string, values url.Values, d int) int {
	if !values.Has(name) {
		return d
	}
	if l, err := strconv.Atoi(values.Get(name)); err == nil {
		return l
	}
	return d
}
