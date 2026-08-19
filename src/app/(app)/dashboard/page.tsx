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
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">Prospects</p>
          <p className="text-2xl font-semibold text-foreground">{prospectCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">Sprints</p>
          <p className="text-2xl font-semibold text-foreground">{sprintCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">Sequence templates</p>
          <p className="text-2xl font-semibold text-foreground">{templateCount}</p>
        </div>
      </div>

      {session?.user?.role === "OWNER" && (
        <div className="mt-6 flex gap-3">
          <Link
            href="/prospects/import"
            className="inline-block rounded bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
