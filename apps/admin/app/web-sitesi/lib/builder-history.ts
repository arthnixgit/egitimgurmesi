import type { BuilderHistory, BuilderSnapshot } from "./builder-types";

export const emptyHistory: BuilderHistory = {
  past: [],
  future: []
};

export function pushHistory(history: BuilderHistory, snapshot: BuilderSnapshot, limit = 40): BuilderHistory {
  return {
    past: [...history.past.slice(-(limit - 1)), cloneSnapshot(snapshot)],
    future: []
  };
}

export function undoHistory(history: BuilderHistory, current: BuilderSnapshot) {
  const previous = history.past.at(-1);
  if (!previous) {
    return null;
  }

  return {
    snapshot: cloneSnapshot(previous),
    history: {
      past: history.past.slice(0, -1),
      future: [cloneSnapshot(current), ...history.future]
    }
  };
}

export function redoHistory(history: BuilderHistory, current: BuilderSnapshot) {
  const next = history.future[0];
  if (!next) {
    return null;
  }

  return {
    snapshot: cloneSnapshot(next),
    history: {
      past: [...history.past, cloneSnapshot(current)],
      future: history.future.slice(1)
    }
  };
}

export function cloneSnapshot<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}
