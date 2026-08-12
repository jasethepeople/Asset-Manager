import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const objectivesTable = pgTable("swarm_objectives", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("queued"),
  priority: text("priority").notNull().default("normal"),
  progress: integer("progress").notNull().default(0),
  agentCount: integer("agent_count").notNull().default(0),
  rootAgentId: text("root_agent_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentsTable = pgTable("swarm_agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("queued"),
  strategy: text("strategy").notNull(),
  frame: text("frame").notNull(),
  fitness: real("fitness").notNull().default(0),
  objectiveId: text("objective_id").notNull(),
  parentId: text("parent_id"),
  generation: integer("generation").notNull().default(0),
  runtimeMs: integer("runtime_ms").notNull().default(0),
  state: text("state").notNull(),
  failureSignature: text("failure_signature"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});

export const genotypesTable = pgTable("swarm_genotypes", {
  id: text("id").primaryKey(),
  frame: text("frame").notNull(),
  label: text("label").notNull(),
  strategy: text("strategy").notNull(),
  adjustedScore: real("adjusted_score").notNull(),
  fertilityScore: real("fertility_score").notNull(),
  totalSpawns: integer("total_spawns").notNull(),
  successRate: real("success_rate").notNull(),
  cumulativeFitness: real("cumulative_fitness").notNull(),
  mutationThreshold: real("mutation_threshold").notNull().default(65),
  trend: text("trend").notNull().default("flat"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityTable = pgTable("swarm_activity", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  agentId: text("agent_id"),
  objectiveId: text("objective_id"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  severity: text("severity").notNull().default("info"),
});

export const sandboxesTable = pgTable("swarm_sandboxes", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  objectiveId: text("objective_id").notNull(),
  status: text("status").notNull().default("queued"),
  command: text("command").notNull(),
  runtimeMs: integer("runtime_ms").notNull().default(0),
  exitCode: integer("exit_code"),
  telemetry: jsonb("telemetry")
    .$type<{ cpu: number; memory: number; network: number }>()
    .notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertObjectiveSchema = createInsertSchema(objectivesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const insertAgentSchema = createInsertSchema(agentsTable).omit({
  startedAt: true,
});
export const insertGenotypeSchema = createInsertSchema(genotypesTable).omit({
  updatedAt: true,
});
export const insertActivitySchema = createInsertSchema(activityTable).omit({
  timestamp: true,
});
export const insertSandboxSchema = createInsertSchema(sandboxesTable).omit({
  startedAt: true,
});

export type Objective = z.infer<typeof insertObjectiveSchema>;
export type Agent = z.infer<typeof insertAgentSchema>;
export type Genotype = z.infer<typeof insertGenotypeSchema>;
export type Activity = z.infer<typeof insertActivitySchema>;
export type Sandbox = z.infer<typeof insertSandboxSchema>;