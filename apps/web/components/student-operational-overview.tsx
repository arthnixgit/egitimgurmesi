"use client";

import { useEffect, useState } from "react";
import {
  fetchMyOperationalOverview,
  type StudentOperationalOverview
} from "../lib/lms-client";

export function StudentOperationalOverviewPanel() {
  const [data, setData] = useState<StudentOperationalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetchMyOperationalOverview()
      .then((response) => {
        if (active) {
          setData(response);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Operasyon özeti alınamadı.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="ega-dashboard-card">
        <div className="ega-pill">Operasyon</div>
        <h2>Program bilgilerin yükleniyor</h2>
        <p className="ega-dashboard-note">Şube, eğitmen, koç ve canlı ders kayıtları hazırlanıyor.</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="ega-dashboard-card">
        <div className="ega-pill">Operasyon</div>
        <h2>Program özeti alınamadı</h2>
        <div className="ega-message ega-message--error">{error || "Veri bulunamadı."}</div>
      </section>
    );
  }

  return (
    <section className="ega-dashboard-card ega-operational-panel">
      <div className="ega-dashboard-card__head">
        <div>
          <div className="ega-pill">Operasyon</div>
          <h2>Şube, koçluk ve canlı ders planın</h2>
        </div>
        <span className="ega-dashboard-status">
          {data.upcomingSessions.length ? `${data.upcomingSessions.length} yaklaşan ders` : "Program bekliyor"}
        </span>
      </div>

      <div className="ega-dashboard-kpis ega-dashboard-kpis--compact">
        <div className="ega-dashboard-kpi">
          <strong>{data.branches.length}</strong>
          <span>Şube</span>
        </div>
        <div className="ega-dashboard-kpi">
          <strong>{data.classGroups.length}</strong>
          <span>Sınıf / grup</span>
        </div>
        <div className="ega-dashboard-kpi">
          <strong>{data.packages.length}</strong>
          <span>Aktif paket</span>
        </div>
      </div>

      <div className="ega-operational-grid">
        <article>
          <h3>Şube ve ekip</h3>
          <div className="ega-operational-list">
            {data.branches.length ? (
              data.branches.map((branch) => (
                <div className="ega-operational-row" key={branch.id}>
                  <strong>{branch.name}</strong>
                  <span>{branch.organization?.name || "Organizasyon bilgisi bekliyor"}</span>
                </div>
              ))
            ) : (
              <div className="ega-dashboard-empty">Şube üyeliği bulunmuyor.</div>
            )}
            {[...data.instructors, ...data.coaches].slice(0, 4).map((person) => (
              <div className="ega-operational-row" key={`${person.id}-${person.email}`}>
                <strong>{person.name}</strong>
                <span>{person.classGroup?.name || person.branch?.name || person.email}</span>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h3>Yaklaşan canlı dersler</h3>
          <div className="ega-operational-list">
            {data.upcomingSessions.length ? (
              data.upcomingSessions.map((session) => (
                <div className="ega-operational-row" key={session.id}>
                  <strong>{session.title}</strong>
                  <span>{formatDate(session.startsAt)}</span>
                  {session.meetingUrl ? (
                    <a className="ega-button ega-button--ghost" href={session.meetingUrl} target="_blank" rel="noreferrer">
                      Derse Gir
                    </a>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="ega-dashboard-empty">Yaklaşan canlı ders bulunmuyor.</div>
            )}
          </div>
        </article>

        <article>
          <h3>Duyurular</h3>
          <div className="ega-operational-list">
            {data.announcements.length ? (
              data.announcements.map((announcement) => (
                <div className="ega-operational-row" key={announcement.id}>
                  <strong>{announcement.title}</strong>
                  <span>{announcement.body}</span>
                </div>
              ))
            ) : (
              <div className="ega-dashboard-empty">Yayınlanmış duyuru bulunmuyor.</div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
