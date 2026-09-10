import { z } from "zod";

export type TaskId = string;
export type OccupationId = string;
export type CapabilityId = string;
export type RiskClass = "R0" | "R1" | "R2" | "R3";

export interface SuccessCriterionBase {
  readonly type: string;
}

export type SuccessCriterion =
  | { readonly type: "artifact-exists"; readonly artifactType: string }
  | { readonly type: "value-equals"; readonly path: string; readonly expected: unknown }
  | { readonly type: "record-updated"; readonly resource: string }
  | { readonly type: "external-confirmation"; readonly provider: string }
  | { readonly type: "custom"; readonly verifierId: string };

export interface ApprovalPolicy {
  readonly mode: "none" | "required" | "delegated";
  readonly approvers?: readonly string[];
  readonly note?: string;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoffMs: number;
  readonly classify?: readonly string[];
}

export interface TaskDefinition {
  readonly id: TaskId;
  readonly version: string;
  readonly title: string;
  readonly description?: string;
  readonly occupations: readonly OccupationId[];
  readonly intents: readonly string[];
  readonly requiredCapabilities: readonly CapabilityId[];
  readonly inputSchema: unknown;
  readonly outputSchema: unknown;
  readonly riskClass: RiskClass;
  readonly successCriteria: readonly SuccessCriterion[];
  readonly approvalPolicy: ApprovalPolicy;
  readonly retryPolicy: RetryPolicy;
  readonly plannerHints?: {
    readonly typicalSteps?: readonly string[];
    readonly parallelizable?: boolean;
  };
}

export interface OccupationProfile {
  readonly id: OccupationId;
  readonly version: string;
  readonly title: string;
  readonly taskSelectors: readonly string[];
  readonly allowedCapabilities: readonly CapabilityId[];
  readonly defaultPolicies: Record<string, unknown>;
  readonly performanceMetrics: readonly string[];
}

export interface CapabilityResult {
  readonly ok: boolean;
  readonly output?: unknown;
  readonly error?: string;
}

export interface ExecutionContext {
  readonly runId: string;
  readonly tenantId?: string;
  readonly actorId?: string;
  readonly occupationId?: OccupationId;
  readonly planId?: string;
  readonly traceId?: string;
}

export interface CapabilityDefinition {
  readonly id: CapabilityId;
  readonly version: string;
  readonly effect: "read" | "write" | "external-communication" | "financial";
  readonly inputSchema: unknown;
  readonly outputSchema: unknown;
  readonly execute: (input: unknown, context: ExecutionContext) => Promise<CapabilityResult>;
}

export interface PolicyDecision {
  readonly allowed: boolean;
  readonly requiresApproval: boolean;
  readonly reason: string;
  readonly constraints?: Record<string, unknown>;
}

export interface WorkNode {
  readonly id: string;
  readonly taskId?: TaskId;
  readonly capabilityId?: CapabilityId;
  readonly status: "pending" | "ready" | "running" | "blocked" | "succeeded" | "failed" | "skipped";
  readonly dependencies: readonly string[];
  readonly riskClass: RiskClass;
  readonly input: unknown;
  readonly retryPolicy?: RetryPolicy;
  readonly successCriteria?: readonly SuccessCriterion[];
}

export interface WorkEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: "depends-on" | "data-flow";
}

export interface WorkPlan {
  readonly id: string;
  readonly version: number;
  readonly objective: string;
  readonly nodes: readonly WorkNode[];
  readonly edges: readonly WorkEdge[];
}

