import c from "./c.js";
import {
    enableElIf,
    disableBtn,
    durationInMins,
    showEl,
    hideEl,
    strToIntId,
} from "./common.js";

/** @typedef {Object} Row
 * @property {HTMLTableRowElement} el
 * @property {(name: string) => HTMLTableCellElement | null} col
 * @property {(name: string) => string} val
 * @property {(name: string, item: string) => string} data
 * @property {() => Record<string, unknown>} state */

/** @typedef {Record<string, unknown>} Data */

/** @typedef {(name: string, value: string) => string | HTMLElement} Transform */

/** @typedef {(row: Row) => void} OnClick */

/** @typedef {(search: string) => Promise<Data[]>} OnFetch */

/**
 * @typedef {Object} State
 * @property {URLSearchParams} search
 * @property {Record<number, Data[]>} data */

/** @typedef {Object} Config
 * @property {string} id
 * @property {Transform | null} transform
 * @property {OnClick | null} onClick
 * @property {OnFetch} onFetch */

const IN_PROGRESS_VALS = [null, "<nil>", "In Progress"];

/** @type {State} */
const state = {
    search: new URLSearchParams(window.location.search),
    data: {},
};

/**
 * @param {string} key
 * @param {string} value */
const setSearchSoft = (key, value) => {
    state.search.set(key, value);
    window.history.replaceState(null, null, "?" + state.search.toString());
};

const page = (() => {
    const currentPage = document.getElementById("current-page");
    const maxPage = Number(document.getElementById("max-page").innerText);
    const current = () => Number(currentPage.innerText);
    const max = () => current() === maxPage;
    const min = () => current() === 1;
    return {
        current,
        max,
        min,
        inc: () => {
            if (max()) return false;
            currentPage.innerText = current() + 1;
            return true;
        },
        dec: () => {
            if (min()) return false;
            currentPage.innerText = current() - 1;
            return true;
        },
    };
})();

