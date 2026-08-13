import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  activityTable,
  agentsTable,
  genotypesTable,
  objectivesTable,
  sandboxesTable,
} from "@workspace/db";
import {
  CreateObjectiveBody,
  CreateObjectiveResponse,
  CreateSandboxBody,
  CreateSandboxResponse,
  DispatchObjectiveParams,
  DispatchObjectiveResponse,
  GetAgentParams,
  GetAgentResponse,
  GetSwarmSummaryResponse,
  ListActivityQueryParams,
  ListActivityResponse,
  ListAgentsResponse,
  ListGenotypesResponse,
  ListObjectivesResponse,
  ListSandboxesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
let seedPromise: Promise<void> | undefined;

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000);

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db
        .select({ id: objectivesTable.id })
        .from(objectivesTable)
        .limit(1);
      if (existing.length > 0) return;

      const objectiveOne = "obj-aurora";
      const objectiveTwo = "obj-atlas";
      const objectiveThree = "obj-lighthouse";
      const agentOne = "agent-orbit";
      const agentTwo = "agent-kepler";
      const agentThree = "agent-lyra";
      const agentFour = "agent-nova";
      const now = new Date();

      await db.insert(objectivesTable).values([
        {
          id: objectiveOne,
          title: "Map the fastest path through the codebase",
          description:
            "Explore the repository, identify the highest-leverage implementation path, and return a verified plan.",
          status: "running",
          priority: "critical",
          progress: 72,
          agentCount: 3,
          rootAgentId: agentOne,
          createdAt: minutesAgo(72),
          updatedAt: minutesAgo(2),
        },
        {
          id: objectiveTwo,
          title: "Harden the isolated execution loop",
          description:
            "Exercise the sandbox boundary with adversarial inputs and report any escape or resource anomalies.",
          status: "running",
          priority: "high",
          progress: 41,
          agentCount: 2,
          rootAgentId: agentThree,
          createdAt: minutesAgo(56),
          updatedAt: minutesAgo(6),
        },
        {
          id: objectiveThree,
          title: "Synthesize a resilient prompt genotype",
          description:
            "Combine the strongest cognitive frames into a prompt mutation that improves success without increasing latency.",
          status: "completed",
          priority: "normal",
          progress: 100,
          agentCount: 4,
          rootAgentId: agentFour,
          createdAt: minutesAgo(180),
          updatedAt: minutesAgo(18),
        },
      ]);

      await db.insert(agentsTable).values([
        {
          id: agentOne,
          name: "orbit / root",
          status: "running",
          strategy: "decompose",
          frame: "systems",
          fitness: 91.8,
          objectiveId: objectiveOne,
          parentId: null,
          generation: 4,
          runtimeMs: 18420,
          state: "mapping dependency edges",
          failureSignature: null,
          startedAt: minutesAgo(24),
        },
        {
          id: agentTwo,
          name: "kepler / scout",
          status: "completed",
          strategy: "search",
          frame: "analyst",
          fitness: 87.4,
          objectiveId: objectiveOne,
          parentId: agentOne,
          generation: 5,
          runtimeMs: 9340,
          state: "returned 12 candidate paths",
          failureSignature: null,
          startedAt: minutesAgo(21),
        },
        {
          id: agentThree,
          name: "lyra / sentinel",
          status: "running",
          strategy: "probe",
          frame: "skeptic",
          fitness: 78.6,
          objectiveId: objectiveTwo,
          parentId: null,
          generation: 2,
          runtimeMs: 12780,
          state: "replaying syscall boundary",
          failureSignature: null,
          startedAt: minutesAgo(31),
        },
        {
          id: agentFour,
          name: "nova / synthesizer",
          status: "completed",
          strategy: "synthesize",
          frame: "editor",
          fitness: 96.2,
          objectiveId: objectiveThree,
          parentId: null,
          generation: 8,
          runtimeMs: 21440,
          state: "merged successful genotype",
          failureSignature: null,
          startedAt: minutesAgo(164),
        },
      ]);

      await db.insert(genotypesTable).values([
        {
          id: "geno-systems",
          frame: "systems",
          label: "Systems Cartographer",
          strategy: "decompose",
          adjustedScore: 88.4,
          fertilityScore: 82.1,
          totalSpawns: 42,
          successRate: 0.88,
          cumulativeFitness: 3448.2,
          mutationThreshold: 65,
          trend: "up",
          updatedAt: minutesAgo(2),
        },
        {
          id: "geno-analyst",
          frame: "analyst",
          label: "Evidence Analyst",
          strategy: "search",
          adjustedScore: 76.8,
          fertilityScore: 71.4,
          totalSpawns: 38,
          successRate: 0.79,
          cumulativeFitness: 2713.4,
          mutationThreshold: 65,
          trend: "up",
          updatedAt: minutesAgo(7),
        },
        {
          id: "geno-skeptic",
          frame: "skeptic",
          label: "Adversarial Skeptic",
          strategy: "probe",
          adjustedScore: 61.2,
          fertilityScore: 58.7,
          totalSpawns: 31,
          successRate: 0.68,
          cumulativeFitness: 1820.1,
          mutationThreshold: 65,
          trend: "down",
          updatedAt: minutesAgo(12),
        },
        {
          id: "geno-editor",
          frame: "editor",
          label: "Precision Editor",
          strategy: "synthesize",
          adjustedScore: 93.6,
          fertilityScore: 90.8,
          totalSpawns: 29,
          successRate: 0.93,
          cumulativeFitness: 2633.2,
          mutationThreshold: 65,
          trend: "up",
          updatedAt: minutesAgo(4),
        },
        {
          id: "geno-operator",
          frame: "operator",
          label: "Pragmatic Operator",
          strategy: "execute",
          adjustedScore: 69.4,
          fertilityScore: 66.9,
          totalSpawns: 27,
          successRate: 0.74,
          cumulativeFitness: 1806.3,
          mutationThreshold: 65,
          trend: "flat",
          updatedAt: minutesAgo(20),
        },
      ]);

      await db.insert(activityTable).values([
        {
          id: "evt-1",
          type: "mutation",
          message: "skeptic frame crossed mutation threshold",
          agentId: agentThree,
          objectiveId: objectiveTwo,
          timestamp: minutesAgo(3),
          severity: "warning",
        },
        {
          id: "evt-2",
          type: "success",
          message: "kepler returned 12 candidate paths",
          agentId: agentTwo,
          objectiveId: objectiveOne,
          timestamp: minutesAgo(6),
          severity: "success",
        },
        {
          id: "evt-3",
          type: "telemetry",
          message: "sandbox telemetry synced to AGENT_STATES",
          agentId: agentOne,
          objectiveId: objectiveOne,
          timestamp: minutesAgo(8),
          severity: "info",
        },
        {
          id: "evt-4",
          type: "spawn",
          message: "spawned generation 8 from editor genotype",
          agentId: agentFour,
          objectiveId: objectiveThree,
          timestamp: minutesAgo(18),
          severity: "info",
        },
        {
          id: "evt-5",
          type: "dispatch",
          message: "objective atlas dispatched to swarm",
          agentId: agentThree,
          objectiveId: objectiveTwo,
          timestamp: minutesAgo(31),
          severity: "info",
        },
      ]);

      await db.insert(sandboxesTable).values([
        {
          id: "sandbox-1",
          agentId: agentOne,
          objectiveId: objectiveOne,
          status: "running",
          command: "scan --scope repository --emit-plan",
          runtimeMs: 18420,
          exitCode: null,
          telemetry: { cpu: 42, memory: 61, network: 8 },
          startedAt: minutesAgo(24),
        },
        {
          id: "sandbox-2",
          agentId: agentThree,
          objectiveId: objectiveTwo,
          status: "running",
          command: "replay --profile syscall-boundary",
          runtimeMs: 12780,
          exitCode: null,
          telemetry: { cpu: 68, memory: 48, network: 16 },
          startedAt: minutesAgo(31),
        },
        {
          id: "sandbox-3",
          agentId: agentFour,
          objectiveId: objectiveThree,
          status: "completed",
          command: "synthesize --genotypes 5 --verify",
          runtimeMs: 21440,
          exitCode: 0,
          telemetry: { cpu: 33, memory: 44, network: 4 },
          startedAt: minutesAgo(164),
        },
      ]);

      void now;
    })();
  }
  return seedPromise;
}

