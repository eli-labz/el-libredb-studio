import type { OccupationId, OccupationProfile } from "./contracts";

export const DEFAULT_OCCUPATION_PROFILES: readonly OccupationProfile[] = Object.freeze([
  {
    id: "operations-manager",
    version: "1.0.0",
    title: "Operations Manager",
    taskSelectors: ["operations", "kpi", "risk", "workload"],
    allowedCapabilities: ["document.generate", "chart.render", "data.aggregate", "risk.assess"],
    defaultPolicies: { riskTolerance: "R1", approvalMode: "delegated" },
    performanceMetrics: ["delivery-risk", "throughput", "variance"],
  },
  {
    id: "software-engineer",
    version: "1.0.0",
    title: "Software Engineer",
    taskSelectors: ["engineering", "build", "debug", "refactor"],
    allowedCapabilities: ["code.generate", "test.execute", "document.generate", "research.lookup"],
    defaultPolicies: { riskTolerance: "R2", approvalMode: "required" },
    performanceMetrics: ["deployment-success", "cycle-time", "quality"],
  },
  {
    id: "data-analyst",
    version: "1.0.0",
    title: "Data Analyst",
    taskSelectors: ["analysis", "metrics", "reporting", "insight"],
    allowedCapabilities: ["data.aggregate", "chart.render", "document.generate", "research.lookup"],
    defaultPolicies: { riskTolerance: "R1", approvalMode: "none" },
    performanceMetrics: ["signal-quality", "coverage", "variance"],
  },
  {
    id: "product-manager",
    version: "1.0.0",
    title: "Product Manager",
    taskSelectors: ["strategy", "prioritization", "roadmap", "requirements"],
    allowedCapabilities: ["planning.decompose", "document.generate", "research.lookup", "workflow.propose"],
    defaultPolicies: { riskTolerance: "R1", approvalMode: "delegated" },
    performanceMetrics: ["delivery-confidence", "adoption", "alignment"],
  },
  {
    id: "financial-analyst",
    version: "1.0.0",
    title: "Financial Analyst",
    taskSelectors: ["finance", "variance", "forecast", "budget"],
    allowedCapabilities: ["finance.review", "document.generate", "chart.render", "risk.assess"],
    defaultPolicies: { riskTolerance: "R1", approvalMode: "required" },
    performanceMetrics: ["accuracy", "forecast-bias", "margin"],
  },
  {
    id: "support-specialist",
    version: "1.0.0",
    title: "Support Specialist",
    taskSelectors: ["support", "triage", "incident", "customer"],
    allowedCapabilities: ["issue.triage", "notification.send", "document.generate", "research.lookup"],
    defaultPolicies: { riskTolerance: "R0", approvalMode: "delegated" },
    performanceMetrics: ["resolution-time", "satisfaction", "escalation-rate"],
  },
  {
    id: "security-analyst",
    version: "1.0.0",
    title: "Security Analyst",
    taskSelectors: ["security", "threat", "safeguard", "audit"],
    allowedCapabilities: ["risk.assess", "research.lookup", "notification.send", "document.generate"],
    defaultPolicies: { riskTolerance: "R0", approvalMode: "required" },
    performanceMetrics: ["coverage", "mean-time-to-detect", "remediation"],
  },
  {
    id: "research-analyst",
    version: "1.0.0",
    title: "Research Analyst",
    taskSelectors: ["research", "synthesis", "literature", "discovery"],
    allowedCapabilities: ["research.lookup", "document.generate", "data.aggregate", "planning.decompose"],
    defaultPolicies: { riskTolerance: "R1", approvalMode: "none" },
    performanceMetrics: ["evidence-quality", "coverage", "citation-rate"],
  },
  {
    id: "customer-success-manager",
    version: "1.0.0",
    title: "Customer Success Manager",
    taskSelectors: ["customer-success", "renewal", "health", "engagement"],
    allowedCapabilities: ["document.generate", "notification.send", "workflow.propose", "data.aggregate"],
    defaultPolicies: { riskTolerance: "R0", approvalMode: "delegated" },
    performanceMetrics: ["retention", "health-score", "response-time"],
  },
  {
    id: "hr-manager",
    version: "1.0.0",
    title: "HR Manager",
    taskSelectors: ["hr", "people", "operations", "compliance"],
    allowedCapabilities: ["document.generate", "notification.send", "workflow.propose", "research.lookup"],
    defaultPolicies: { riskTolerance: "R0", approvalMode: "required" },
    performanceMetrics: ["time-to-fill", "retention", "policy-compliance"],
  },
]);

export const starterOccupationIds: readonly OccupationId[] = Object.freeze(
  DEFAULT_OCCUPATION_PROFILES.map((occupation) => occupation.id),
);

export const DEFAULT_OCCUPATION_INDEX: Readonly<Record<string, OccupationProfile>> = Object.freeze(
  Object.fromEntries(DEFAULT_OCCUPATION_PROFILES.map((occupation) => [occupation.id, occupation])),
);