/** @param {Config} config */
const initialize = ({ id, transform, onClick, onFetch }) => {
    setSearchSoft("limit", Number(state.search.get("limit") ?? 10));
    setSearchSoft("offset", Number(state.search.get("offset") ?? 0));
    /** @type {HTMLButtonElement} */
    const prevBtn = document.getElementById("previous-btn");
    /** @type {HTMLButtonElement} */
    const nextBtn = document.getElementById("next-btn");
    /** @type {HTMLTableElement} */
    const root = document.getElementById(id);
    /** @type {HTMLTableSectionElement} */
    const body = root.getElementsByTagName("tbody")[0];
    /** @type {string[]} */
    const cols = [...root.querySelectorAll("th")].map((e) =>
        e.innerText.toLowerCase()
    );
    /** @type {Row | null} */
    let selectedRow = null;

    const hasData = () => {
        for (const key in state.data) {
            const val = state.data[key];
            if (val && Array.isArray(val) && val.length > 0) {
                return true;
            }
        }
        return false;
    };

    /** @param {HTMLTableRowElement} tr */
    const createRow = (tr) => {
        const col = (name) => tr.querySelector(`td[data-name=${name}]`);
        return {
            el: tr,
            col,
            val: (name) => col(name).innerText ?? "",
            data: (name, item) =>
                name ? col(name).dataset[item] ?? "" : tr.dataset[item] ?? "",
            state: () => {
                const id = strToIntId(tr.id);
                const data = state.data[page.current()];
                const item = data.find((e) => e.id === id);
                return item || null;
            },
        };
    };

    /** @type {() => Row[]} */
    const rows = () =>
        [...body.getElementsByTagName("tr")].map((el) => createRow(el));

    const padRows = () => {
        const r = rows();
        const limit = Number(state.search.get("limit") ?? 10);
        if (r.length >= limit) return;
        const diff = limit - r.length;
        for (let i = 0; i < diff; i++) {
            const row = createRow(
                c.append(
                    c.any("tr", {}, onClick ? "clickable-row" : []),
                    ...cols.map((col) => {
                        const td = c.any("td");
                        td.dataset.name = col;
                        return td;
                    })
                )
            );
            body.appendChild(
                onClick ? c.withListener(row.el, () => onClick(row)) : row.el
            );
        }
    };

    /** @param {number | string} id */
    const rowId = (id) => `${root.id}-row-${id}`;

    /**
     * @param {number | string} id
     * @param {string} name */
    const cellId = (id, name) => `${root.id}-row-${id}-data-${name}`;

    /** @returns {Row | null} */
    const active = () => {
        return rows().find((r) => r.data(null, "isActive") === "1") ?? null;
    };

    /** @param {Row | null} [row = null] */
    const highlightActiveSession = (row = null) => {
        const activeRow = row ?? active();
        if (!activeRow) return;
        selectedRow = null;
        activeRow.el.classList.add("selected-row");
        return rows().forEach((r) => {
            if (r.el.id === activeRow.el.id) return;
            r.el.classList.remove("selected-row");
        });
    };

    /** @param {Row} row */
    const highlight = (row) => {
        if (row.data(null, "isActive") === "1") {
            return highlightActiveSession(row);
        }
        rows().forEach((r) => {
            if (r.el.id === row.el.id) {
                if (r.el.classList.contains("selected-row")) {
                    selectedRow = null;
                    r.el.classList.remove("selected-row");
                    return highlightActiveSession();
                } else {
                    r.el.classList.add("selected-row");
                    selectedRow = r;
                    return;
                }
            }
            r.el.classList.remove("selected-row");
        });
    };

    const removeHighlight = () => {
        selectedRow = null;
        rows().forEach((r) => r.el.classList.remove("selected-row"));
    };

    /**
     * @param {string} col
     * @param {Data} data
     * @param {Row} row
     * @returns {string | HTMLElement} */
    const handleTransform = (col, data, row) => {
        const val = data[col];
        switch (col) {
            case "started":
            case "ended":
                if (IN_PROGRESS_VALS.includes(val)) {
                    row.el.dataset.isActive = "1";
                    return "In Progress";
                }
                return new Date(val).toLocaleString();
            case "duration":
                if (IN_PROGRESS_VALS.includes(data["ended"])) {
                    return "-";
                }
                return durationInMins(data["started"], data["ended"]);
            case "result":
                console.log("RESULT", result);
            default:
                break;
        }
        if (typeof transform === "function") {
            return transform(col, val, row);
        }
        return val;
    };

    const renderCurrentPage = () => {
        const data = state.data[page.current()];
        if (!data) return;
        rows().forEach((row, idx) => {
            const entry = data[idx];
            if (!entry) return hideEl(row.el);
            showEl(row.el);
            cols.forEach((col) => {
                const cell = row.col(col);
                const tranformed = handleTransform(col, entry, row);
                cell.innerHTML = "";
                if (tranformed instanceof HTMLElement) {
                    cell.appendChild(tranformed);
                } else {
                    cell.innerText = tranformed;
                }
                cell.id = cellId(row.val("id"), col);
            });
            if (entry.result) {
                row.el.dataset.result = JSON.stringify(entry.result);
            }
            row.el.id = rowId(row.val("id"));
        });
    };

    /**
     * @param {"min" | "max"} pageKey
     * @param {HTMLButtonElement} btn
     * @param {HTMLButtonElement} otherBtn */
    const onPageChangeClick = async (pageKey, btn, otherBtn) => {
        if (page[pageKey]()) return disableBtn(btn);
        const limit = Number(state.search.get("limit") ?? 10);
        const offset = Number(state.search.get("offset") ?? 0);
        const normalizer = active() ? 1 : 0;
        setSearchSoft(
            "offset",
            pageKey === "min"
                ? Math.max(offset - (limit - normalizer), 0)
                : limit + offset - normalizer
        );
        page[pageKey === "min" ? "dec" : "inc"]();
        if (page[pageKey]()) disableBtn(btn);
        enableElIf(!page[pageKey === "min" ? "max" : "min"](), otherBtn);
        const currentPage = page.current();
        if (state.data[currentPage]) {
            return renderCurrentPage();
        }
        state.data[currentPage] = await onFetch(state.search.toString());
        renderCurrentPage();
    };

    const pageSizeSelect = document.getElementById("size-select");
    pageSizeSelect.addEventListener("change", ({ target }) => {
        state.search.set("limit", target.value);
        state.search.set("offset", 0);
        window.location.search = state.search.toString();
    });

    prevBtn.addEventListener(
        "click",
        onPageChangeClick.bind(null, "min", prevBtn, nextBtn)
    );

    nextBtn.addEventListener(
        "click",
        onPageChangeClick.bind(null, "max", nextBtn, prevBtn)
    );

    const hasClickListener = typeof onClick === "function";

    state.data[page.current()] = rows().map((row) => {
        if (hasClickListener) {
            row.el.addEventListener("click", () => onClick(row));
        }
        const r = row.data(null, "result");
        const initial = r ? { result: JSON.parse(r) } : {};
        return cols.reduce((acc, col) => {
            if (col === "id") {
                acc[col] = Number(row.val(col));
            } else {
                acc[col] = row.val(col);
            }
            return acc;
        }, initial);
    });

    padRows();
    renderCurrentPage();

    return {
        state,
        table: {
            root,
            body,
            cols,
            rows,
            selected: () => selectedRow,
            active,
            highlight,
            removeHighlight,
            rowId,
            cellId,
        },
        page,
        prevBtn,
        nextBtn,
        hasData,
        renderCurrentPage,
    };
};

export default {
    initialize,
};