router.get("/swarm/summary", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const [objectives, agents, genotypes] = await Promise.all([
    db.select().from(objectivesTable),
    db.select().from(agentsTable),
    db.select().from(genotypesTable),
  ]);
  const stateBreakdown = {
    queued: agents.filter((agent) => agent.status === "queued").length,
    running: agents.filter((agent) => agent.status === "running").length,
    completed: agents.filter((agent) => agent.status === "completed").length,
    failed: agents.filter((agent) => agent.status === "failed").length,
  };
  const activeAgents = agents.filter(
    (agent) => agent.status === "running" || agent.status === "queued",
  ).length;
  const totalSpawns = genotypes.reduce(
    (total, genotype) => total + genotype.totalSpawns,
    0,
  );
  const mutationPressure =
    (genotypes.filter(
      (genotype) => genotype.adjustedScore < genotype.mutationThreshold,
    ).length /
      Math.max(genotypes.length, 1));

  const result = {
    activeObjectives: objectives.filter(
      (objective) => objective.status === "running",
    ).length,
    activeAgents,
    successRate:
      genotypes.reduce((total, genotype) => total + genotype.successRate, 0) /
      Math.max(genotypes.length, 1),
    averageFitness:
      agents.reduce((total, agent) => total + agent.fitness, 0) /
      Math.max(agents.length, 1),
    totalSpawns,
    mutationPressure,
    stateBreakdown,
    fitnessTrend: [
      { label: "−6h", value: 71.2 },
      { label: "−5h", value: 73.8 },
      { label: "−4h", value: 72.9 },
      { label: "−3h", value: 78.1 },
      { label: "−2h", value: 80.4 },
      { label: "−1h", value: 83.7 },
      { label: "now", value: 84.9 },
    ],
    updatedAt: new Date(),
  };
  res.json(GetSwarmSummaryResponse.parse(result));
});

