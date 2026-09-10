import { describe, expect, test } from "bun:test";
import {
  normalizeRiskClass,
  validateCapabilityDefinition,
  validateOccupationProfile,
  validatePolicyDecision,
  validateSuccessCriterion,
  validateTaskDefinition,
  validateWorkPlan,
  type CapabilityDefinition,
  type OccupationProfile,
  type PolicyDecision,
  type RiskClass,
  type SuccessCriterion,
  type TaskDefinition,
  type WorkPlan,
} from "@/lib/coworker/contracts";

describe("coworker domain contracts", () => {
  test("task, occupation, and capability definitions accept open string identifiers", () => {
    const task: TaskDefinition = {
      id: "generate_report",
      version: "1.0.0",
      title: "Generate a report",
      description: "Summarize a result set and produce a business-ready artifact.",
      occupations: ["financial-analyst", "operations-manager"],
      intents: ["report", "variance"],
      requiredCapabilities: ["document.generate", "chart.render"],
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      riskClass: "R1",
      successCriteria: [
        { type: "artifact-exists", artifactType: "report" },
        { type: "custom", verifierId: "artifact_has_sections" },
      ],
      approvalPolicy: { mode: "none" },
      retryPolicy: { maxAttempts: 2, backoffMs: 1000 },
      plannerHints: { typicalSteps: ["collect", "analyze", "compose"], parallelizable: true },
    };

    const occupation: OccupationProfile = {
      id: "operations-manager",
      version: "1.0.0",
      title: "Operations Manager",
      taskSelectors: ["operations", "kpi", "risk"],
      allowedCapabilities: ["document.generate", "chart.render", "data.aggregate"],
      defaultPolicies: { riskTolerance: "R2" },
      performanceMetrics: ["delivery-risk", "variance"],
    };

    const capability: CapabilityDefinition = {
      id: "chart.render",
      version: "1.0.0",
      effect: "read",
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      execute: async () => ({ ok: true, output: { type: "chart" } }),
    };

    expect(validateTaskDefinition(task).success).toBe(true);
    expect(validateOccupationProfile(occupation).success).toBe(true);
    expect(validateCapabilityDefinition(capability).success).toBe(true);
  });

  test("success criteria and policy decisions validate against typed contracts", () => {
    const success: SuccessCriterion = { type: "value-equals", path: "summary.total", expected: 42 };
    const decision: PolicyDecision = {
      allowed: true,
      requiresApproval: false,
      reason: "Within delegated authority",
      constraints: { risk: "R0" },
    };

    expect(validateSuccessCriterion(success).success).toBe(true);
    expect(validatePolicyDecision(decision).success).toBe(true);
  });

  test("work plans carry dependencies and execution state", () => {
    const plan: WorkPlan = {
      id: "plan_1",
      version: 1,
      objective: "Prepare the operating report",
      nodes: [
        {
          id: "node_collect",
          taskId: "retrieve_project_status",
          status: "ready",
          dependencies: [],
          riskClass: "R0",
          input: { projectId: "p-100" },
        },
        {
          id: "node_report",
          taskId: "generate_report",
          status: "pending",
          dependencies: ["node_collect"],
          riskClass: "R1",
          input: { mode: "executive" },
        },
      ],
      edges: [
        { from: "node_collect", to: "node_report", kind: "depends-on" },
      ],
    };

    expect(validateWorkPlan(plan).success).toBe(true);
  });

  test("risk ranks map to R0-R3 and remain configurable", () => {
    const r0: RiskClass = "R0";
    const r3: RiskClass = "R3";

    expect(normalizeRiskClass(r0)).toBe(0);
    expect(normalizeRiskClass(r3)).toBe(3);
  });
});
