import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDueBuckets } from "@/lib/scheduling/queries";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const [prospectCount, sprintCount, templateCount] = await Promise.all([
    prisma.prospect.count(),
    prisma.sprint.count(),
    prisma.sequenceTemplate.count(),
  ]);

  const { overdue, dueToday, upcoming } = await getDueBuckets(session?.user?.role);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
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
        <div className="mt-8 flex gap-3">
          <Link
            href="/prospects/import"
            className="inline-block rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Import prospects
          </Link>
        </div>
      )}

      <div className="mt-8">
        <DashboardClient overdue={overdue} dueToday={dueToday} upcoming={upcoming} />
      </div>
    </div>
  );
}
