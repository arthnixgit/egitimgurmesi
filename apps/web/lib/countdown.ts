import type { ExamCountdownTarget } from "./free-materials";

const SECOND_MS = 1000;
const MINUTE_MS = SECOND_MS * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

export type CountdownBreakdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

export function getDayHourMinuteSecondBreakdown(targetIso: string, nowMs: number): CountdownBreakdown | null {
  const targetMs = new Date(targetIso).getTime();

  if (Number.isNaN(targetMs)) {
    return null;
  }

  if (nowMs >= targetMs) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isComplete: true
    };
  }

  const diffMs = targetMs - nowMs;
  const days = Math.floor(diffMs / DAY_MS);
  const hours = Math.floor((diffMs % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((diffMs % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((diffMs % MINUTE_MS) / SECOND_MS);

  return {
    days,
    hours,
    minutes,
    seconds,
    isComplete: false
  };
}

export function getPrimaryCountdownTarget(
  countdowns: readonly ExamCountdownTarget[],
  nowMs: number
): ExamCountdownTarget | null {
  const withTargets = countdowns.filter((item) => item.targetIso);

  if (withTargets.length === 0) {
    return countdowns[0] ?? null;
  }

  const sorted = [...withTargets].sort((left, right) => {
    return new Date(left.targetIso as string).getTime() - new Date(right.targetIso as string).getTime();
  });

  return sorted.find((item) => new Date(item.targetIso as string).getTime() > nowMs) ?? sorted[0] ?? null;
}
