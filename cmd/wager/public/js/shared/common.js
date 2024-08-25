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

/** @template T
 * @param {T | T[]} val
 * @returns {T[]} */
export const ensureArray = (val) => {
    if (Array.isArray(val)) return val;
    return [val];
};

/** @param {HTMLElement} el */
export const disableEl = (...el) => {
    el.forEach((e) => {
        e.setAttribute("disabled", "true");
    });
};

/** @param {HTMLElement} el */
export const enableEl = (...el) => {
    el.forEach((e) => {
        e.removeAttribute("disabled");
    });
};

/** @param {HTMLButtonElement} btns */
export const disableBtn = (...btns) => {
    btns.forEach((btn) => {
        disableEl(btn);
        btn.classList.add("pure-button-disabled");
    });
};

/** @param {HTMLButtonElement} btns */
export const enableBtn = (...btns) => {
    btns.forEach((btn) => {
        enableEl(btn);
        btn.classList.remove("pure-button-disabled");
    });
};

/**
 * @param {string} str
 * @returns {string}*/
export const capitalize = (str) => {
    if (!str) return "";
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
};

/** @param {HTMLElement} el */
export const hideEl = (...el) => {
    el.forEach((e) => {
        e.classList.add("hidden");
    });
};

/** @param {HTMLElement} el */
export const showEl = (...el) => {
    el.forEach((e) => {
        e.classList.remove("hidden");
    });
};

/**
 * @param {any} condition
 * @param {HTMLElement} el */
export const showElIf = (condition, ...el) => {
    if (!!condition) return showEl(...el);
    hideEl(...el);
};

/**
 * @param {any} condition
 * @param {HTMLButtonElement} el */
export const enableElIf = (condition, ...btns) => {
    if (!!condition) return enableBtn(...btns);
    disableBtn(...btns);
};

/** @param {HTMLButtonElement[]} btns */
export const tempDisable = (...btns) => {
    /** @type {Map<HTMLButtonElement, boolean>} */
    const enabledMap = new Map();
    btns.forEach((btn) => {
        enabledMap.set(
            btn,
            !btn.hasAttribute("disabled") &&
                !btn.classList.contains("pure-button-disabled")
        );
        disableEl(btn);
    });
    return {
        revert: () => {
            for (const [btn, enabled] of enabledMap.entries()) {
                enableElIf(enabled, btn);
            }
        },
    };
};

/**
 * @param {number} id
 * @param {Record<string, any>[]} obj
 * @returns {string} */
export const getNameFromID = (id, obj) => {
    const found = obj.find((e) => e.id === id);
    if (found) return found.name;
    return "";
};

/** @param {HTMLElement | HTMLElement[]} visible
 *  @param {HTMLElement | HTMLElement[]} hidden */
export const switchVisible = (visible, hidden) => {
    showEl(...ensureArray(visible));
    hideEl(...ensureArray(hidden));
};

/**
 * @param {string} str
 * @returns {number | null} */
export const strToIntId = (str) => {
    const match = str.match(/^.+-(\d+)/);
    if (match && match[1]) return Number(match[1]);
    return null;
};

/**
 * @param {string} str
 * @returns {{id: number, name: string} | null} */
export const strToUser = (str) => {
    const match = str.match(/^.+-(.+)-(\d)/);
    if (match[1] && match[2]) {
        return {
            name: match[1],
            id: Number(match[2]),
        };
    }
    return null;
};

/**
 * @param {string} started
 * @param {string} ended
 * @returns {string} */
export const durationInMins = (started, ended) => {
    if (!started || !ended) return "-";
    return `${Math.ceil(
        (new Date(ended) - new Date(started)) / 1000 / 60
    )} mins`;
};
