import { AuthForm } from "@/components/auth";

const fields = [
  {
    name: "username",
    label: "Username",
    type: "text",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
  },
];

export default function LoginPage() {
  return (
    <AuthForm
      title="Login"
      description="Enter your credentials to access your account"
      endpoint="/api/login"
      submitLabel="Sign in"
      loadingLabel="Signing in..."
      fields={fields}
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/signup"
    />
  );
}
