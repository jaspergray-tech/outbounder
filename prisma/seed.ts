import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Generic condition-rule shape stored as JSON on SequenceStep.condition.
// Evaluated against a prospect's Outcomes at due-date-calculation time.
// { all: [ { fact: "connection_accepted", equals: false }, ... ] }
const skipInMailIfEngaged = {
  all: [
    { fact: "connection_accepted", equals: false },
    { fact: "reply_received", equals: false },
  ],
};

async function main() {
  const ownerEmail = "jasper.gray@sanalabs.com";
  const ownerPassword = "Sydney2003!!!";

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: "Jasp",
      role: "OWNER",
      passwordHash: await bcrypt.hash(ownerPassword, 12),
    },
  });
  console.log(`Owner user ready: ${owner.email}`);

  const existingTemplate = await prisma.sequenceTemplate.findFirst({
    where: { name: "Standard 14-day multi-channel" },
  });

  if (existingTemplate) {
    console.log("Default template already seeded, skipping.");
    return;
  }

  const template = await prisma.sequenceTemplate.create({
    data: {
      name: "Standard 14-day multi-channel",
      description:
        "Default outbound cadence: email + LinkedIn from both mailboxes, with a conditional InMail that only fires if the prospect hasn't engaged.",
      ownerId: owner.id,
      steps: {
        create: [
          {
            dayOffset: 1,
            orderIndex: 1,
            channel: "EMAIL_MINE",
            assignedRole: "OWNER",
          },
          {
            dayOffset: 1,
            orderIndex: 2,
            channel: "LINKEDIN_CONNECTION_MINE",
            assignedRole: "OWNER",
          },
          {
            dayOffset: 4,
            orderIndex: 1,
            channel: "EMAIL_MINE",
            assignedRole: "OWNER",
          },
          {
            dayOffset: 7,
            orderIndex: 1,
            channel: "EMAIL_GTMM",
            assignedRole: "MANAGER",
          },
          {
            dayOffset: 7,
            orderIndex: 2,
            channel: "LINKEDIN_CONNECTION_GTMM",
            assignedRole: "MANAGER",
          },
          {
            dayOffset: 10,
            orderIndex: 1,
            channel: "LINKEDIN_INMAIL",
            assignedRole: "OWNER",
            condition: skipInMailIfEngaged,
          },
          {
            dayOffset: 12,
            orderIndex: 1,
            channel: "EMAIL_GTMM",
            assignedRole: "MANAGER",
          },
          {
            dayOffset: 14,
            orderIndex: 1,
            channel: "EMAIL_MINE",
            assignedRole: "OWNER",
          },
        ],
      },
    },
  });
  console.log(`Seeded default template "${template.name}" with 8 steps.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
