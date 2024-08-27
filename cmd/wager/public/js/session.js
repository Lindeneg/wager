import { tableProps } from "./shared.js";

const c = window.clEl;
const http = window.clHttp;
const {
    disableBtn,
    disableEl,
    enableBtn,
    enableEl,
    enableElIf,
    hideEl,
    showEl,
    getNameFromId,
    strToIntId,
    tempDisable,
} = window.clCommon;

const STATE = {
    SESSION_ENDED: "Session Has Ended",
    GAME_INACTIVE: "No Active Game",
    ROUND_IN_PROGRESS: "Round In Progress",
    GAME_IN_PROGRESS: "Game In Progress",
};

const sessionId = Number(window.location.pathname.split("/").pop());

const users = Array.from(
    document.querySelectorAll("#who-won-container div")
).map((e) => ({
    id: strToIntId(e.id),
    name: e.innerText.replaceAll("\n", "").trim(),
}));

const gameName = Array.from(
    document.querySelectorAll("#game-select option")
).reduce((acc, cur) => {
    acc[cur.value] = cur.innerText;
    return acc;
}, {});

const sessionTitle = document.getElementById("session-title");
const endSessionBtn = document.getElementById("end-session");
const cancelSessionBtn = document.getElementById("cancel-session");
const newRoundBtn = document.getElementById("new-round");
const endRoundBtn = document.getElementById("end-game-round");
const startGameWrapper = document.getElementById("start-game-wrapper");
const startGameBtn = document.getElementById("start-game");
const endGameBtn = document.getElementById("end-game");
const cancelGameBtn = document.getElementById("cancel-game");
const sessionResult = document.getElementById("session-result");
const selectedWrapper = document.getElementById("selected-wrapper");
const selectedResult = document.getElementById("selected-result");
const selectedTitle = document.getElementById("selected-session-title");
const gameSelect = document.getElementById("game-select");
const wagerInput = document.getElementById("wager-input");
const whoWonWrapper = document.getElementById("who-won");
const whoWonBtns = Array.from(document.querySelectorAll(".who-won-btn"));
const activeGameEl = document.getElementById("active-game");
const activeGameActions = document.getElementById("active-game-actions");
const roundCountEl = document.getElementById("round-count");

const ctx = window.clTable.initialize({
    ...tableProps,
    onRender: (_, entry, row) => {
        if (entry.result) {
            row.el.dataset.result = JSON.stringify(entry.result);
        }
    },
    onInitialize: (_, row) => {
        const data = row.data(null, "result");
        return data ? { result: JSON.parse(data) } : {};
    },
    onClick: (row) => {
        ctx.table.highlight(row);
        renderSelectedResult();
    },
    onFetch: async (search) => {
        const disabled = tempDisable(ctx.nextBtn, ctx.prevBtn);
        const { data } = await http.getJson(
            `/game-session/${sessionId}?${search}`
        );
        disabled.revert();
        return data.map((e) => ({
            ...e,
            game: gameName[e.gameId],
        }));
    },
});

/**
 * @param {number | string} userId
 * @param {Record<string, any>} resultData
 * @param {Record<string, any>[]} users
 * @returns {HTMLDivElement} */
