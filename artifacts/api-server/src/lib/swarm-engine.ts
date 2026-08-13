import { and, asc, eq, lt } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  activityTable,
  agentsTable,
  objectivesTable,
  sandboxesTable,
} from "@workspace/db";
import { logger } from "./logger";

let started = false;

const now = () => new Date();
const secondsAgo = (seconds: number) =>
  new Date(Date.now() - seconds * 1000);

async function advanceQueuedJob(): Promise<void> {
  const [job] = await db
    .select()
    .from(sandboxesTable)
    .where(eq(sandboxesTable.status, "queued"))
    .orderBy(asc(sandboxesTable.startedAt))
    .limit(1);
  if (!job) return;

  const startedAt = now();
  await db
    .update(sandboxesTable)
    .set({
      status: "running",
      startedAt,
      telemetry: { cpu: 22, memory: 36, network: 2 },
    })
    .where(eq(sandboxesTable.id, job.id));
  await db
    .update(agentsTable)
    .set({ status: "running", state: "sandbox executing", startedAt })
    .where(eq(agentsTable.id, job.agentId));
  await db.insert(activityTable).values({
    id: `evt-${crypto.randomUUID().slice(0, 8)}`,
    type: "spawn",
    message: `sandbox ${job.id} started for ${job.agentId}`,
    agentId: job.agentId,
    objectiveId: job.objectiveId,
    timestamp: startedAt,
    severity: "info",
  });
}

async function completeLocalJob(): Promise<void> {
  const [job] = await db
    .select()
    .from(sandboxesTable)
    .where(
      and(
        eq(sandboxesTable.status, "running"),
        lt(sandboxesTable.startedAt, secondsAgo(8)),
      ),
    )
    .orderBy(asc(sandboxesTable.startedAt))
    .limit(1);
  if (!job || !job.command.startsWith("bootstrap")) return;

  const finishedAt = now();
  const runtimeMs = Math.max(
    finishedAt.getTime() - job.startedAt.getTime(),
    8000,
  );
  await db
    .update(sandboxesTable)
    .set({
      status: "completed",
      runtimeMs,
      exitCode: 0,
      telemetry: { cpu: 31, memory: 42, network: 5 },
    })
    .where(eq(sandboxesTable.id, job.id));
  await db
    .update(agentsTable)
    .set({
      status: "completed",
      fitness: 74.5,
      state: "bootstrap completed",
      runtimeMs,
    })
    .where(eq(agentsTable.id, job.agentId));

  const [objective] = await db
    .select()
    .from(objectivesTable)
    .where(eq(objectivesTable.id, job.objectiveId));
  if (objective) {
    const progress = Math.min(objective.progress + 15, 100);
    await db
      .update(objectivesTable)
      .set({
        progress,
        status: progress >= 100 ? "completed" : "running",
        updatedAt: finishedAt,
      })
      .where(eq(objectivesTable.id, objective.id));
  }
  await db.insert(activityTable).values({
    id: `evt-${crypto.randomUUID().slice(0, 8)}`,
    type: "success",
    message: `sandbox ${job.id} completed with exit code 0`,
    agentId: job.agentId,
    objectiveId: job.objectiveId,
    timestamp: finishedAt,
    severity: "success",
  });
}

async function tick(): Promise<void> {
  try {
    await advanceQueuedJob();
    await completeLocalJob();
  } catch (error) {
    logger.warn({ error }, "Local swarm engine tick failed");
  }
}

export function startSwarmEngine(): void {
  if (started) return;
  started = true;
  setInterval(() => {
    void tick();
  }, 4000);
  void tick();
  logger.info("Local swarm execution loop started");
}