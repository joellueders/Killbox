import type { GameState } from "../shared/schema";

export type AuthoritativeValidationEvent = {
  eventType: string;
  actor?: "p1" | "p2" | "system" | "fault";
  commandType?: string;
  accepted?: boolean;
  metadata?: Record<string, unknown>;
};

export type ValidationObserver = {
  record: (event: AuthoritativeValidationEvent, state: GameState) => void | Promise<void>;
};

let observer: ValidationObserver | undefined;

export function configureValidationObserver(next: ValidationObserver | undefined) {
  observer = next;
}

export function recordValidationEvent(event: AuthoritativeValidationEvent, state: GameState) {
  void observer?.record(event, state);
}
