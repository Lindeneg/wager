import c from "./c.js";
import { hideEl, showEl } from "./common.js";

const unknownError = new Error("Unknown Error");

const errorEl = document.getElementById("error-div");
const spinnerEl = document.getElementById("spinner");

/** @typedef {Record<string, unknown> | null} Data */

/**
 * @param {Response} response
 * @returns {Promise<Data>} */
const getData = async (response) => {
    try {
        return await response.json();
    } catch (_) {}
    return null;
};

/**
 * @param {string} message
 * @param {string | string[]} [error = []] */
const setError = (message, error = []) => {
    setErrorEx(errorEl, message, error);
};

/**
 * @param {HTMLElement} el
 * @param {HttpError} err
 * @param {number} [timeout = 10] */
const setErrorTimeout = (el, err, timeout = 10) => {
    setErrorEx(el, err.message, err.error);
    if (timeout > 0) {
        setTimeout(() => clearErrorEx(el), timeout * 1000);
    }
};

/**
 * @param {HTMLElement} el
 * @param {string} message
 * @param {string | string[]} [error = []] */
const setErrorEx = (el, message, error = []) => {
    if (!el) return;
    showEl(el);
    if (!Array.isArray(error)) {
        error = [error];
    }
    error.unshift(message);
    c.append(
        el,
        ...error.map((err) =>
            c.any("p", { innerText: err }, ["request-error-message"])
        )
    );
};

const clearError = () => {
    clearErrorEx(errorEl);
};

/** @param {HTMLElement} el */
const clearErrorEx = (el) => {
    if (!el) return;
    el.innerHTML = "";
    hideEl(el);
};

/** @typedef {{message: string, error?: string | string[]}} HttpError */

/**
 * @param {string} path
 * @param {string} method
 * @param {RequestInit["headers"] | null} [headers = null]
 * @param {RequestInit["body"] | null} [body = null]
 * @param {number} [errorTimeout = 10]
 * @param {HTMLElement} errDiv
 * @returns {Promise<{response: Response, err: HttpError | null}>}
 * */
const sendRequest = async (
    path,
    method,
    headers = null,
    body = null,
    errorTimeout = 10,
    errDiv = errorEl
) => {
    showEl(spinnerEl);
    const opts = { method };
    if (method !== "GET" && body) {
        opts.body = JSON.stringify(body);
    }
    if (headers) {
        opts.headers = headers;
    }
    const response = await fetch("/api" + path, opts);
    if (response.ok) {
        hideEl(spinnerEl);
        return { response, err: null };
    }
    let err = unknownError;
    try {
        err = await response.json();
    } catch (_) {}
    if (errorTimeout > 0) {
        setErrorTimeout(errDiv, err, errorTimeout);
    }
    hideEl(spinnerEl);
    return { response: null, err };
};

/**
 * @param {string} path
 * @param {number} [errorTimeout = 10]
 * @param {HTMLElement} errDiv
 * @returns {Promise<{data: Data, response: Response, err: HttpError | null}>}
 * */
const getJson = async (path, errorTimeout = 10, errDiv = errorEl) => {
    const result = await sendRequest(
        path,
        "GET",
        null,
        null,
        errorTimeout,
        errDiv
    );
    if (result.err || !result.response.ok) return result;
    return { ...result, data: await getData(result.response) };
};

/**
 * @param {string} path
 * @param {any} body
 * @param {number} [errorTimeout = 10]
 * @param {HTMLElement} errDiv
 * @returns {Promise<{data: Data, response: Response, err: HttpError | null}>}
 * */
const postJson = async (path, body, errorTimeout = 10, errDiv = errorEl) => {
    const result = await sendRequest(
        path,
        "POST",
        { "Content-Type": "application/json" },
        body,
        errorTimeout,
        errDiv
    );
    if (result.err || !result.response.ok) return result;
    return { ...result, data: await getData(result.response) };
};

/**
 * @param {string} path
 * @param {number} [errorTimeout = 10]
 * @param {HTMLElement} errDiv
 * @returns {Promise<{data: Data, response: Response, err: HttpError | null}>}
 * */
const deleteReq = async (path, errorTimeout = 10, errDiv = errorEl) => {
    const result = await sendRequest(
        path,
        "DELETE",
        null,
        null,
        errorTimeout,
        errDiv
    );
    if (result.err || !result.response.ok) return result;
    return { ...result, data: await getData(result.response) };
};

export default {
    setError,
    setErrorEx,
    setErrorTimeout,
    clearError,
    clearErrorEx,
    sendRequest,
    getJson,
    postJson,
    delete: deleteReq,
};
