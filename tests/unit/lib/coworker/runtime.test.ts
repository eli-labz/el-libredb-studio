import { describe, expect, test } from "bun:test";
import { AGENT_WORKFLOW_BUDGETS } from "@/lib/agent/execution-policy";
import { createWorkKernelRuntime } from "@/lib/coworker/runtime";

describe("work kernel runtime adapter", () => {
  test("admits a legacy workflow through registered task and occupation policy", () => {
    const runtime = createWorkKernelRuntime();
    const admission = runtime.admit({
      workflowType: "investigation",
      actor: { sessionId: "session-1", role: "user", mode: "agent" },
      policy: AGENT_WORKFLOW_BUDGETS.investigation.policy,
    });

    expect(admission.kind).toBe("allowed");
    if (admission.kind === "allowed") {
      expect(admission.task.id).toBe("database-investigation");
      expect(admission.occupation.id).toBe("research-analyst");
    }
  });

  test("denies a task when its occupation does not allow a required capability", () => {
    const runtime = createWorkKernelRuntime();
    runtime.tasks.register({
      id: "restricted-task",
      version: "1.0.0",
      title: "Restricted task",
      occupations: ["research-analyst"],
      intents: ["restricted"],
      requiredCapabilities: ["financial.transfer"],
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      riskClass: "R0",
      successCriteria: [{ type: "custom", verifierId: "never" }],
      approvalPolicy: { mode: "none" },
      retryPolicy: { maxAttempts: 0, backoffMs: 0 },
    });

    const admission = runtime.admit({
      taskId: "restricted-task",
      occupationId: "research-analyst",
      actor: { sessionId: "session-1", role: "user", mode: "agent" },
      policy: AGENT_WORKFLOW_BUDGETS.investigation.policy,
    });

    expect(admission).toMatchObject({ kind: "denied", reasonCode: "CAPABILITY_NOT_ALLOWED" });
  });
});
