import type { ExecutionActor, ExecutionPolicy } from "@/lib/db/operations/policy";
import type { AgentRunWorkflowType } from "@/lib/agent/types";
import {
  type OccupationProfile,
  type TaskDefinition,
  type RiskClass,
  normalizeRiskClass,
} from "./contracts";
import { DEFAULT_OCCUPATION_PROFILES } from "./occupations";
import { CapabilityRegistry, OccupationRegistry, TaskRegistry } from "./registry";

export type WorkKernelAdmission =
  | {
      readonly kind: "allowed";
      readonly task: TaskDefinition;
      readonly occupation: OccupationProfile;
    }
  | {
      readonly kind: "approval-required";
      readonly task: TaskDefinition;
      readonly occupation: OccupationProfile;
      readonly reasonCode: "APPROVAL_REQUIRED";
    }
  | {
      readonly kind: "denied";
      readonly reasonCode:
        | "UNKNOWN_TASK"
        | "AMBIGUOUS_TASK"
        | "UNKNOWN_OCCUPATION"
        | "AMBIGUOUS_OCCUPATION"
        | "TASK_NOT_ASSIGNED"
        | "CAPABILITY_NOT_ALLOWED"
        | "RISK_EXCEEDS_POLICY"
        | "ROLE_FORBIDDEN"
        | "MODE_FORBIDDEN";
    };

export class WorkKernelAdmissionError extends Error {
  constructor(public readonly reasonCode: Exclude<WorkKernelAdmission, { kind: "allowed" | "approval-required" }>["reasonCode"]) {
    super(`Work-kernel admission denied: ${reasonCode}`);
    this.name = "WorkKernelAdmissionError";
    Object.setPrototypeOf(this, WorkKernelAdmissionError.prototype);
  }
}

export interface WorkKernelAdmissionInput {
  readonly taskId?: string;
  readonly occupationId?: string;
  readonly workflowType?: AgentRunWorkflowType;
  readonly actor: ExecutionActor;
  readonly policy: ExecutionPolicy;
}

const LEGACY_WORKFLOW_TASKS: Readonly<Record<AgentRunWorkflowType, { taskId: string; occupationId: string; title: string }>> = {
  investigation: { taskId: "database-investigation", occupationId: "research-analyst", title: "Investigate a database question" },
  "query-optimization": { taskId: "query-optimization", occupationId: "software-engineer", title: "Optimize a database query" },
  "database-assessment": { taskId: "database-assessment", occupationId: "data-analyst", title: "Assess database health" },
  operations: { taskId: "database-operations", occupationId: "operations-manager", title: "Review database operations" },
  "data-analysis": { taskId: "data-analysis", occupationId: "data-analyst", title: "Analyze database data" },
};

function legacyTask(definition: (typeof LEGACY_WORKFLOW_TASKS)[AgentRunWorkflowType]): TaskDefinition {
  return {
    id: definition.taskId,
    version: "1.0.0",
    title: definition.title,
    occupations: [definition.occupationId],
    intents: [definition.taskId],
    requiredCapabilities: [],
    inputSchema: { type: "object" },
    outputSchema: { type: "object" },
    riskClass: "R1",
    successCriteria: [{ type: "custom", verifierId: "agent-run-goal" }],
    approvalPolicy: { mode: "none" },
    retryPolicy: { maxAttempts: 1, backoffMs: 250 },
  };
}

export class WorkKernelRuntime {
  constructor(
    readonly tasks: TaskRegistry,
    readonly occupations: OccupationRegistry,
    readonly capabilities: CapabilityRegistry,
  ) {}

  admit(input: WorkKernelAdmissionInput): WorkKernelAdmission {
    const legacy = input.workflowType === undefined ? undefined : LEGACY_WORKFLOW_TASKS[input.workflowType];
    const taskResolution = this.tasks.resolve(input.taskId ?? legacy?.taskId ?? "");
    if (taskResolution.kind === "denied") return { kind: "denied", reasonCode: taskResolution.reasonCode };

    const occupationResolution = this.occupations.resolve(input.occupationId ?? legacy?.occupationId ?? "");
    if (occupationResolution.kind === "denied") return { kind: "denied", reasonCode: occupationResolution.reasonCode };

    const { task } = taskResolution;
    const { occupation } = occupationResolution;
    if (!task.occupations.includes(occupation.id)) return { kind: "denied", reasonCode: "TASK_NOT_ASSIGNED" };
    if (!task.requiredCapabilities.every((capabilityId) => occupation.allowedCapabilities.includes(capabilityId))) {
      return { kind: "denied", reasonCode: "CAPABILITY_NOT_ALLOWED" };
    }
    if (!input.policy.allowedRoles.includes(input.actor.role)) return { kind: "denied", reasonCode: "ROLE_FORBIDDEN" };
    if (!input.policy.allowedModes.includes(input.actor.mode)) return { kind: "denied", reasonCode: "MODE_FORBIDDEN" };
    if (normalizeRiskClass(task.riskClass) > input.policy.maxRiskClass) {
      return { kind: "denied", reasonCode: "RISK_EXCEEDS_POLICY" };
    }
    if (task.approvalPolicy.mode !== "none") {
      return { kind: "approval-required", task, occupation, reasonCode: "APPROVAL_REQUIRED" };
    }
    return { kind: "allowed", task, occupation };
  }
}

export function createWorkKernelRuntime(): WorkKernelRuntime {
  const tasks = new TaskRegistry();
  const occupations = new OccupationRegistry();
  const capabilities = new CapabilityRegistry();

  for (const occupation of DEFAULT_OCCUPATION_PROFILES) occupations.register(occupation);
  for (const definition of Object.values(LEGACY_WORKFLOW_TASKS)) tasks.register(legacyTask(definition));

  return new WorkKernelRuntime(tasks, occupations, capabilities);
}
