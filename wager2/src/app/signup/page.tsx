import { AuthForm } from "@/components/auth/auth-form";

const fields = [
  {
    name: "username",
    label: "Username",
    type: "text",
    hint: "3-12 characters",
    minLength: 3,
    maxLength: 12,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    hint: "8-32 characters",
    minLength: 8,
    maxLength: 32,
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
