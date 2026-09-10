import { describe, expect, test } from "bun:test";
import {
  CapabilityRegistry,
  OccupationRegistry,
  TaskRegistry,
  type CapabilityDefinition,
  type OccupationProfile,
  type TaskDefinition,
} from "@/lib/coworker/registry";
import { DEFAULT_OCCUPATION_PROFILES, starterOccupationIds } from "@/lib/coworker/occupations";

describe("coworker registries", () => {
  test("task, occupation, and capability registries resolve and deny safely", () => {
    const registerTask: TaskDefinition = {
      id: "generate_report",
      version: "1.0.0",
      title: "Generate a report",
      occupations: ["operations-manager", "financial-analyst"],
      intents: ["report"],
      requiredCapabilities: ["document.generate", "chart.render"],
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      riskClass: "R1",
      successCriteria: [{ type: "artifact-exists", artifactType: "report" }],
      approvalPolicy: { mode: "none" },
      retryPolicy: { maxAttempts: 2, backoffMs: 250 },
    };

    const registerOccupation: OccupationProfile = {
      id: "operations-manager",
      version: "1.0.0",
      title: "Operations Manager",
      taskSelectors: ["operations", "kpi", "risk"],
      allowedCapabilities: ["document.generate", "chart.render"],
      defaultPolicies: { riskTolerance: "R2" },
      performanceMetrics: ["delivery-risk"],
    };

    const registerCapability: CapabilityDefinition = {
      id: "chart.render",
      version: "1.0.0",
      effect: "read",
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      execute: async (input) => ({ ok: true, output: { input } }),
    };

    const taskRegistry = new TaskRegistry();
    const occupationRegistry = new OccupationRegistry();
    const capabilityRegistry = new CapabilityRegistry();

    taskRegistry.register(registerTask);
    occupationRegistry.register(registerOccupation);
    capabilityRegistry.register(registerCapability);

    expect(taskRegistry.resolve("generate_report")).toMatchObject({ kind: "resolved" });
    expect(occupationRegistry.resolve("operations-manager")).toMatchObject({ kind: "resolved" });
    expect(capabilityRegistry.resolve("chart.render")).toMatchObject({ kind: "resolved" });
    expect(taskRegistry.resolve("missing_task")).toMatchObject({ kind: "denied", reasonCode: "UNKNOWN_TASK" });

    const ambiguousOccupationRegistry = new OccupationRegistry();
    ambiguousOccupationRegistry.register({
      id: "Operations-Manager",
      version: "1.0.0",
      title: "Operations Manager",
      taskSelectors: ["operations"],
      allowedCapabilities: ["document.generate"],
      defaultPolicies: { riskTolerance: "R1" },
      performanceMetrics: ["delivery-risk"],
    });
    expect(ambiguousOccupationRegistry.resolve("operations-manager")).toMatchObject({
      kind: "denied",
      reasonCode: "AMBIGUOUS_OCCUPATION",
    });
  });

  test("the starter catalog includes exactly ten occupations with stable IDs", () => {
    expect(DEFAULT_OCCUPATION_PROFILES.length).toBe(10);
    expect(starterOccupationIds).toHaveLength(10);
    expect(new Set(starterOccupationIds).size).toBe(10);
    expect(starterOccupationIds).toContain("operations-manager");
    expect(starterOccupationIds).toContain("software-engineer");
  });
});