const resultBox = (userId, resultData) => {
    const owesObj = resultData[userId];
    const totalOwe = Object.values(owesObj).reduce((acc, cur) => acc + cur, 0);
    const totalOwed = Object.entries(resultData).reduce((acc, [key, value]) => {
        if (key === userId || !value[userId]) return acc;
        return acc + value[userId];
    }, 0);

    const wrapper = c.append(
        c.div({}, "box"),
        c.append(
            c.any("p", {
                innerText: getNameFromId(Number(userId), users) + " wins ",
            }),
            c.any(
                "b",
                {
                    innerText: totalOwed ? totalOwed : "nothing",
                    style: totalOwed ? "color:#067106" : "",
                },
                ["underline"]
            )
        )
    );

    if (totalOwed) {
        c.append(
            wrapper,
            c.append(
                c.any("ul"),
                ...Object.entries(resultData).map(([key, value]) => {
                    if (key === userId || value[userId] === 0) return null;
                    const owed = value[userId];
                    return c.append(
                        c.any("li"),
                        c.any("i", {
                            innerText: `${owed} from ${getNameFromId(
                                Number(key),
                                users
                            )}`,
                        })
                    );
                })
            )
        );
    }

    c.append(
        wrapper,
        c.append(
            c.any("p", {
                innerText: getNameFromId(Number(userId), users) + " owes ",
            }),
            c.any(
                "b",
                {
                    innerText: totalOwe ? totalOwe : "nothing",
                    style: totalOwe ? "color:rgb(193, 27, 27)" : "",
                },
                ["underline"]
            )
        )
    );

    if (!totalOwe) return wrapper;

    return c.append(
        wrapper,
        c.append(
            c.any("ul"),
            ...Object.entries(owesObj).map(([key, value]) => {
                if (value === 0) return null;
                return c.append(
                    c.any("li"),
                    c.any("i", {
                        innerText: `${value} to ${getNameFromId(
                            Number(key),
                            users
                        )}`,
                    })
                );
            })
        )
    );
};

/**
 * @param {Object} result
 * @returns {bool} */
export const hasResolvedResult = (result) => {
    return (
        Object.values(result).reduce((acc, cur) => {
            return acc + Object.values(cur).reduce((a, c) => a + c, 0);
        }, 0) > 0
    );
};

const winnerId = () => {
    const btn = whoWonBtns.find((e) => e.classList.contains("success"));
    if (!btn) return -1;
    return strToIntId(btn.id);
};

const isState = (s) => sessionTitle.innerText === s;

const setState = (s) => {
    const active = ctx.table.active();
    switch (s) {
        case STATE.SESSION_ENDED:
            hideEl(activeGameEl);
            disableBtn(endSessionBtn, cancelSessionBtn);
            showEl(sessionResult, sessionTitle);
            break;
        case STATE.GAME_INACTIVE:
            hideEl(
                sessionResult,
                whoWonWrapper,
                startGameWrapper,
                activeGameActions,
                roundCountEl
            );
            enableBtn(startGameBtn);
            enableEl(wagerInput, gameSelect);
            showEl(activeGameEl, startGameWrapper);
            enableElIf(!active, endSessionBtn);
            enableElIf(!ctx.hasData(), cancelSessionBtn);
            break;
        case STATE.GAME_IN_PROGRESS:
            disableBtn(
                endSessionBtn,
                cancelSessionBtn,
                cancelGameBtn,
                endRoundBtn
            );
            disableEl(gameSelect);
            enableEl(wagerInput);
            enableBtn(newRoundBtn, endGameBtn);
            hideEl(whoWonWrapper, startGameWrapper);
            showEl(
                sessionResult,
                activeGameEl,
                activeGameActions,
                roundCountEl
            );
            break;
        case STATE.ROUND_IN_PROGRESS:
            disableBtn(
                endSessionBtn,
                cancelSessionBtn,
                newRoundBtn,
                endGameBtn,
                endRoundBtn
            );
            disableEl(gameSelect, wagerInput);
            enableElIf(
                !hasResolvedResult(active.state().result),
                cancelGameBtn
            );
            hideEl(startGameWrapper);
            showEl(
                whoWonWrapper,
                activeGameEl,
                activeGameActions,
                roundCountEl
            );
            break;
        default:
            console.error("Unknown state:", s);
            return;
    }
    if (active) {
        roundCountEl.innerText = "Round: " + active.state().rounds;
    }
    sessionTitle.innerText = s;
};

