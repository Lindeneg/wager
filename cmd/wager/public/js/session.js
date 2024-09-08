import { tableProps, inProgress } from "./shared.js";

const c = window.clEl;
const http = window.clHttp;
const {
    trim,
    enableBtn,
    enableElIf,
    hideEl,
    showEl,
    showElIf,
    getNameFromId,
    strToIntId,
    tempDisable,
} = window.clCommon;

const STATE_KIND = {
    SESSION_ENDED: "Session Has Ended",
    GAME_INACTIVE: "No Active Game",
    ROUND_IN_PROGRESS: "Round In Progress",
    GAME_IN_PROGRESS: "Game In Progress",
    SELECTED_GAME: "Selected Game",
};

const ROUND_KIND = {
    NEXT: -1,
    TOTAL: 0,
    PREV: 1,
};

const sessionId = Number(window.location.pathname.split("/").pop());

const stateEl = document.getElementById("initial-state");
const activeResultWrapperEl = document.getElementById("active-result-wrapper");
const activeGameEl = document.getElementById("active-game");
const activeResultEl = document.getElementById("active-result");
const activeResultTitleEl = document.getElementById("active-result-title");
const activeGameConfig = document.getElementById("game-config");
const startGameBtn = document.getElementById("start-game");
const endGameBtn = document.getElementById("end-game");
const cancelGameBtn = document.getElementById("cancel-game");
const endSessionBtn = document.getElementById("end-session");
const cancelSessionBtn = document.getElementById("cancel-session");
const newRoundBtn = document.getElementById("new-round");
const endRoundBtn = document.getElementById("end-game-round");
const whoWonBtns = Array.from(document.querySelectorAll(".who-won-btn"));
const whoWonEl = document.getElementById("who-won");
const prevRoundBtn = document.getElementById("prev-round");
const roundCountEl = document.getElementById("round-count");
const nextRoundBtn = document.getElementById("next-round");
const activeGameActionsWrapper = document.getElementById("active-game-actions");
const gameSelectEl = document.getElementById("game-select");
const wagerInputEl = document.getElementById("wager-input");

/** @returns {number} */
const winnerId = () => {
    const btn = whoWonBtns.find((e) => e.classList.contains("success"));
    if (!btn) return -1;
    return strToIntId(btn.id);
};

/**
 * @param {number} round
 * @param {boolean} active
 * @returns {string} */
const createRouteTitle = (round, active) => {
    const s = round < 0 ? "Total" : "Round: " + round;
    return active ? s + "*" : s;
};

/** @returns {string} */
const currentState = () => trim(stateEl.innerText);

const state = {
    sessionId: Number(window.location.pathname.split("/").pop()),
    users: Array.from(document.querySelectorAll("#who-won-container div")).map(
        (e) => ({
            id: strToIntId(e.id),
            name: e.innerText.replaceAll("\n", "").trim(),
        })
    ),
    current: currentState,
    /**
     * @param {string} s
     * @returns {boolean} */
    is: (s) => currentState() === s,
    ...Array.from(document.querySelectorAll("#game-select option")).reduce(
        (acc, cur) => {
            acc.gameName[cur.value] = cur.innerText;
            acc.gameId[cur.innerText] = cur.value;
            return acc;
        },
        { gameName: {}, gameId: {} }
    ),
};

/**
 * @param {number | string} userId
 * @param {Record<string, any>} resultData
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
                innerText:
                    getNameFromId(Number(userId), state.users) + " wins ",
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
                                state.users
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
                innerText:
                    getNameFromId(Number(userId), state.users) + " owes ",
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
                            state.users
                        )}`,
                    })
                );
            })
        )
    );
};

/** @param {number} kind */
const renderSelectedResult = (kind) => {
    let isActive = false;
    let selected = ctx.table.selected();
    if (!selected) {
        const active = ctx.table.active();
        if (!active) return hideEl(activeResultWrapperEl);
        selected = active;
        isActive = true;
    }
    const currentIdx = Number(roundCountEl.dataset.idx);
    const rounds = selected.state().rounds;

    const getRoundResult = () => {
        if (kind === ROUND_KIND.NEXT && currentIdx === 0) {
            return [selected.state().result, -1];
        }
        let idx = 0;
        if (currentIdx > -1) {
            idx = currentIdx + kind;
        }
        return [rounds[idx].result, idx];
    };

    showEl(activeResultWrapperEl, activeGameEl);
    activeResultTitleEl.innerHTML = `Game Session #${selected.val("id")}`;
    activeResultEl.innerHTML = "";

    let result, idx;
    switch (kind) {
        case ROUND_KIND.TOTAL:
            [result, idx] = [selected.state().result, -1];
            break;
        case ROUND_KIND.PREV:
        case ROUND_KIND.NEXT:
            [result, idx] = getRoundResult();
            break;
        default:
            console.error("Unknown ROUND_KIND:", kind);
            break;
    }

    if (!result) return hideEl(activeResultWrapperEl);

    const isTotal = idx < 0;

    const isActiveRound = isTotal
        ? inProgress(selected.state().ended)
        : !!rounds[idx].active;

    roundCountEl.innerText = createRouteTitle(
        isTotal ? -1 : rounds[idx].round,
        isActiveRound
    );
    roundCountEl.dataset.idx = idx;

    enableElIf(idx < rounds.length - 1, prevRoundBtn);
    enableElIf(!isTotal, nextRoundBtn);

    enableElIf(
        isTotal && isActive && !newRoundBtn.hasAttribute("disabled"),
        wagerInputEl
    );

    showElIf(isActive && isTotal, activeGameActionsWrapper);
    showElIf(
        !isTotal || state.is(STATE_KIND.GAME_IN_PROGRESS),
        activeGameConfig
    );
    showElIf(isActiveRound && !isTotal, whoWonEl);

    gameSelectEl.value = state.gameId[selected.state().game];
    wagerInputEl.value = isTotal ? 0 : rounds[idx].wager;

    Object.keys(result).forEach((key) => {
        activeResultEl.appendChild(resultBox(key, result));
    });
};

