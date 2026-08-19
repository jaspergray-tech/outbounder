import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  const [prospectCount, sprintCount, templateCount] = await Promise.all([
    prisma.prospect.count(),
    prisma.sprint.count(),
    prisma.sequenceTemplate.count(),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Welcome, {session?.user?.name}
          </h1>
          <p className="text-sm text-zinc-500">
            Signed in as {session?.user?.role}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Prospects</p>
          <p className="text-2xl font-semibold">{prospectCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Sprints</p>
          <p className="text-2xl font-semibold">{sprintCount}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-sm text-zinc-500">Sequence templates</p>
          <p className="text-2xl font-semibold">{templateCount}</p>
        </div>
      </div>

      {session?.user?.role === "OWNER" && (
        <Link
          href="/prospects/import"
          className="mt-8 inline-block rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Import prospects
        </Link>
      )}

      <p className="mt-8 text-sm text-zinc-400">
        Due today / overdue / upcoming will live here (next step of the build).
      </p>
    </div>
  );
}
