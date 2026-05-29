"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ExamCountdownTarget } from "../lib/free-materials";
import { getDayHourMinuteSecondBreakdown } from "../lib/countdown";

const MAX_DAY_RING = 120;

function CountdownRing({
  label,
  value,
  progress
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <div className="ega-exam-ring">
      <div
        className="ega-exam-ring__visual"
        style={
          {
            "--progress": `${Math.max(0, Math.min(100, progress))}%`
          } as CSSProperties
        }
      >
        <div className="ega-exam-ring__core">
          <span>{label}</span>
          <strong key={value}>{value}</strong>
        </div>
      </div>
    </div>
  );
}

export function ExamCountdownRings({ countdown }: { countdown: ExamCountdownTarget }) {
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    setNowMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const breakdown = useMemo(
    () => (countdown.targetIso ? getDayHourMinuteSecondBreakdown(countdown.targetIso, nowMs) : null),
    [countdown.targetIso, nowMs]
  );

  if (!breakdown) {
    return (
      <section className="ega-exam-surface ega-exam-surface--countdown">
        <div className="ega-exam-rings__heading">
          <h2>Sınava Kalan Süre</h2>
          <p>Resmî tarih açıklandığında sayaç aktifleşir.</p>
        </div>
        <div className="ega-exam-countdown-card ega-exam-countdown-card--pending-only" data-pending="true">
          <div className="ega-exam-countdown-card__pending">
            <strong>Resmî tarih bekleniyor</strong>
            <p>{countdown.note}</p>
          </div>
        </div>
      </section>
    );
  }

  const dayProgress = breakdown.isComplete
    ? 100
    : ((MAX_DAY_RING - Math.min(breakdown.days, MAX_DAY_RING)) / MAX_DAY_RING) * 100;
  const hourProgress = breakdown.isComplete ? 100 : (breakdown.hours / 24) * 100;
  const minuteProgress = breakdown.isComplete ? 100 : (breakdown.minutes / 60) * 100;
  const secondProgress = breakdown.isComplete ? 100 : (breakdown.seconds / 60) * 100;

  return (
    <section className="ega-exam-surface ega-exam-surface--countdown ega-exam-rings">
      <div className="ega-exam-rings__heading">
        <h2>Sınava Kalan Süre</h2>
        <p>Sayaç, {countdown.label} başlangıç saatine göre güncellenir.</p>
      </div>

      <div className="ega-exam-rings__grid">
        <CountdownRing label="Gün" value={String(breakdown.days).padStart(2, "0")} progress={dayProgress} />
        <CountdownRing label="Saat" value={String(breakdown.hours).padStart(2, "0")} progress={hourProgress} />
        <CountdownRing
          label="Dakika"
          value={String(breakdown.minutes).padStart(2, "0")}
          progress={minuteProgress}
        />
        <CountdownRing
          label="Saniye"
          value={String(breakdown.seconds).padStart(2, "0")}
          progress={secondProgress}
        />
      </div>

      <div className="ega-exam-rings__meta">
        <strong>{countdown.dateLabel}</strong>
        <span>{breakdown.isComplete ? "Sınav saati geldi veya geçti." : countdown.note}</span>
      </div>
    </section>
  );
}
