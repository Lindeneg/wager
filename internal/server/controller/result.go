package controller

import (
	"net/http"

	"github.com/go-chi/render"
	"github.com/lindeneg/wager/internal/result"
	"github.com/lindeneg/wager/internal/server/utils"
)

type ResultReponse result.ResultMap

func (rr ResultReponse) Render(w http.ResponseWriter, r *http.Request) error {
	return nil
}

func (c Controller) Result(w http.ResponseWriter, r *http.Request) {
	rr, err := c.s.Result.Current()
	if err != nil {
		utils.RenderErrSlim(w, r, err)
		return
	}
	render.Status(r, http.StatusOK)
	render.Render(w, r, ResultReponse(rr))
}
