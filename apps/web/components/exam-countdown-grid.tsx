"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExamCountdownTarget } from "../lib/free-materials";
import { getDayHourMinuteSecondBreakdown } from "../lib/countdown";

function CountdownMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ega-exam-countdown-card__metric">
      <strong>
        <span key={value} className="ega-exam-countdown-card__metric-value">
          {value}
        </span>
      </strong>
      <span>{label}</span>
    </div>
  );
}

export function ExamCountdownGrid({ countdowns }: { countdowns: readonly ExamCountdownTarget[] }) {
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    setNowMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const items = useMemo(() => {
    return countdowns.map((countdown) => ({
      ...countdown,
      breakdown: countdown.targetIso ? getDayHourMinuteSecondBreakdown(countdown.targetIso, nowMs) : null
    }));
  }, [countdowns, nowMs]);

  return (
    <div className="ega-exam-countdown-grid">
      {items.map((countdown) => {
        const isPending = !countdown.targetIso || !countdown.breakdown;
        const isComplete = countdown.breakdown?.isComplete;

        return (
          <article key={countdown.label} className="ega-exam-countdown-card" data-pending={isPending}>
            <div className="ega-exam-countdown-card__head">
              <span>{countdown.label}</span>
              <small>{countdown.dateLabel}</small>
            </div>

            {isPending ? (
              <div className="ega-exam-countdown-card__pending">
                <strong>Resmî tarih bekleniyor</strong>
                <p>{countdown.note}</p>
              </div>
            ) : (
              <>
                <div className="ega-exam-countdown-card__metrics">
                  <CountdownMetric label="Gün" value={String(countdown.breakdown?.days ?? 0).padStart(2, "0")} />
                  <CountdownMetric label="Saat" value={String(countdown.breakdown?.hours ?? 0).padStart(2, "0")} />
                  <CountdownMetric label="Dakika" value={String(countdown.breakdown?.minutes ?? 0).padStart(2, "0")} />
                  <CountdownMetric label="Saniye" value={String(countdown.breakdown?.seconds ?? 0).padStart(2, "0")} />
                </div>
                <p className="ega-exam-countdown-card__note">
                  {isComplete ? "Sınav saati geldi veya geçti." : countdown.note}
                </p>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}
