export const COMMAND_TYPES = [
  "ready",
  "start_wave",
  "build_tower",
  "upgrade_tower",
  "sell_tower",
  "cast_ability",
  "choose_reward",
] as const;

export type CommandType = (typeof COMMAND_TYPES)[number];

export type ReadyCommand = {
  type: "ready";
  ready: boolean;
};

export type StartWaveCommand = {
  type: "start_wave";
};

export type BuildTowerCommand = {
  type: "build_tower";
  siteId: string;
  towerType: "arrow" | "cannon";
};

export type UpgradeTowerCommand = {
  type: "upgrade_tower";
  towerId: string;
};

export type SellTowerCommand = {
  type: "sell_tower";
  towerId: string;
};

export type CastAbilityCommand = {
  type: "cast_ability";
  abilityId: "volley";
};

export type ChooseRewardCommand = {
  type: "choose_reward";
  rewardId: string;
};

export type GameCommand =
  | ReadyCommand
  | StartWaveCommand
  | BuildTowerCommand
  | UpgradeTowerCommand
  | SellTowerCommand
  | CastAbilityCommand
  | ChooseRewardCommand;

export type CommandResult = {
  ok: boolean;
  commandType: string;
  reason?: string;
};

export function isGameCommand(value: unknown): value is GameCommand {
  if (!value || typeof value !== "object") return false;
  const type = (value as { type?: unknown }).type;
  return typeof type === "string" && COMMAND_TYPES.includes(type as CommandType);
}