export const taskDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  occupations: z.array(z.string().min(1)),
  intents: z.array(z.string().min(1)),
  requiredCapabilities: z.array(z.string().min(1)),
  inputSchema: z.unknown(),
  outputSchema: z.unknown(),
  riskClass: z.enum(["R0", "R1", "R2", "R3"]),
  successCriteria: z.array(
    z.union([
      z.object({ type: z.literal("artifact-exists"), artifactType: z.string().min(1) }),
      z.object({ type: z.literal("value-equals"), path: z.string().min(1), expected: z.unknown() }),
      z.object({ type: z.literal("record-updated"), resource: z.string().min(1) }),
      z.object({ type: z.literal("external-confirmation"), provider: z.string().min(1) }),
      z.object({ type: z.literal("custom"), verifierId: z.string().min(1) }),
    ]),
  ),
  approvalPolicy: z.object({
    mode: z.enum(["none", "required", "delegated"]),
    approvers: z.array(z.string()).optional(),
    note: z.string().optional(),
  }),
  retryPolicy: z.object({
    maxAttempts: z.number().int().min(0),
    backoffMs: z.number().int().min(0),
    classify: z.array(z.string()).optional(),
  }),
  plannerHints: z
    .object({
      typicalSteps: z.array(z.string()).optional(),
      parallelizable: z.boolean().optional(),
    })
    .optional(),
});

export const occupationProfileSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  taskSelectors: z.array(z.string().min(1)),
  allowedCapabilities: z.array(z.string().min(1)),
  defaultPolicies: z.record(z.string(), z.unknown()),
  performanceMetrics: z.array(z.string().min(1)),
});

export const capabilityDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  effect: z.enum(["read", "write", "external-communication", "financial"]),
  inputSchema: z.unknown(),
  outputSchema: z.unknown(),
  execute: z.custom<CapabilityDefinition["execute"]>((value) => typeof value === "function"),
});

export const policyDecisionSchema = z.object({
  allowed: z.boolean(),
  requiresApproval: z.boolean(),
  reason: z.string().min(1),
  constraints: z.record(z.string(), z.unknown()).optional(),
});

export const successCriterionSchema = z.union([
  z.object({ type: z.literal("artifact-exists"), artifactType: z.string().min(1) }),
  z.object({ type: z.literal("value-equals"), path: z.string().min(1), expected: z.unknown() }),
  z.object({ type: z.literal("record-updated"), resource: z.string().min(1) }),
  z.object({ type: z.literal("external-confirmation"), provider: z.string().min(1) }),
  z.object({ type: z.literal("custom"), verifierId: z.string().min(1) }),
]);

export const workNodeSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().optional(),
  capabilityId: z.string().optional(),
  status: z.enum(["pending", "ready", "running", "blocked", "succeeded", "failed", "skipped"]),
  dependencies: z.array(z.string()),
  riskClass: z.enum(["R0", "R1", "R2", "R3"]),
  input: z.unknown(),
  retryPolicy: z
    .object({
      maxAttempts: z.number().int().min(0),
      backoffMs: z.number().int().min(0),
      classify: z.array(z.string()).optional(),
    })
    .optional(),
  successCriteria: z.array(successCriterionSchema).optional(),
});

export const workPlanSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1),
  objective: z.string().min(1),
  nodes: z.array(workNodeSchema),
  edges: z.array(
    z.object({
      from: z.string().min(1),
      to: z.string().min(1),
      kind: z.enum(["depends-on", "data-flow"]),
    }),
  ),
});

export function normalizeRiskClass(risk: RiskClass): number {
  switch (risk) {
    case "R0":
      return 0;
    case "R1":
      return 1;
    case "R2":
      return 2;
    case "R3":
      return 3;
    default:
      return 0;
  }
}

export function validateTaskDefinition(value: unknown) {
  return taskDefinitionSchema.safeParse(value);
}

export function validateOccupationProfile(value: unknown) {
  return occupationProfileSchema.safeParse(value);
}

export function validateCapabilityDefinition(value: unknown) {
  return capabilityDefinitionSchema.safeParse(value);
}

export function validatePolicyDecision(value: unknown) {
  return policyDecisionSchema.safeParse(value);
}

export function validateSuccessCriterion(value: unknown) {
  return successCriterionSchema.safeParse(value);
}

export function validateWorkPlan(value: unknown) {
  return workPlanSchema.safeParse(value);
}
