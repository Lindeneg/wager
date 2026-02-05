const { durationInMins } = window.clCommon;

const IN_PROGRESS_VALS = [null, "<nil>", "In Progress"];

/**
 * @param {unknown} v
 * @returns {boolean} */
export const inProgress = (v) => IN_PROGRESS_VALS.includes(v);

/** @type {import("./globals").TableConfig} */
export const tableProps = {
    id: "session-table",
    defaultLimit: 10,
    defaultOffset: 0,
    transform: (_, col, val, row, data) => {
        switch (col) {
            case "started":
            case "ended":
                if (inProgress(val)) {
                    row.setActive();
                    return "In Progress";
                }
                return new Date(val).toLocaleString();
            case "duration":
                if (inProgress(data["ended"])) {
                    return "-";
                }
                return durationInMins(data["started"], data["ended"]);
            case "rounds":
                if (Array.isArray(val)) return val.length;
                return val;
            default:
                return val;
        }
    },
};
