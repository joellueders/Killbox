import { MapSchema, Schema, defineTypes } from "@colyseus/schema";

export type PlayerId = "p1" | "p2";
export type RoomPhase = "lobby" | "build" | "combat" | "reward" | "ended";
export type GameOutcome = "" | "victory" | "defeat";

export class PlayerSlot extends Schema {
  id = "";
  connected = false;
  ready = false;
  resources = 250;
  abilityCooldownTicks = 0;
}
defineTypes(PlayerSlot, {
  id: "string",
  connected: "boolean",
  ready: "boolean",
  resources: "number",
  abilityCooldownTicks: "number",
});

export class BuildSite extends Schema {
  id = "";
  x = 0;
  y = 0;
  occupiedTowerId = "";
}
defineTypes(BuildSite, {
  id: "string",
  x: "number",
  y: "number",
  occupiedTowerId: "string",
});

export class TowerState extends Schema {
  id = "";
  type = "";
  ownerId = "";
  siteId = "";
  level = 1;
  cooldownTicks = 0;
}
defineTypes(TowerState, {
  id: "string",
  type: "string",
  ownerId: "string",
  siteId: "string",
  level: "number",
  cooldownTicks: "number",
});

export class EnemyState extends Schema {
  id = "";
  hp = 0;
  maxHp = 0;
  progress = 0;
  speed = 0;
}
defineTypes(EnemyState, {
  id: "string",
  hp: "number",
  maxHp: "number",
  progress: "number",
  speed: "number",
});

export class AttackEffect extends Schema {
  id = "";
  fromX = 0;
  fromY = 0;
  toX = 0;
  toY = 0;
  ttlTicks = 0;
}
defineTypes(AttackEffect, {
  id: "string",
  fromX: "number",
  fromY: "number",
  toX: "number",
  toY: "number",
  ttlTicks: "number",
});

export class RewardState extends Schema {
  id = "";
  label = "";
  claimed = false;
}
defineTypes(RewardState, {
  id: "string",
  label: "string",
  claimed: "boolean",
});

export class WaveState extends Schema {
  number = 0;
  spawned = 0;
  total = 0;
  alive = 0;
  completed = false;
}
defineTypes(WaveState, {
  number: "number",
  spawned: "number",
  total: "number",
  alive: "number",
  completed: "boolean",
});

export class GameState extends Schema {
  phase: RoomPhase = "lobby";
  tick = 0;
  baseHealth = 100;
  outcome: GameOutcome = "";
  nextEntityId = 1;
  players = new MapSchema<PlayerSlot>();
  buildSites = new MapSchema<BuildSite>();
  towers = new MapSchema<TowerState>();
  enemies = new MapSchema<EnemyState>();
  effects = new MapSchema<AttackEffect>();
  rewards = new MapSchema<RewardState>();
  wave = new WaveState();
}
defineTypes(GameState, {
  phase: "string",
  tick: "number",
  baseHealth: "number",
  outcome: "string",
  nextEntityId: "number",
  players: { map: PlayerSlot },
  buildSites: { map: BuildSite },
  towers: { map: TowerState },
  enemies: { map: EnemyState },
  effects: { map: AttackEffect },
  rewards: { map: RewardState },
  wave: WaveState,
});

export function createInitialGameState(): GameState {
  const state = new GameState();
  for (const id of ["p1", "p2"] as const) {
    const player = new PlayerSlot();
    player.id = id;
    state.players.set(id, player);
  }

  const positions = [
    [160, 180],
    [310, 365],
    [460, 180],
    [610, 365],
    [760, 180],
    [910, 365],
  ];
  positions.forEach(([x, y], index) => {
    const site = new BuildSite();
    site.id = `site-${index + 1}`;
    site.x = x;
    site.y = y;
    state.buildSites.set(site.id, site);
  });
  return state;
}
