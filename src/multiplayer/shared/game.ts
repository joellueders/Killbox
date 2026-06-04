import type { CommandResult, GameCommand } from "./commands";
import {
  AttackEffect,
  EnemyState,
  GameState,
  RewardState,
  TowerState,
  type PlayerId,
} from "./schema";

const TOWER_COST = { arrow: 75, cannon: 110 } as const;
const TOWER_DAMAGE = { arrow: 18, cannon: 34 } as const;
const TOWER_RANGE = { arrow: 210, cannon: 175 } as const;
const TOWER_COOLDOWN = { arrow: 8, cannon: 15 } as const;
const UPGRADE_COST = 60;
const SELL_REFUND = 45;
const ABILITY_COOLDOWN = 120;
const PATH_START_X = 40;
const PATH_END_X = 1040;
const PATH_Y = 275;

function accept(command: GameCommand): CommandResult {
  return { ok: true, commandType: command.type };
}

function reject(command: GameCommand, reason: string): CommandResult {
  return { ok: false, commandType: command.type, reason };
}

function playerFor(state: GameState, playerId: PlayerId) {
  const player = state.players.get(playerId);
  if (!player?.connected) return undefined;
  return player;
}

function nextId(state: GameState, prefix: string): string {
  return `${prefix}-${state.nextEntityId++}`;
}

function allPlayersReady(state: GameState): boolean {
  const p1 = state.players.get("p1");
  const p2 = state.players.get("p2");
  return Boolean(p1?.connected && p2?.connected && p1.ready && p2.ready);
}

function addRewards(state: GameState) {
  state.rewards.clear();
  const supply = new RewardState();
  supply.id = nextId(state, "reward");
  supply.label = "+100 supplies";
  state.rewards.set(supply.id, supply);

  const repair = new RewardState();
  repair.id = nextId(state, "reward");
  repair.label = "Repair base";
  state.rewards.set(repair.id, repair);
}

export function startWave(state: GameState) {
  state.phase = "combat";
  state.wave.number += 1;
  state.wave.spawned = 0;
  state.wave.total = 6 + state.wave.number * 2;
  state.wave.alive = 0;
  state.wave.completed = false;
  state.rewards.clear();
  state.players.forEach((player) => {
    player.ready = false;
  });
}

export function applyCommand(
  state: GameState,
  playerId: PlayerId,
  command: GameCommand,
): CommandResult {
  const player = playerFor(state, playerId);
  if (!player) return reject(command, "player is not connected");

  switch (command.type) {
    case "ready":
      if (state.phase === "combat" || state.phase === "ended") {
        return reject(command, "readiness cannot change in this phase");
      }
      player.ready = Boolean(command.ready);
      if (state.phase === "lobby") state.phase = "build";
      return accept(command);

    case "start_wave":
      if (state.phase !== "build") return reject(command, "wave can only start from build phase");
      if (!allPlayersReady(state)) return reject(command, "both connected players must be ready");
      startWave(state);
      return accept(command);

    case "build_tower": {
      if (state.phase !== "build") return reject(command, "towers can only be built during build phase");
      const cost = TOWER_COST[command.towerType];
      if (!cost) return reject(command, "unknown tower type");
      const site = state.buildSites.get(command.siteId);
      if (!site || site.occupiedTowerId) return reject(command, "build site is unavailable");
      if (player.resources < cost) return reject(command, "not enough resources");
      const tower = new TowerState();
      tower.id = nextId(state, "tower");
      tower.type = command.towerType;
      tower.ownerId = playerId;
      tower.siteId = site.id;
      state.towers.set(tower.id, tower);
      site.occupiedTowerId = tower.id;
      player.resources -= cost;
      return accept(command);
    }

    case "upgrade_tower": {
      if (state.phase !== "build") return reject(command, "towers can only be upgraded during build phase");
      const tower = state.towers.get(command.towerId);
      if (!tower || tower.ownerId !== playerId) return reject(command, "tower is not owned by player");
      if (tower.level >= 3) return reject(command, "tower is already at maximum level");
      if (player.resources < UPGRADE_COST) return reject(command, "not enough resources");
      tower.level += 1;
      player.resources -= UPGRADE_COST;
      return accept(command);
    }

    case "sell_tower": {
      if (state.phase !== "build") return reject(command, "towers can only be sold during build phase");
      const tower = state.towers.get(command.towerId);
      if (!tower || tower.ownerId !== playerId) return reject(command, "tower is not owned by player");
      const site = state.buildSites.get(tower.siteId);
      if (site) site.occupiedTowerId = "";
      state.towers.delete(tower.id);
      player.resources += SELL_REFUND * tower.level;
      return accept(command);
    }

    case "cast_ability": {
      if (state.phase !== "combat") return reject(command, "ability can only be cast during combat");
      if (command.abilityId !== "volley") return reject(command, "unknown ability");
      if (player.abilityCooldownTicks > 0) return reject(command, "ability is on cooldown");
      state.enemies.forEach((enemy) => {
        enemy.hp -= 25;
      });
      player.abilityCooldownTicks = ABILITY_COOLDOWN;
      return accept(command);
    }

    case "choose_reward": {
      if (state.phase !== "reward") return reject(command, "reward can only be chosen after a wave");
      const reward = state.rewards.get(command.rewardId);
      if (!reward || reward.claimed) return reject(command, "reward is unavailable");
      reward.claimed = true;
      if (reward.label.includes("supplies")) {
        state.players.forEach((slot) => {
          if (slot.connected) slot.resources += 100;
        });
      } else {
        state.baseHealth = Math.min(100, state.baseHealth + 25);
      }
      state.phase = "build";
      state.rewards.clear();
      return accept(command);
    }
  }
}

