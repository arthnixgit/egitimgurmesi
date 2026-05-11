"use client";

import { useEffect, useMemo, useState } from "react";
import { ButtonLink } from "@ega/ui";
import { getDayHourMinuteSecondBreakdown, getPrimaryCountdownTarget } from "../lib/countdown";
import { examCountdownPages, type ExamCountdownPage, type ResourceLink } from "../lib/free-materials";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ega-free-tool-card__metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function FreeToolCard({
  item,
  index,
  countdownPage
}: {
  item: ResourceLink;
  index: number;
  countdownPage?: ExamCountdownPage | null;
}) {
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    setNowMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const page = useMemo(() => {
    if (countdownPage) {
      return countdownPage;
    }

    if (!item.countdownSlug) {
      return null;
    }

    return examCountdownPages.find((entry) => entry.slug === item.countdownSlug) ?? null;
  }, [countdownPage, item.countdownSlug]);

  const activeTarget = useMemo(() => {
    return page ? getPrimaryCountdownTarget(page.countdowns, nowMs) : null;
  }, [page, nowMs]);

  const breakdown = activeTarget?.targetIso ? getDayHourMinuteSecondBreakdown(activeTarget.targetIso, nowMs) : null;
  const isExternal = item.opensInNewTab || item.href.startsWith("http");
  const isPending = !activeTarget?.targetIso || !breakdown;

  return (
    <article className="ega-free-tool-card" data-featured={index === 0 || index === 2}>
      <div className="ega-free-tool-card__top">
        <span>{item.type}</span>
        <small>{String(index + 1).padStart(2, "0")}</small>
      </div>

      <h3>{item.title}</h3>
      <p>{item.summary}</p>

      {page ? (
        <div className="ega-free-tool-card__countdown" data-pending={isPending}>
          <div className="ega-free-tool-card__countdown-head">
            <strong>{activeTarget?.label ?? "Resmî Tarih"}</strong>
            <span>{activeTarget?.dateLabel ?? "Resmî tarih henüz ilan edilmedi"}</span>
          </div>

          {isPending ? (
            <div className="ega-free-tool-card__waiting">
              <strong>Resmî tarih bekleniyor</strong>
              <p>{activeTarget?.note ?? "Bu sınav için doğrulanmış tarih bulunmadığından sayaç başlatılmadı."}</p>
            </div>
          ) : (
            <div className="ega-free-tool-card__metrics">
              <Metric label="Gün" value={String(breakdown.days).padStart(2, "0")} />
              <Metric label="Saat" value={String(breakdown.hours).padStart(2, "0")} />
              <Metric label="Dk" value={String(breakdown.minutes).padStart(2, "0")} />
              <Metric label="Sn" value={String(breakdown.seconds).padStart(2, "0")} />
            </div>
          )}
        </div>
      ) : (
        <div className="ega-free-tool-card__countdown ega-free-tool-card__countdown--placeholder" data-pending="true">
          <div className="ega-free-tool-card__countdown-head">
            <strong>Ücretsiz Araç</strong>
            <span>Bu kart doğrudan dış kaynağa veya bilgi aracına açılır.</span>
          </div>

          <div className="ega-free-tool-card__waiting">
            <strong>Canlı sayaç yok</strong>
            <p>Bu içerik geri sayım yerine doğrudan resmî araç veya bilgi sayfasına yönlendirir.</p>
          </div>
        </div>
      )}

      <div className="ega-pack-card__actions">
        <ButtonLink
          href={item.href}
          label={item.buttonLabel ?? (isExternal ? "Sayfayı Aç" : "İçeriği Aç")}
          target={isExternal ? "_blank" : "_self"}
          rel={isExternal ? "noreferrer" : undefined}
        />
      </div>
    </article>
  );
}
