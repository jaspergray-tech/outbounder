import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=CredentialsSignin");
      }
      throw err;
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-4">
      <form
        action={login}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-surface p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-foreground">
          Outbound Cadence Tracker
        </h1>
        <p className="text-sm text-muted">Sign in to continue</p>

        {error && (
          <p className="rounded bg-negative-bg px-3 py-2 text-sm text-negative">
            Incorrect email or password.
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