function spawnEnemy(state: GameState) {
  const enemy = new EnemyState();
  enemy.id = nextId(state, "enemy");
  enemy.maxHp = 42 + state.wave.number * 8;
  enemy.hp = enemy.maxHp;
  enemy.progress = 0;
  enemy.speed = 0.006 + state.wave.number * 0.0004;
  state.enemies.set(enemy.id, enemy);
  state.wave.spawned += 1;
}

function enemyX(enemy: EnemyState) {
  return PATH_START_X + (PATH_END_X - PATH_START_X) * enemy.progress;
}

function resolveTowers(state: GameState) {
  state.towers.forEach((tower) => {
    if (tower.cooldownTicks > 0) {
      tower.cooldownTicks -= 1;
      return;
    }
    const site = state.buildSites.get(tower.siteId);
    if (!site) return;
    let target: EnemyState | undefined;
    state.enemies.forEach((enemy) => {
      if (target) return;
      const dx = enemyX(enemy) - site.x;
      const dy = PATH_Y - site.y;
      if (Math.hypot(dx, dy) <= TOWER_RANGE[tower.type as keyof typeof TOWER_RANGE]) {
        target = enemy;
      }
    });
    if (!target) return;
    target.hp -= TOWER_DAMAGE[tower.type as keyof typeof TOWER_DAMAGE] * tower.level;
    tower.cooldownTicks = TOWER_COOLDOWN[tower.type as keyof typeof TOWER_COOLDOWN];
    const effect = new AttackEffect();
    effect.id = nextId(state, "effect");
    effect.fromX = site.x;
    effect.fromY = site.y;
    effect.toX = enemyX(target);
    effect.toY = PATH_Y;
    effect.ttlTicks = 3;
    state.effects.set(effect.id, effect);
  });
}

function resolveEnemies(state: GameState) {
  const removed: string[] = [];
  state.enemies.forEach((enemy, id) => {
    if (enemy.hp <= 0) {
      removed.push(id);
      state.players.forEach((player) => {
        if (player.connected) player.resources += 12;
      });
      return;
    }
    enemy.progress += enemy.speed;
    if (enemy.progress >= 1) {
      removed.push(id);
      state.baseHealth = Math.max(0, state.baseHealth - 10);
    }
  });
  removed.forEach((id) => state.enemies.delete(id));
  state.wave.alive = state.enemies.size;
}

function resolveEffects(state: GameState) {
  const removed: string[] = [];
  state.effects.forEach((effect, id) => {
    effect.ttlTicks -= 1;
    if (effect.ttlTicks <= 0) removed.push(id);
  });
  removed.forEach((id) => state.effects.delete(id));
}

export function simulationTick(state: GameState) {
  state.tick += 1;
  state.players.forEach((player) => {
    if (player.abilityCooldownTicks > 0) player.abilityCooldownTicks -= 1;
  });
  resolveEffects(state);
  if (state.phase !== "combat") return;

  if (state.wave.spawned < state.wave.total && state.tick % 10 === 0) {
    spawnEnemy(state);
  }
  resolveTowers(state);
  resolveEnemies(state);

  if (state.baseHealth <= 0) {
    state.phase = "ended";
    state.outcome = "defeat";
    state.enemies.clear();
    return;
  }

  if (state.wave.spawned >= state.wave.total && state.enemies.size === 0) {
    state.wave.completed = true;
    state.phase = "reward";
    state.outcome = state.wave.number >= 1 ? "victory" : "";
    addRewards(state);
  }
}

export const RENDER_PATH = {
  startX: PATH_START_X,
  endX: PATH_END_X,
  y: PATH_Y,
};
