import { tableProps } from "./shared.js";

const c = window.clEl;
const http = window.clHttp;
const { tempDisable, enableElIf, getNameFromId, strToUser } = window.clCommon;

const users = Array.from(document.querySelectorAll(".usr-result-box")).map(
    (e) => strToUser(e.id)
);

const beginBtn = document.getElementById("begin-session");
const newGameBtn = document.getElementById("add-game");
const signoutBtn = document.getElementById("sign-out");

const modal = window.clModal.initialize({ withKeyListener: true });

const ctx = window.clTable.initialize({
    ...tableProps,
    afterRender: ({ table }) => {
        const active = table.active();
        if (!active) return;
        table.highlight(active);
    },
    onClick: (row) => {
        window.location.assign("/session/" + row.val("id"));
    },
    onFetch: async (search) => {
        const disabled = tempDisable(ctx.nextBtn, ctx.prevBtn);
        const { data } = await http.getJson("/session?" + search);
        disabled.revert();
        return data.map((e) => {
            return {
                ...e,
                sessions: e.gameSessions.length,
                users: e.users.reduce((acc, id, idx) => {
                    acc += getNameFromId(id, users);
                    if (idx < e.users.length - 1) {
                        acc += ", ";
                    }
                    return acc;
                }, ""),
            };
        });
    },
});

enableElIf(!ctx.table.active(), beginBtn);

const newGameHandler = () => {
    const input = c.input({
        placeholder: "Enter name..",
    });
    const errDiv = c.div({}, ["request-error-div", "hidden"]);
    modal.addItem({
        contents: c.append(
            c.div({}, ["text-center", "mbot-1"]),
            c.any("h3", {
                innerText: "Enter Game Name",
            }),
            c.append(c.div({}, "pure-form"), input),
            c.append(errDiv)
        ),
        onConfirm: async () => {
            if (!input.value) return true;
            const { err } = await http.postJson(
                "/game",
                {
                    name: input.value,
                },
                5,
                errDiv
            );
            if (err) return true;
            return false;
        },
    });
};

const newSessionHandler = () => {
    const selected = [];
    const errDiv = c.div({}, ["request-error-div", "hidden"]);
    modal.addItem({
        contents: c.append(
            c.div({}, ["text-center", "mbot-1"]),
            c.any("h3", {
                innerText: "Select Participants",
            }),
            c.append(
                c.div({ style: "width:500px" }, [
                    "flex-row",
                    "justify-center",
                    "gap-1",
                    "wrap",
                ]),
                ...users.map((usr) =>
                    c.button(
                        { innerText: usr.name },
                        [],
                        (e) => {
                            const idx = selected.findIndex(
                                (id) => id === usr.id
                            );
                            if (idx > -1) {
                                e.target.classList.remove("success");
                                selected.splice(idx, 1);
                                return;
                            }
                            selected.push(usr.id);
                            e.target.classList.add("success");
                        },
                        "div"
                    )
                )
            ),
            c.append(errDiv)
        ),
        onConfirm: async () => {
            const { data, err } = await http.postJson(
                "/session",
                {
                    users: selected,
                },
                5,
                errDiv
            );
            if (err) return true;
            window.location.assign("/session/" + data.id);
            return false;
        },
    });
};

newGameBtn.addEventListener("click", newGameHandler);
beginBtn.addEventListener("click", newSessionHandler);
signoutBtn.addEventListener("click", async () => {
    const { err } = await http.getJson("/signout");
    if (err) return;
    window.location.assign("/login");
});
