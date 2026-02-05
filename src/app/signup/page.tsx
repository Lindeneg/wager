import {AuthForm} from "@/components/auth";

const fields = [
    {
        name: "username",
        label: "Username",
        type: "text",
        hint: "3-12 characters",
    },
    {
        name: "password",
        label: "Password",
        type: "password",
        hint: "8-32 characters",
    },
    {
        name: "inviteCode",
        label: "Invite Code",
        type: "text",
    },
];

export default function SignupPage() {
    return (
        <AuthForm
            title="Sign up"
            description="Create an account to start tracking wagers"
            endpoint="/api/signup"
            submitLabel="Create account"
            loadingLabel="Creating account..."
            fields={fields}
            footerText="Already have an account?"
            footerLinkText="Sign in"
            footerLinkHref="/login"
        />
    );
}
