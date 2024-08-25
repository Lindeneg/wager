import { getNameFromID, ensureArray } from "./common.js";

/**
 * @template {HTMLElement} T
 * @param {T} parent
 * @param {HTMLElement[]} [children = []]
 * @returns T
 * */
const append = (parent, ...children) => {
    children.forEach((child) => {
        if (!child) return;
        parent.appendChild(child);
    });
    return parent;
};

/**
 * @param {string} element
 * @param {Record<string, unknown>} [props = {}]
 * @param {string[] | string} [classes = []]
 * @returns {HTMLElement} */
const any = (element, props = {}, classes = []) => {
    const el = document.createElement(element);
    Object.entries(props).forEach(([key, value]) => {
        el[key] = value;
    });
    if (classes.length > 0) {
        if (typeof classes === "string") {
            el.classList.add(classes);
        } else {
            el.classList.add(...classes);
        }
    }
    return el;
};

/**
 * @param {Record<string, unknown>} [props = {}]
 * @param {string[] | string} [classes = []]
 * @returns {HTMLDivElement} */
const div = (props = {}, classes = []) => {
    return any("div", props, classes);
};

/**
 * @param {HTMLElement} el
 * @param {EventListener | null} [onClick = null]
 * @returns {HTMLElement} */
const withListener = (el, onClick) => {
    if (!el) return el;
    el.addEventListener("click", onClick);
    return el;
};

/**
 * @param {Record<string, unknown>} [props = {}]
 * @param {string[] | string} [classes = []]
 * @param {EventListener | null} [onClick = null]
 * @param {string} [as = "button"]
 * @returns {HTMLButtonElement} */
const button = (props = {}, classes = [], onClick = null, as = "button") => {
    const btn = any(as, { type: "button", ...props }, [
        "pure-button",
        ...ensureArray(classes),
    ]);
    return withListener(btn, onClick);
};

/**
 * @param {Record<string, unknown>} [props = {}]
 * @param {string[] | string} [classes = []]
 * @param {EventListener | null} [onChange = null]
 * @returns {HTMLInputElement} */
const input = (props = {}, classes = [], onChange = null) => {
    const inp = any("input", props, ["pure-input", ...ensureArray(classes)]);
    if (typeof onChange === "function") {
        inp.addEventListener("change", onChange);
    }
    return inp;
};

/**
 * @param {EventListener} onChange
 * @param {HTMLOptionElement[]} [options = []]
 * @param {Record<string, unknown>} [props = {}]
 * @param {string[] | string} [classes = []]
 * @returns {HTMLSelectElement} */
const select = (onChange, options = [], props = {}, classes = []) => {
    /** @type {HTMLSelectElement} */
    const sel = any("select", props, ["pure-select", ...ensureArray(classes)]);
    sel.addEventListener("change", onChange);
    options.forEach((option) => {
        sel.options.add(option);
    });
    return sel;
};

/**
 * @param {unknown} value
 * @param {string} displayName
 * @param {Record<string, unknown>} [props = {}]
 * @param {string[] | string} [classes = []]
 * @returns {HTMLOptionElement} */
const option = (value, displayName, props = {}, classes = []) => {
    const opt = any("option", props, classes);
    opt.value = value;
    opt.innerText = displayName;
    return opt;
};

/**
 * @param {Record<string, unknown>} [props = {}]
 * @param {string[] | string} [classes = []]
 * @returns {HTMLOptionElement} */
const hr = (props = {}, classes = []) => {
    return any("hr", props, classes);
};

/**
 * @param {number | string} userId
 * @param {Record<string, any>} resultData
 * @param {Record<string, any>[]} users
 * @returns {HTMLDivElement} */
const resultBox = (userId, resultData, users) => {
    const owesObj = resultData[userId];
    const totalOwe = Object.values(owesObj).reduce((acc, cur) => acc + cur, 0);
    const totalOwed = Object.entries(resultData).reduce((acc, [key, value]) => {
        if (key === userId || !value[userId]) return acc;
        return acc + value[userId];
    }, 0);

    const wrapper = append(
        div({}, "box"),
        append(
            any("p", {
                innerText: getNameFromID(Number(userId), users) + " wins ",
            }),
            any(
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
        append(
            wrapper,
            append(
                any("ul"),
                ...Object.entries(resultData).map(([key, value]) => {
                    if (key === userId || value[userId] === 0) return null;
                    const owed = value[userId];
                    return append(
                        any("li"),
                        any("i", {
                            innerText: `${owed} from ${getNameFromID(
                                Number(key),
                                users
                            )}`,
                        })
                    );
                })
            )
        );
    }

    append(
        wrapper,
        append(
            any("p", {
                innerText: getNameFromID(Number(userId), users) + " owes ",
            }),
            any(
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

    return append(
        wrapper,
        append(
            any("ul"),
            ...Object.entries(owesObj).map(([key, value]) => {
                if (value === 0) return null;
                return append(
                    any("li"),
                    any("i", {
                        innerText: `${value} to ${getNameFromID(
                            Number(key),
                            users
                        )}`,
                    })
                );
            })
        )
    );
};

export default {
    any,
    div,
    button,
    input,
    select,
    option,
    hr,
    resultBox,
    withListener,
    append,
};