router.get("/objectives", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const objectives = await db
    .select()
    .from(objectivesTable)
    .orderBy(desc(objectivesTable.updatedAt));
  res.json(ListObjectivesResponse.parse(objectives));
});

router.post("/objectives", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = CreateObjectiveBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid objective input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const id = `obj-${randomUUID().slice(0, 8)}`;
  const now = new Date();
  const [objective] = await db
    .insert(objectivesTable)
    .values({
      id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: "queued",
      progress: 0,
      agentCount: 0,
      rootAgentId: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  await db.insert(activityTable).values({
    id: `evt-${randomUUID().slice(0, 8)}`,
    type: "dispatch",
    message: `objective ${id} created and queued`,
    agentId: null,
    objectiveId: id,
    timestamp: now,
    severity: "info",
  });
  res.status(201).json(CreateObjectiveResponse.parse(objective));
});

router.post("/objectives/:id/dispatch", async (req, res): Promise<void> => {
  await ensureSeeded();
  const params = DispatchObjectiveParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [current] = await db
    .select()
    .from(objectivesTable)
    .where(eq(objectivesTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Objective not found" });
    return;
  }

  const agentId = `agent-${randomUUID().slice(0, 8)}`;
  const now = new Date();
  const [objective] = await db
    .update(objectivesTable)
    .set({
      status: "running",
      progress: Math.max(current.progress, 8),
      agentCount: current.agentCount + 1,
      rootAgentId: current.rootAgentId ?? agentId,
      updatedAt: now,
    })
    .where(eq(objectivesTable.id, params.data.id))
    .returning();
  await db.insert(agentsTable).values({
    id: agentId,
    name: `${agentId.replace("agent-", "")} / scout`,
    status: "running",
    strategy: "decompose",
    frame: "operator",
    fitness: 50,
    objectiveId: params.data.id,
    parentId: current.rootAgentId,
    generation: 1,
    runtimeMs: 0,
    state: "initializing sandbox",
    failureSignature: null,
    startedAt: now,
  });
  await db.insert(sandboxesTable).values({
    id: `sandbox-${randomUUID().slice(0, 8)}`,
    agentId,
    objectiveId: params.data.id,
    status: "queued",
    command: "bootstrap --objective " + params.data.id,
    runtimeMs: 0,
    exitCode: null,
    telemetry: { cpu: 0, memory: 0, network: 0 },
    startedAt: now,
  });
  await db.insert(activityTable).values({
    id: `evt-${randomUUID().slice(0, 8)}`,
    type: "dispatch",
    message: `objective ${params.data.id} dispatched to a new scout`,
    agentId,
    objectiveId: params.data.id,
    timestamp: now,
    severity: "info",
  });
  res.json(DispatchObjectiveResponse.parse(objective));
});

router.get("/agents", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const agents = await db
    .select()
    .from(agentsTable)
    .orderBy(desc(agentsTable.startedAt));
  res.json(ListAgentsResponse.parse(agents));
});

router.get("/agents/:id", async (req, res): Promise<void> => {
  await ensureSeeded();
  const params = GetAgentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [agent] = await db
    .select()
    .from(agentsTable)
    .where(eq(agentsTable.id, params.data.id));
  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }
  res.json(GetAgentResponse.parse(agent));
});

router.get("/genotypes", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const genotypes = await db
    .select()
    .from(genotypesTable)
    .orderBy(desc(genotypesTable.adjustedScore));
  res.json(ListGenotypesResponse.parse(genotypes));
});

router.get("/activity", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const activity = await db
    .select()
    .from(activityTable)
    .orderBy(desc(activityTable.timestamp))
    .limit(parsed.data.limit ?? 12);
  res.json(ListActivityResponse.parse(activity));
});

router.get("/sandboxes", async (_req, res): Promise<void> => {
  await ensureSeeded();
  const sandboxes = await db
    .select()
    .from(sandboxesTable)
    .orderBy(desc(sandboxesTable.startedAt));
  res.json(ListSandboxesResponse.parse(sandboxes));
});

router.post("/sandboxes", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = CreateSandboxBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid sandbox input");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const sandbox = {
    id: `sandbox-${randomUUID().slice(0, 8)}`,
    agentId: parsed.data.agentId,
    objectiveId: parsed.data.objectiveId,
    status: "queued",
    command: parsed.data.command,
    runtimeMs: 0,
    exitCode: null,
    telemetry: { cpu: 0, memory: 0, network: 0 },
    startedAt: new Date(),
  };
  const [created] = await db.insert(sandboxesTable).values(sandbox).returning();
  res.status(201).json(CreateSandboxResponse.parse(created));
});

export default router;