const ctx = window.clTable.initialize({
    ...tableProps,
    onRender: (_, entry, row) => {
        if (entry.result) {
            row.el.dataset.result = JSON.stringify(entry.result);
        }
        if (entry.rounds && Array.isArray(entry.rounds)) {
            row.el.dataset.rounds = JSON.stringify(entry.rounds);
        }
    },
    onInitialize: (_, row) => {
        const data = {};
        const result = row.data(null, "result");
        if (result) data.result = JSON.parse(result);
        const rounds = row.data(null, "rounds");
        if (rounds) data.rounds = JSON.parse(rounds);
        return data;
    },
    onClick: (row) => {
        ctx.table.highlight(row);
        renderSelectedResult(ROUND_KIND.TOTAL);
    },
    onFetch: async (search) => {
        const disabled = tempDisable(ctx.nextBtn, ctx.prevBtn);
        const { data } = await http.getJson(
            `/game-session/${state.sessionId}?${search}`
        );
        disabled.revert();
        return data.map((e) => ({
            ...e,
            game: state.gameName[e.gameId],
        }));
    },
});

[ctx.nextBtn, ctx.prevBtn].forEach((btn) => {
    btn.addEventListener("click", () => {
        const active = ctx.table.active();
        if (active) {
            ctx.table.highlight(active);
        } else {
            ctx.table.removeHighlight();
        }
    });
});

prevRoundBtn.addEventListener("click", () => {
    renderSelectedResult(ROUND_KIND.PREV);
});

nextRoundBtn.addEventListener("click", () => {
    renderSelectedResult(ROUND_KIND.NEXT);
});

whoWonBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        whoWonBtns.forEach((e) => e.classList.remove("success"));
        btn.classList.add("success");
        enableBtn(endRoundBtn);
    });
});

startGameBtn.addEventListener("click", async () => {
    if (!state.is(STATE_KIND.GAME_INACTIVE)) return;
    const { err } = await http.postJson("/game-session", {
        sessionId,
        gameId: Number(gameSelectEl.value),
        wager: Number(wagerInputEl.value),
    });
    if (err) return;
    window.location.reload();
});

endGameBtn.addEventListener("click", async () => {
    if (!state.is(STATE_KIND.GAME_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const { err } = await http.postJson(
        `/game-session/${active.state().id}/end`
    );
    if (err) return;
    window.location.reload();
});

cancelGameBtn.addEventListener("click", async () => {
    if (!state.is(STATE_KIND.ROUND_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const { err } = await http.delete(`/game-session/${active.state().id}`);
    if (err) return;
    window.location.reload();
});

newRoundBtn.addEventListener("click", async () => {
    if (!state.is(STATE_KIND.GAME_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const id = active.state().id;
    const { err } = await http.postJson(`/game-session/${id}/new-round`, {
        id,
        wager: Number(wagerInputEl.value),
    });
    if (err) return;
    window.location.reload();
});

endRoundBtn.addEventListener("click", async () => {
    if (!state.is(STATE_KIND.ROUND_IN_PROGRESS)) return;
    const active = ctx.table.active();
    if (!active) return;
    const id = active.state().id;
    const { err } = await http.postJson(`/game-session/${id}/end-round`, {
        id,
        winnerId: winnerId(),
    });
    if (err) return;
    window.location.reload();
});

endSessionBtn.addEventListener("click", async () => {
    if (!state.is(STATE_KIND.GAME_INACTIVE)) return;
    const { err } = await http.postJson(`/session/${sessionId}/end`);
    if (err) return;
    window.location.reload();
});

cancelSessionBtn.addEventListener("click", async () => {
    if (!state.is(STATE_KIND.GAME_INACTIVE) || ctx.hasData()) return;
    const { err } = await http.delete(`/session/${sessionId}`);
    if (err) return;
    window.location.assign("/");
});
