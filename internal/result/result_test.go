package result

import (
	"testing"

	"github.com/lindeneg/wager/internal/db"
)

type user struct {
	ID db.ID
}

func (u user) ResultID() db.ID {
	return u.ID
}

type participant struct {
	ID     db.ID
	UserID db.ID
}

func (p participant) ResultID() db.ID {
	return p.UserID
}

type gameSession struct {
	Result ResultMap
}

func (g gameSession) ResultMap() ResultMap {
	return g.Result
}

func TestNewResult(t *testing.T) {
	t.Run("can create new result from user slice", func(t *testing.T) {
		got := New([]user{
			{ID: 1},
			{ID: 2},
			{ID: 3},
		})
		assertCorrectValue(t, got, 1, [2]int{2, 0}, [2]int{3, 0})
		assertCorrectValue(t, got, 2, [2]int{1, 0}, [2]int{3, 0})
		assertCorrectValue(t, got, 3, [2]int{1, 0}, [2]int{2, 0})
	})

	t.Run("can create new result from participant slice", func(t *testing.T) {
		got := New([]participant{
			{ID: 1, UserID: 4},
			{ID: 2, UserID: 5},
			{ID: 3, UserID: 6},
		})
		assertCorrectValue(t, got, 4, [2]int{5, 0}, [2]int{6, 0})
		assertCorrectValue(t, got, 5, [2]int{4, 0}, [2]int{6, 0})
		assertCorrectValue(t, got, 6, [2]int{4, 0}, [2]int{5, 0})
	})
}

func TestAddResultWinner(t *testing.T) {
	t.Run("can add winner to result", func(t *testing.T) {
		got := New([]user{
			{ID: 1},
			{ID: 2},
			{ID: 3},
		})
		got.AddWinner(1, 100)
		assertCorrectValue(t, got, 1, [2]int{2, 0}, [2]int{3, 0})
		assertCorrectValue(t, got, 2, [2]int{1, 50}, [2]int{3, 0})
		assertCorrectValue(t, got, 3, [2]int{1, 50}, [2]int{2, 0})

		got.AddWinner(3, 200)
		assertCorrectValue(t, got, 1, [2]int{2, 0}, [2]int{3, 100})
		assertCorrectValue(t, got, 2, [2]int{1, 50}, [2]int{3, 100})
		assertCorrectValue(t, got, 3, [2]int{1, 50}, [2]int{2, 0})
	})
}

func TestResolveResult(t *testing.T) {
	t.Run("can resolve result", func(t *testing.T) {
		got := New([]user{
			{ID: 1},
			{ID: 2},
			{ID: 3},
		})

		got.AddWinner(1, 100)
		got.AddWinner(3, 200)
		got.Resolve()

		assertCorrectValue(t, got, 1, [2]int{2, 0}, [2]int{3, 50})
		assertCorrectValue(t, got, 2, [2]int{1, 50}, [2]int{3, 100})
		assertCorrectValue(t, got, 3, [2]int{1, 0}, [2]int{2, 0})

		got.AddWinner(2, 300)
		got.AddWinner(1, 50)
		got.Resolve()

		assertCorrectValue(t, got, 1, [2]int{2, 75}, [2]int{3, 25})
		assertCorrectValue(t, got, 2, [2]int{1, 0}, [2]int{3, 0})
		assertCorrectValue(t, got, 3, [2]int{1, 0}, [2]int{2, 50})
	})
}

func TestMerge(t *testing.T) {
	t.Run("can merge ResultMaps", func(t *testing.T) {
		usrs := []user{
			{ID: 1},
			{ID: 2},
			{ID: 3},
		}
		g1 := gameSession{New(usrs)}
		g2 := gameSession{New(usrs)}
		g3 := gameSession{New(usrs)}

		g1.Result.AddWinner(1, 100)
		g1.Result.AddWinner(3, 200)

		g2.Result.AddWinner(1, 200)
		g2.Result.AddWinner(2, 300)

		g3.Result.AddWinner(3, 150)
		g3.Result.AddWinner(2, 50)

		got := Merge(usrs, g1, g2, g3)

		assertCorrectValue(t, got, 1, [2]int{2, 175}, [2]int{3, 175})
		assertCorrectValue(t, got, 2, [2]int{1, 150}, [2]int{3, 175})
		assertCorrectValue(t, got, 3, [2]int{1, 150}, [2]int{2, 175})

		got.Resolve()

		assertCorrectValue(t, got, 1, [2]int{2, 25}, [2]int{3, 25})
		assertCorrectValue(t, got, 2, [2]int{1, 0}, [2]int{3, 0})
		assertCorrectValue(t, got, 3, [2]int{1, 0}, [2]int{2, 0})
	})
}

func assertCorrectValue(t testing.TB, got ResultMap, id int, expected ...[2]int) {
	t.Helper()
	target, ok := got[db.ID(id)]
	if !ok {
		t.Errorf("id %d not found in ResultMap", id)
	}
	for _, e := range expected {
		eid, expectedVal := e[0], e[1]
		gotVal, ok := target[db.ID(eid)]
		if !ok {
			t.Errorf("id %d not found in ResultOwe", eid)
		}
		if gotVal != expectedVal {
			t.Errorf("got value %d want %d for id %d on target %d", gotVal, expectedVal, eid, id)
		}
	}
}
