package utils

import (
	"bytes"
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"github.com/lindeneg/wager/internal/services"
)

func HTMLContentType(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/html; charset=utf8")
}

func JSONContentType(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json; charset=utf8")
}

type Template struct {
	htmlTpl *template.Template
}

func ParseFS(fs fs.FS, patterns ...string) Template {
	tpl := template.New(patterns[0])
	tpl = tpl.Funcs(
		template.FuncMap{
			"args": func(els ...any) []any {
				return els
			},
			"hidden": func(cond bool, els ...string) string {
				if cond {
					els = append(els, "hidden")
				}
				return strings.Join(els, " ")
			},
			"userID": func(user services.User) string {
				return fmt.Sprintf("userid-%d", user.ID)
			},
		})
	tpl, err := tpl.ParseFS(fs, patterns...)
	if err != nil {
		log.Fatal(err)
	}
	return Template{tpl}
}

func (t Template) Execute(w http.ResponseWriter, r *http.Request, data interface{}) {
	HTMLContentType(w)
	tpl := t.htmlTpl
	var buf bytes.Buffer
	err := tpl.Execute(&buf, data)
	if err != nil {
		RenderErr(w, r, err)
		return
	}
	io.Copy(w, &buf)
}
