package pagination

import "testing"

func TestMakePaginationQuery(t *testing.T) {
	t.Run("nil cfg returns original query", func(t *testing.T) {
		query := "SELECT * from foo ORDER BY created"
		got := MakeQuery(query, nil)
		assertCorrectMessage(t, got, query)

	})

	t.Run("cfg is appended to query", func(t *testing.T) {
		query := "SELECT * from foo ORDER BY created"
		got := MakeQuery(query, New(50, 5))
		want := "SELECT * from foo ORDER BY created LIMIT 50 OFFSET 5"
		assertCorrectMessage(t, got, want)

	})
}

func assertCorrectMessage(t testing.TB, got string, expected string) {
	t.Helper()
	if got != expected {
		t.Errorf("got %q want %q", got, expected)
	}
}
