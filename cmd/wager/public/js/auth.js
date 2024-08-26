const http = window.clHttp;
const { enableBtn, disableBtn } = window.clCommon;

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const inviteCodeInput = document.getElementById("invite-code");
const submitBtn = document.getElementById("submit");

const state = {
    username: usernameInput.value ?? "",
    password: passwordInput.value ?? "",
    inviteCode: inviteCodeInput?.value ?? "",
    isLogin: window.location.pathname === "/login",
};

const checkState = () => {
    if (state.username && state.password) {
        if (!state.isLogin && !state.inviteCode) {
            return disableBtn(submitBtn);
        }
        return enableBtn(submitBtn);
    }
    disableBtn(submitBtn);
};

submitBtn.addEventListener("click", async () => {
    let path = "/login";
    const body = {
        username: state.username,
        password: state.password,
    };
    if (!state.isLogin) {
        path = "/signup";
        body.inviteCode = state.inviteCode;
    }
    http.clearError();
    disableBtn(submitBtn);
    const result = await http.postJson(path, body);
    enableBtn(submitBtn);
    if (result.response?.ok) {
        window.location.pathname = "/";
    }
});

document.addEventListener("keyup", ({ key }) => {
    if (key !== "Enter") return;
    if (!submitBtn.hasAttribute("disabled")) {
        submitBtn.click();
    }
});

/** @param {InputEvent} */
const onInput = ({ target }) => {
    state[target.name] = target.value;
    checkState();
};

usernameInput.addEventListener("input", onInput);
passwordInput.addEventListener("input", onInput);
inviteCodeInput?.addEventListener("input", onInput);

checkState();
