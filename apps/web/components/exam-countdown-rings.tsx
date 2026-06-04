"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ExamCountdownTarget } from "../lib/free-materials";
import { getDayHourMinuteSecondBreakdown } from "../lib/countdown";

const MAX_DAY_RING = 120;

type CountdownBreakdown = NonNullable<ReturnType<typeof getDayHourMinuteSecondBreakdown>>;

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

function getRingMetrics(breakdown: CountdownBreakdown) {
  const dayProgress = breakdown.isComplete
    ? 100
    : ((MAX_DAY_RING - Math.min(breakdown.days, MAX_DAY_RING)) / MAX_DAY_RING) * 100;
  const hourProgress = breakdown.isComplete ? 100 : (breakdown.hours / 24) * 100;
  const minuteProgress = breakdown.isComplete ? 100 : (breakdown.minutes / 60) * 100;
  const secondProgress = breakdown.isComplete ? 100 : (breakdown.seconds / 60) * 100;

  return [
    { label: "Gün", value: String(breakdown.days).padStart(2, "0"), progress: dayProgress },
    { label: "Saat", value: String(breakdown.hours).padStart(2, "0"), progress: hourProgress },
    { label: "Dakika", value: String(breakdown.minutes).padStart(2, "0"), progress: minuteProgress },
    { label: "Saniye", value: String(breakdown.seconds).padStart(2, "0"), progress: secondProgress }
  ];
}

function CountdownRingGrid({ breakdown, compact = false }: { breakdown: CountdownBreakdown; compact?: boolean }) {
  const className = compact ? "ega-exam-rings__grid ega-exam-rings__grid--compact" : "ega-exam-rings__grid";

  return (
    <div className={className}>
      {getRingMetrics(breakdown).map((metric) => (
        <CountdownRing
          key={metric.label}
          label={metric.label}
          value={metric.value}
          progress={metric.progress}
        />
      ))}
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

  return (
    <section className="ega-exam-surface ega-exam-surface--countdown ega-exam-rings">
      <div className="ega-exam-rings__heading">
        <h2>Sınava Kalan Süre</h2>
        <p>Sayaç, {countdown.label} başlangıç saatine göre güncellenir.</p>
      </div>

      <CountdownRingGrid breakdown={breakdown} />

      <div className="ega-exam-rings__meta">
        <strong>{countdown.dateLabel}</strong>
        <span>{breakdown.isComplete ? "Sınav saati geldi veya geçti." : countdown.note}</span>
      </div>
    </section>
  );
}

export function ExamCountdownRingSessions({ countdowns }: { countdowns: readonly ExamCountdownTarget[] }) {
  const [nowMs, setNowMs] = useState(0);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  useEffect(() => {
    setNowMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setActiveSessionIndex((current) => Math.min(current, Math.max(0, countdowns.length - 1)));
  }, [countdowns.length]);

  const items = useMemo(() => {
    return countdowns.map((countdown) => ({
      ...countdown,
      breakdown: countdown.targetIso ? getDayHourMinuteSecondBreakdown(countdown.targetIso, nowMs) : null
    }));
  }, [countdowns, nowMs]);

  return (
    <section className="ega-exam-surface ega-exam-surface--countdown ega-exam-rings ega-exam-rings--sessions">
      <div className="ega-exam-rings__heading">
        <h2>Sınava Kalan Süre</h2>
        <p>Her oturum kendi başlangıç saatine göre gün, saat, dakika ve saniye olarak güncellenir.</p>
      </div>

      {items.length > 1 ? (
        <div className="ega-exam-rings__session-switcher" role="tablist" aria-label="LGS oturum seçimi">
          {items.map((countdown, index) => (
            <button
              key={countdown.label}
              type="button"
              role="tab"
              aria-selected={activeSessionIndex === index}
              data-active={activeSessionIndex === index}
              onClick={() => setActiveSessionIndex(index)}
            >
              {countdown.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="ega-exam-rings__sessions">
        {items.map((countdown, index) => (
          <article
            key={countdown.label}
            className="ega-exam-rings__session"
            data-active={activeSessionIndex === index}
          >
            <div className="ega-exam-rings__session-head">
              <span>{countdown.label}</span>
              <strong>{countdown.dateLabel}</strong>
              <p>
                {countdown.breakdown?.isComplete
                  ? "Sınav saati geldi veya geçti."
                  : countdown.note}
              </p>
            </div>

            {countdown.breakdown ? (
              <CountdownRingGrid breakdown={countdown.breakdown} compact />
            ) : (
              <div className="ega-exam-countdown-card__pending">
                <strong>Resmi tarih bekleniyor</strong>
                <p>{countdown.note}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
