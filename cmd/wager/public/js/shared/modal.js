import c from "./c.js";
import { hideEl, showEl } from "./common.js";

/**
 * @typedef {Object} ModalQueueItem
 * @property {string} confirmName
 * @property {string} cancelName
 * @property {boolean} noConfirm
 * @property {(() => void) | undefined} cleanup
 * @property {string | HTMLElement} contents
 * @property {() => Promise<boolean>} onConfirm
 * @property {() => void} onCancel
 */

const backdrop = document.getElementById("modal-backdrop");
const wrapper = document.getElementById("modal-wrapper");
/** @type {ModalQueueItem[]} */
const queue = [];
/** @type {ModalQueueItem | null} */
let item = null;
/** @type {(() => void) | null} */
let cleanup = null;
let isVisibile = false;

/** @param {boolean} visible */
const setVisible = (visible) => {
    if (visible && item) {
        isVisibile = true;
        showEl(backdrop, wrapper);
        renderItem();
    } else {
        isVisibile = false;
        hideEl(backdrop, wrapper);
        if (typeof cleanup === "function") {
            cleanup();
            cleanup = null;
        }
        item = null;
        if (queue.length > 0) {
            popQueue();
        }
    }
};

const renderItem = () => {
    if (!item) return;
    const modal = c.div({}, "modal");
    if (item.contents instanceof HTMLElement) {
        modal.appendChild(item.contents);
    } else {
        modal.innerHTML = item.contents;
    }
    modal.appendChild(c.hr());

    const actions = c.div(
        {
            ...(item.noConfirm ? { style: "padding:1rem;" } : {}),
        },
        item.noConfirm ? "" : "modal-actions"
    );

    let confirmButton = null;
    if (!item.noConfirm) {
        confirmButton = c.button(
            { innerText: item.confirmName || "Confirm" },
            "primary",
            item.onConfirm
        );
        actions.appendChild(confirmButton);
    }

    const cancelButton = c.button(
        {
            innerText: item.cancelName || "Cancel",
            ...(item.noConfirm ? { style: "width:100%;" } : {}),
        },
        "secondary",
        item.onCancel
    );

    actions.appendChild(cancelButton);
    modal.appendChild(actions);
    wrapper.appendChild(modal);

    const rect = modal.getBoundingClientRect();
    wrapper.setAttribute(
        "style",
        `top: calc(50% - (${rect.height}px / 2));left: 50%;`
    );

    cleanup = () => {
        item.cleanup();
        wrapper.style = "top:50%; left:50%;";
        confirmButton?.removeEventListener("click", item.onConfirm);
        cancelButton.removeEventListener("click", item.onCancel);
        modal.remove();
    };
};

const popQueue = () => {
    if (isVisibile || item) return;
    const newItem = queue.shift();
    if (!newItem) return;
    item = newItem;
    setVisible(true);
};

const initialize = () => {
    backdrop.addEventListener("click", () => {
        if (!isVisibile || !item?.onCancel) return;
        item.onCancel();
    });

    document.addEventListener("keyup", ({ key }) => {
        if (!item) return;
        switch (key) {
            case "Enter":
                item.onConfirm();
                break;
            case "Escape":
                item.onCancel();
                break;
        }
    });
};

const visible = () => isVisibile;

/** @param {ModalQueueItem} item */
const addItem = (item) => {
    queue.push({
        ...item,
        onConfirm: async () => {
            let show = false;
            if (typeof item.onConfirm === "function") {
                show = await item.onConfirm();
            }
            if (!show) setVisible(show);
            return show;
        },
        onCancel: () => {
            if (typeof item.onCancel === "function") {
                item.onCancel();
            }
            setVisible(false);
        },
        cleanup: () => {
            if (typeof item.cleanup === "function") {
                item.cleanup();
            }
        },
    });
    popQueue();
};

export default {
    initialize,
    visible,
    addItem,
};
