import Link from "next/link";
import { addDays, startOfDay } from "date-fns";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDisplayStatus } from "@/lib/scheduling/schedule";
import { DashboardClient, type ActivityRow } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const [prospectCount, sprintCount, templateCount] = await Promise.all([
    prisma.prospect.count(),
    prisma.sprint.count(),
    prisma.sequenceTemplate.count(),
  ]);

  const today = startOfDay(new Date());
  const upcomingWindowEnd = addDays(today, 7);

  const logs = await prisma.activityLog.findMany({
    where: {
      status: "PENDING",
      instance: { status: "ACTIVE", prospect: { status: "ACTIVE" } },
      ...(session?.user?.role === "MANAGER" ? { step: { assignedRole: "MANAGER" } } : {}),
    },
    include: {
      step: true,
      instance: { include: { prospect: true } },
    },
    orderBy: { plannedDate: "asc" },
  });

  const overdue: ActivityRow[] = [];
  const dueToday: ActivityRow[] = [];
  const upcoming: ActivityRow[] = [];

  for (const log of logs) {
    const row: ActivityRow = {
      id: log.id,
      plannedDate: log.plannedDate,
      dayOffset: log.step.dayOffset,
      channel: log.step.channel,
      prospect: {
        id: log.instance.prospect.id,
        name: log.instance.prospect.name,
        company: log.instance.prospect.company,
        jobTitle: log.instance.prospect.jobTitle,
      },
    };

    const display = getDisplayStatus(log, today);
    const effectiveDate =
      log.snoozedUntil && log.snoozedUntil > log.plannedDate ? log.snoozedUntil : log.plannedDate;

    if (display === "OVERDUE") {
      overdue.push(row);
    } else if (display === "DUE") {
      dueToday.push(row);
    } else if (effectiveDate <= upcomingWindowEnd) {
      upcoming.push(row);
    }
  }

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

      <div className="mt-8">
        <DashboardClient overdue={overdue} dueToday={dueToday} upcoming={upcoming} />
      </div>
    </div>
  );
}
