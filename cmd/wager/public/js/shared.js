const { durationInMins } = window.clCommon;

const IN_PROGRESS_VALS = [null, "<nil>", "In Progress"];

export const tableProps = {
    id: "session-table",
    defaultLimit: 10,
    defaultOffset: 0,
    transform: (_, col, val, row, data) => {
        switch (col) {
            case "started":
            case "ended":
                if (IN_PROGRESS_VALS.includes(val)) {
                    row.setActive();
                    return "In Progress";
                }
                return new Date(val).toLocaleString();
            case "duration":
                if (IN_PROGRESS_VALS.includes(data["ended"])) {
                    return "-";
                }
                return durationInMins(data["started"], data["ended"]);
            case "rounds":
                return val.length;
            default:
                return val;
        }
    },
};