const renderSelectedResult = () => {
    const selected = ctx.table.selected();
    if (!selected) return hideEl(selectedWrapper);
    showEl(selectedWrapper, selectedResult, selectedTitle);
    selectedTitle.innerText = `#${selected.val("id")} ${selected.val(
        "game"
    )} Result`;
    selectedResult.innerHTML = "";
    const result = selected.state().result;
    Object.keys(result).forEach((key) => {
        selectedResult.appendChild(resultBox(key, result));
    });
};

const renderSessionResult = (result) => {
    if (!result) {
        const active = ctx.table.active();
        if (!active) return hideEl(sessionResult);
        showEl(sessionResult);
        result = active.state().result;
    }
    sessionResult.innerHTML = "";
    Object.keys(result).forEach((key) => {
        sessionResult.appendChild(resultBox(key, result));
    });
};

[ctx.nextBtn, ctx.prevBtn].forEach((btn) => {
    btn.addEventListener("click", () => {
        const active = ctx.table.active();
        if (active) {
            ctx.table.highlight(active);
        } else {
            ctx.table.removeHighlight();
        }
        hideEl(selectedWrapper);
    });
});

whoWonBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        whoWonBtns.forEach((e) => e.classList.remove("success"));
        btn.classList.add("success");
        enableBtn(endRoundBtn);
    });
});

startGameBtn.addEventListener("click", async () => {
    if (!isState(STATE.GAME_INACTIVE)) return;
    const { data, err } = await http.postJson("/game-session", {
        sessionId,
        gameId: Number(gameSelect.value),
        wager: Number(wagerInput.value),
    });
    if (err) return;
    data.game = gameName[data.gameId];
    const pageData = ctx.state.data[1];
    const limit = ctx.getLimit();
    if (pageData.length >= limit) {
        pageData.pop();
    }
    pageData.unshift(data);
    ctx.state.data = {
        1: pageData,
    };
    ctx.renderCurrentPage();
    ctx.table.highlight(ctx.table.active());
    renderSessionResult();
    setState(STATE.ROUND_IN_PROGRESS);
});

endGameBtn.addEventListener("click", async () => {
    if (!isState(STATE.GAME_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const { err } = await http.postJson(
        `/game-session/${active.state().id}/end`
    );
    if (err) return;
    window.location.reload();
});

cancelGameBtn.addEventListener("click", async () => {
    if (!isState(STATE.ROUND_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const { err } = await http.delete(`/game-session/${active.state().id}`);
    if (err) return;
    window.location.reload();
});

newRoundBtn.addEventListener("click", async () => {
    if (!isState(STATE.GAME_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const id = active.state().id;
    const { err } = await http.postJson(`/game-session/${id}/new-round`, {
        id,
        wager: Number(wagerInput.value),
    });
    if (err) return;
    const newRounds = Number(active.val("rounds")) + 1;
    active.state().rounds = newRounds;
    active.col("rounds").innerText = newRounds;
    roundCountEl.innerText = "Round: " + newRounds;
    setState(STATE.ROUND_IN_PROGRESS);
});

endRoundBtn.addEventListener("click", async () => {
    if (!isState(STATE.ROUND_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const id = active.state().id;
    const { err, data } = await http.postJson(`/game-session/${id}/end-round`, {
        id,
        winnerId: winnerId(),
    });
    if (err) return;
    active.state().result = data.result;
    whoWonBtns.forEach((e) => e.classList.remove("success"));
    renderSessionResult();
    setState(STATE.GAME_IN_PROGRESS);
});

endSessionBtn.addEventListener("click", async () => {
    if (!isState(STATE.GAME_INACTIVE)) return;
    const { err, data } = await http.postJson(`/session/${sessionId}/end`);
    if (err) return;
    renderSessionResult(data.result);
    setState(STATE.SESSION_ENDED);
});

cancelSessionBtn.addEventListener("click", async () => {
    if (!isState(STATE.GAME_INACTIVE) || ctx.hasData()) return;
    const { err } = await http.delete(`/session/${sessionId}`);
    if (err) return;
    window.location.assign("/");
});
