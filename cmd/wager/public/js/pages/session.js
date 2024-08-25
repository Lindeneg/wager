import c from "../shared/c.js";
import http from "../shared/http.js";
import table from "../shared/table.js";
import {
    disableBtn,
    disableEl,
    enableBtn,
    enableEl,
    enableElIf,
    hasResolvedResult,
    hideEl,
    showEl,
    strToIntId,
    tempDisable,
} from "../shared/common.js";

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

const ctx = table.initialize({
    id: "session-table",
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
        selectedResult.appendChild(c.resultBox(key, result, users));
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
        sessionResult.appendChild(c.resultBox(key, result, users));
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
    const limit = Number(ctx.state.search.get("limit") ?? 10);
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
