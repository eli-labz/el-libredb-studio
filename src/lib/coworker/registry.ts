import type {
  CapabilityDefinition,
  CapabilityId,
  OccupationId,
  OccupationProfile,
  TaskDefinition,
  TaskId,
} from "./contracts";

export type { CapabilityDefinition, OccupationProfile, TaskDefinition } from "./contracts";

export type TaskResolution =
  | { readonly kind: "resolved"; readonly task: TaskDefinition }
  | { readonly kind: "denied"; readonly reasonCode: "UNKNOWN_TASK" | "AMBIGUOUS_TASK"; readonly requestedId: string };

export type OccupationResolution =
  | { readonly kind: "resolved"; readonly occupation: OccupationProfile }
  | { readonly kind: "denied"; readonly reasonCode: "UNKNOWN_OCCUPATION" | "AMBIGUOUS_OCCUPATION"; readonly requestedId: string };

export type CapabilityResolution =
  | { readonly kind: "resolved"; readonly capability: CapabilityDefinition }
  | { readonly kind: "denied"; readonly reasonCode: "UNKNOWN_CAPABILITY" | "AMBIGUOUS_CAPABILITY"; readonly requestedId: string };

function resolveRequest<T>(
  registry: Map<string, T>,
  requestedId: string,
  label: "task" | "occupation" | "capability",
): { kind: "resolved"; value: T } | { kind: "denied"; reasonCode: string; requestedId: string } {
  if (typeof requestedId !== "string") {
    return { kind: "denied", reasonCode: `UNKNOWN_${label.toUpperCase()}`, requestedId: String(requestedId) };
  }

  const trimmed = requestedId.trim();
  const exact = registry.get(trimmed);
  if (exact) return { kind: "resolved", value: exact };

  const candidate = [...registry.keys()].find((registeredId) => registeredId.toLowerCase() === trimmed.toLowerCase());
  if (candidate && candidate !== trimmed) {
    return { kind: "denied", reasonCode: `AMBIGUOUS_${label.toUpperCase()}`, requestedId: requestedId };
  }

  return { kind: "denied", reasonCode: `UNKNOWN_${label.toUpperCase()}`, requestedId };
}

export class TaskRegistry {
  private readonly tasks = new Map<TaskId, TaskDefinition>();

  register(task: TaskDefinition): void {
    if (typeof task.id !== "string" || task.id.trim().length === 0) {
      throw new Error("TaskDefinition.id must be a non-empty string");
    }
    if (this.tasks.has(task.id)) {
      throw new Error(`Task ${task.id} is already registered`);
    }

    const snapshot: TaskDefinition = Object.freeze({
      ...task,
      occupations: Object.freeze([...task.occupations]),
      intents: Object.freeze([...task.intents]),
      requiredCapabilities: Object.freeze([...task.requiredCapabilities]),
      successCriteria: Object.freeze([...task.successCriteria]),
    });

    this.tasks.set(task.id, snapshot);
  }

  resolve(requestedId: string): TaskResolution {
    const result = resolveRequest(this.tasks, requestedId, "task");
    if (result.kind === "resolved") {
      return { kind: "resolved", task: result.value };
    }
    return {
      kind: "denied",
      reasonCode: result.reasonCode as "UNKNOWN_TASK" | "AMBIGUOUS_TASK",
      requestedId: result.requestedId,
    };
  }

  registeredIds(): readonly string[] {
    return [...this.tasks.keys()].sort();
  }
}

export class OccupationRegistry {
  private readonly occupations = new Map<OccupationId, OccupationProfile>();

  register(occupation: OccupationProfile): void {
    if (typeof occupation.id !== "string" || occupation.id.trim().length === 0) {
      throw new Error("OccupationProfile.id must be a non-empty string");
    }
    if (this.occupations.has(occupation.id)) {
      throw new Error(`Occupation ${occupation.id} is already registered`);
    }

    const snapshot: OccupationProfile = Object.freeze({
      ...occupation,
      taskSelectors: Object.freeze([...occupation.taskSelectors]),
      allowedCapabilities: Object.freeze([...occupation.allowedCapabilities]),
      performanceMetrics: Object.freeze([...occupation.performanceMetrics]),
    });

    this.occupations.set(occupation.id, snapshot);
  }

  resolve(requestedId: string): OccupationResolution {
    const result = resolveRequest(this.occupations, requestedId, "occupation");
    if (result.kind === "resolved") {
      return { kind: "resolved", occupation: result.value };
    }
    return {
      kind: "denied",
      reasonCode: result.reasonCode as "UNKNOWN_OCCUPATION" | "AMBIGUOUS_OCCUPATION",
      requestedId: result.requestedId,
    };
  }

  registeredIds(): readonly string[] {
    return [...this.occupations.keys()].sort();
  }
}

export class CapabilityRegistry {
  private readonly capabilities = new Map<CapabilityId, CapabilityDefinition>();

  register(capability: CapabilityDefinition): void {
    if (typeof capability.id !== "string" || capability.id.trim().length === 0) {
      throw new Error("CapabilityDefinition.id must be a non-empty string");
    }
    if (this.capabilities.has(capability.id)) {
      throw new Error(`Capability ${capability.id} is already registered`);
    }

    this.capabilities.set(capability.id, Object.freeze({ ...capability }));
  }

  resolve(requestedId: string): CapabilityResolution {
    const result = resolveRequest(this.capabilities, requestedId, "capability");
    if (result.kind === "resolved") {
      return { kind: "resolved", capability: result.value };
    }
    return {
      kind: "denied",
      reasonCode: result.reasonCode as "UNKNOWN_CAPABILITY" | "AMBIGUOUS_CAPABILITY",
      requestedId: result.requestedId,
    };
  }

  registeredIds(): readonly string[] {
    return [...this.capabilities.keys()].sort();
  }
}
