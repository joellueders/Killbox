import { describe, expect, it } from "vitest";
import { applyCommand, simulationTick } from "../../src/multiplayer/shared/game";
import { createInitialGameState } from "../../src/multiplayer/shared/schema";

function connectedState() {
  const state = createInitialGameState();
  state.phase = "build";
  state.players.get("p1")!.connected = true;
  state.players.get("p2")!.connected = true;
  return state;
}

describe("authoritative commands", () => {
  it("builds, upgrades, and sells a valid owned tower", () => {
    const state = connectedState();
    const build = applyCommand(state, "p1", {
      type: "build_tower",
      siteId: "site-1",
      towerType: "arrow",
    });
    expect(build.ok).toBe(true);
    expect(state.towers.size).toBe(1);
    expect(state.players.get("p1")!.resources).toBe(175);

    const towerId = [...state.towers.keys()][0];
    expect(applyCommand(state, "p1", { type: "upgrade_tower", towerId }).ok).toBe(true);
    expect(state.towers.get(towerId)!.level).toBe(2);
    expect(applyCommand(state, "p1", { type: "sell_tower", towerId }).ok).toBe(true);
    expect(state.towers.size).toBe(0);
    expect(state.buildSites.get("site-1")!.occupiedTowerId).toBe("");
  });

  it("rejects unaffordable and invalid commands without mutation", () => {
    const state = connectedState();
    state.players.get("p1")!.resources = 0;
    const result = applyCommand(state, "p1", {
      type: "build_tower",
      siteId: "site-1",
      towerType: "cannon",
    });
    expect(result).toMatchObject({ ok: false, reason: "not enough resources" });
    expect(state.towers.size).toBe(0);
    expect(state.players.get("p1")!.resources).toBe(0);

    expect(applyCommand(state, "p1", { type: "start_wave" }).ok).toBe(false);
    expect(state.phase).toBe("build");
  });

  it("validates ability cooldowns and reward selection", () => {
    const state = connectedState();
    state.players.get("p1")!.ready = true;
    state.players.get("p2")!.ready = true;
    applyCommand(state, "p1", { type: "start_wave" });
    for (let index = 0; index < 10; index += 1) simulationTick(state);
    const enemy = [...state.enemies.values()][0];
    expect(enemy).toBeDefined();
    const hp = enemy.hp;
    expect(applyCommand(state, "p1", { type: "cast_ability", abilityId: "volley" }).ok).toBe(true);
    expect(enemy.hp).toBe(hp - 25);
    expect(applyCommand(state, "p1", { type: "cast_ability", abilityId: "volley" }).ok).toBe(false);

    for (let index = 0; index < 1000 && state.phase === "combat"; index += 1) {
      simulationTick(state);
    }
    const rewardId = [...state.rewards.keys()][0];
    expect(applyCommand(state, "p1", { type: "choose_reward", rewardId }).ok).toBe(true);
    expect(state.phase).toBe("build");
    expect(state.rewards.size).toBe(0);
  });
});

describe("fixed-step simulation", () => {
  it("advances and completes a shared wave", () => {
    const state = connectedState();
    state.players.get("p1")!.ready = true;
    state.players.get("p2")!.ready = true;
    expect(applyCommand(state, "p1", { type: "start_wave" }).ok).toBe(true);

    for (let index = 0; index < 1000 && state.phase === "combat"; index += 1) {
      simulationTick(state);
    }

    expect(state.tick).toBeGreaterThan(0);
    expect(state.wave.completed).toBe(true);
    expect(state.phase).toBe("reward");
    expect(state.outcome).toBe("victory");
    expect(state.rewards.size).toBeGreaterThan(0);
  });

  it("records defeat when authoritative base health reaches zero", () => {
    const state = connectedState();
    state.baseHealth = 10;
    state.players.get("p1")!.ready = true;
    state.players.get("p2")!.ready = true;
    applyCommand(state, "p1", { type: "start_wave" });

    for (let index = 0; index < 1000 && state.phase === "combat"; index += 1) {
      simulationTick(state);
    }

    expect(state.phase).toBe("ended");
    expect(state.outcome).toBe("defeat");
    expect(state.baseHealth).toBe(0);
  });
});
