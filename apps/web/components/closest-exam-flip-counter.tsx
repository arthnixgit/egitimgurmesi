"use client";

import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@ega/ui";
import { examCountdownPages, type ExamCountdownPage, type ExamCountdownTarget } from "../lib/free-materials";

type NearestExamTarget = {
  page: ExamCountdownPage;
  countdown: ExamCountdownTarget;
};

type MonthBreakdown = {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

const SECOND_MS = 1000;
const MINUTE_MS = SECOND_MS * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

function addMonths(base: Date, months: number) {
  const next = new Date(base.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}

function getMonthDayHourMinuteSecondBreakdown(targetIso: string, nowMs: number): MonthBreakdown | null {
  const target = new Date(targetIso);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const now = new Date(nowMs);

  if (nowMs >= target.getTime()) {
    return {
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isComplete: true
    };
  }

  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  let monthAnchor = addMonths(now, months);

  while (monthAnchor.getTime() > target.getTime() && months > 0) {
    months -= 1;
    monthAnchor = addMonths(now, months);
  }

  const diffMs = target.getTime() - monthAnchor.getTime();

  return {
    months,
    days: Math.floor(diffMs / DAY_MS),
    hours: Math.floor((diffMs % DAY_MS) / HOUR_MS),
    minutes: Math.floor((diffMs % HOUR_MS) / MINUTE_MS),
    seconds: Math.floor((diffMs % MINUTE_MS) / SECOND_MS),
    isComplete: false
  };
}

function getNearestExamTarget(pages: readonly ExamCountdownPage[], nowMs: number): NearestExamTarget | null {
  const withTargets = pages
    .flatMap((page) =>
      page.countdowns
        .filter((countdown) => countdown.targetIso)
        .map((countdown) => ({ page, countdown }))
    )
    .sort((left, right) => {
      return new Date(left.countdown.targetIso as string).getTime() - new Date(right.countdown.targetIso as string).getTime();
    });

  return withTargets.find((item) => new Date(item.countdown.targetIso as string).getTime() > nowMs) ?? withTargets[0] ?? null;
}

function FlipMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ega-free-flip-card">
      <div className="ega-free-flip-card__desktop" aria-hidden="true">
        <div className="ega-free-flip-card__panel ega-free-flip-card__panel--top">
          <span key={`${label}-top-${value}`}>{value}</span>
        </div>
        <div className="ega-free-flip-card__hinge" />
        <div className="ega-free-flip-card__panel ega-free-flip-card__panel--bottom">
          <span key={`${label}-bottom-${value}`}>{value}</span>
        </div>
      </div>
      <span className="ega-free-flip-card__label">{label}</span>
    </div>
  );
}

export function ClosestExamFlipCounter({
  pages = examCountdownPages
}: {
  pages?: readonly ExamCountdownPage[];
}) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const nearest = useMemo(() => {
    return getNearestExamTarget(pages, nowMs ?? 0);
  }, [nowMs, pages]);

  const breakdown = useMemo(() => {
    if (!nearest?.countdown.targetIso || nowMs === null) {
      return null;
    }

    return getMonthDayHourMinuteSecondBreakdown(nearest.countdown.targetIso, nowMs);
  }, [nearest, nowMs]);

  if (!nearest) {
    return null;
  }

  const values = breakdown
    ? [
        { label: "Ay", value: String(breakdown.months).padStart(2, "0") },
        { label: "Gün", value: String(breakdown.days).padStart(2, "0") },
        { label: "Saat", value: String(breakdown.hours).padStart(2, "0") },
        { label: "Dakika", value: String(breakdown.minutes).padStart(2, "0") },
        { label: "Saniye", value: String(breakdown.seconds).padStart(2, "0") }
      ]
    : [
        { label: "Ay", value: "--" },
        { label: "Gün", value: "--" },
        { label: "Saat", value: "--" },
        { label: "Dakika", value: "--" },
        { label: "Saniye", value: "--" }
      ];

  return (
    <section className="ega-free-closest-exam" aria-label="En yakın resmi sınav sayacı">
      <div className="ega-free-closest-exam__head">
        <span className="ega-free-closest-exam__eyebrow">En Yakın Resmi Sınav</span>
        <strong>{nearest.countdown.label}</strong>
        <p>{nearest.countdown.dateLabel}</p>
      </div>

      <div className="ega-free-closest-exam__board" data-ready={breakdown ? "true" : "false"}>
        {values.map((item) => (
          <FlipMetric key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      <div className="ega-free-closest-exam__footer">
        <p>{breakdown?.isComplete ? "Sınav saati geldi veya geçti." : nearest.countdown.note}</p>
        <ButtonLink href={nearest.page.slug ? `/ucretsiz-materyaller/${nearest.page.slug}` : "/ucretsiz-materyaller"} label="Detaylı Sayacı Aç" />
      </div>
    </section>
  );
}
