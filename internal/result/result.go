package result

import (
	"encoding/json"
	"math"

	"github.com/lindeneg/wager/internal/db"
)

type Resultable interface {
	ResultID() db.ID
}

type ResultMapable interface {
	ResultMap() ResultMap
}

type ResultOwe map[db.ID]int
type ResultMap map[db.ID]ResultOwe

func FromString(s string) ResultMap {
	var r ResultMap
	err := json.Unmarshal([]byte(s), &r)
	if err != nil {
		panic("failed to unmarshal ResultMap")
	}
	return r
}

func (r ResultMap) AddWinner(winnerID db.ID, wager int) {
	won := int(math.Floor(float64(wager) / float64((len(r) - 1))))
	for k, v := range r {
		if k == winnerID {
			continue
		}
		v[winnerID] += won
	}
}

func (r ResultMap) Resolve() {
	for key, oweTo := range r {
		for oweToKey, oweAmount := range oweTo {
			owedAmount := r[oweToKey][key]
			if oweAmount >= owedAmount {
				oweAmount -= owedAmount
				owedAmount = 0
			} else {
				owedAmount -= oweAmount
				oweAmount = 0
			}
			oweTo[oweToKey] = oweAmount
			r[oweToKey][key] = owedAmount
		}
	}
}

func (r ResultMap) ResolvedOnce() bool {
	sum := 0
	for _, obj := range r {
		for _, val := range obj {
			sum += val
		}
	}
	return sum > 0
}

func (r ResultMap) Exists(id db.ID) bool {
	_, ok := r[id]
	return ok
}

func (r ResultMap) String() string {
	rs, err := json.Marshal(r)
	if err != nil {
		panic("failed to marshal ResultMap")
	}
	return string(rs)
}

func New[T Resultable](objs []T) ResultMap {
	l := len(objs)
	rm := make(ResultMap, l)
	for _, obj := range objs {
		id := obj.ResultID()
		ro := make(ResultOwe, l-1)
		for _, o := range objs {
			ido := o.ResultID()
			if ido == id {
				continue
			}
			ro[ido] = 0
		}
		rm[id] = ro
	}
	return rm
}

// TODO be smarter..
func Merge[T Resultable, M ResultMapable](objs []T, results ...M) ResultMap {
	r := New(objs)
	for _, rs := range results {
		rm := rs.ResultMap()
		for owerID, owerObj := range rm {
			for oweToID, oweToVal := range owerObj {
				r[owerID][oweToID] += oweToVal
			}
		}
	}
	return r
}
