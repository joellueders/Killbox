import Phaser from "phaser";
import { RENDER_PATH } from "../shared/game";
import type { GameState } from "../shared/schema";

export class GameScene extends Phaser.Scene {
  private state?: GameState;
  private graphics?: Phaser.GameObjects.Graphics;
  private enemyDisplayProgress = new Map<string, number>();

  constructor() {
    super("killbox-coop");
  }

  create() {
    this.graphics = this.add.graphics();
    this.add.text(20, 16, "Authoritative Colyseus simulation", {
      color: "#f2c86f",
      fontFamily: "system-ui",
      fontSize: "18px",
    });
  }

  setAuthoritativeState(state: GameState) {
    this.state = state;
  }

  update(_time: number, delta: number) {
    if (!this.graphics || !this.state) return;
    this.graphics.clear();
    this.drawArena(delta);
  }

  private drawArena(delta: number) {
    const graphics = this.graphics!;
    const state = this.state!;

    graphics.fillStyle(0x201813, 1);
    graphics.fillRect(0, 0, 1100, 520);
    graphics.lineStyle(54, 0x3e3025, 1);
    graphics.lineBetween(RENDER_PATH.startX, RENDER_PATH.y, RENDER_PATH.endX, RENDER_PATH.y);
    graphics.lineStyle(2, 0x8f6d42, 1);
    graphics.lineBetween(RENDER_PATH.startX, RENDER_PATH.y, RENDER_PATH.endX, RENDER_PATH.y);

    graphics.fillStyle(0x9b3c32, 1);
    graphics.fillRect(RENDER_PATH.endX - 12, RENDER_PATH.y - 45, 24, 90);

    state.buildSites.forEach((site) => {
      graphics.lineStyle(2, site.occupiedTowerId ? 0x6e5540 : 0xd6aa62, 1);
      graphics.strokeCircle(site.x, site.y, 24);
    });

    state.towers.forEach((tower) => {
      const site = state.buildSites.get(tower.siteId);
      if (!site) return;
      graphics.fillStyle(tower.ownerId === "p1" ? 0x79b9e8 : 0xe8a879, 1);
      if (tower.type === "cannon") {
        graphics.fillRect(site.x - 18, site.y - 18, 36, 36);
      } else {
        graphics.fillTriangle(site.x, site.y - 23, site.x - 21, site.y + 18, site.x + 21, site.y + 18);
      }
      graphics.lineStyle(tower.level, 0xffe8a8, 1);
      graphics.strokeCircle(site.x, site.y, 27 + tower.level * 2);
    });

    const present = new Set<string>();
    state.enemies.forEach((enemy, id) => {
      present.add(id);
      const current = this.enemyDisplayProgress.get(id) ?? enemy.progress;
      const blend = Math.min(1, delta / 90);
      const display = current + (enemy.progress - current) * blend;
      this.enemyDisplayProgress.set(id, display);
      const x = RENDER_PATH.startX + (RENDER_PATH.endX - RENDER_PATH.startX) * display;
      graphics.fillStyle(0xc65c4b, 1);
      graphics.fillCircle(x, RENDER_PATH.y, 14);
      graphics.fillStyle(0x19100c, 1);
      graphics.fillRect(x - 17, RENDER_PATH.y - 25, 34, 5);
      graphics.fillStyle(0x9bd260, 1);
      graphics.fillRect(x - 17, RENDER_PATH.y - 25, 34 * Math.max(0, enemy.hp / enemy.maxHp), 5);
    });
    for (const id of this.enemyDisplayProgress.keys()) {
      if (!present.has(id)) this.enemyDisplayProgress.delete(id);
    }

    state.effects.forEach((effect) => {
      graphics.lineStyle(3, 0xffdf79, Math.min(1, effect.ttlTicks / 2));
      graphics.lineBetween(effect.fromX, effect.fromY, effect.toX, effect.toY);
    });
  }
}
