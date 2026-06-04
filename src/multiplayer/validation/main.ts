import { runMultiAgentValidation } from "./coordinator";
import type { ScenarioId } from "./contracts";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

try {
  const result = await runMultiAgentValidation({
    artifactRoot: argument("--artifacts"),
    seed: argument("--seed") ? Number(argument("--seed")) : undefined,
    forcedFailureScenario: argument("--force-failure") as ScenarioId | undefined,
  });

  console.log(`Multi-agent multiplayer validation: ${result.report.status}`);
  console.log(`Evidence: ${result.runDir}`);
  if (result.report.discrepancies.length > 0) {
    console.error(result.report.discrepancies.join("\n"));
  }
  process.exitCode = result.report.status === "passed" ? 0 : 1;
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
