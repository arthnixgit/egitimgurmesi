"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchMyCourses, type StudentCourseSummary } from "../lib/lms-client";

export function StudentLmsDashboard() {
  const [courses, setCourses] = useState<StudentCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCourses() {
      setLoading(true);

      try {
        const response = await fetchMyCourses();

        if (!active) {
          return;
        }

        setCourses(response);
        setError("");
      } catch (requestError) {
        if (!active) {
          return;
        }

        setCourses([]);
        setError(
          requestError instanceof Error ? requestError.message : "Ders alanı şu anda yüklenemedi."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCourses();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: courses.length,
      totalLessons: courses.reduce((sum, course) => sum + course.course.lessonCount, 0)
    }),
    [courses]
  );

  return (
    <section className="ega-dashboard-card">
      <div className="ega-dashboard-card__head">
        <div>
          <div className="ega-pill">Derslerim</div>
          <h2>Kaldığın yerden devam et</h2>
        </div>
        <Link className="ega-button ega-button--ghost" href="/derslerim">
          Derslerimi Aç
        </Link>
      </div>

      {loading ? (
        <div className="ega-message ega-message--success">Kurs erişimleri yükleniyor...</div>
      ) : null}

      {!loading && error ? <div className="ega-message ega-message--error">{error}</div> : null}

      {!loading && !error ? (
        <>
          <div className="ega-dashboard-kpis ega-dashboard-kpis--compact">
            <div className="ega-dashboard-kpi">
              <strong>{stats.total}</strong>
              <span>Aktif kurs</span>
            </div>
            <div className="ega-dashboard-kpi">
              <strong>{stats.totalLessons}</strong>
              <span>Yayınlanmış ders</span>
            </div>
          </div>

          {courses.length ? (
            <div className="ega-lms-course-grid ega-lms-course-grid--compact">
              {courses.slice(0, 3).map((course) => (
                <Link
                  key={course.enrollmentId}
                  className="ega-lms-course-card"
                  href={`/derslerim/${course.course.slug}`}
                >
                  <div className="ega-lms-course-card__top">
                    <span className="ega-pill ega-pill--soft">
                      {course.product?.name || "Kurs erişimi"}
                    </span>
                    <strong>{course.course.title}</strong>
                  </div>
                  <p>{course.course.shortDescription || "Bu kurs öğrenci paneli üzerinden takip edilir."}</p>
                  <div className="ega-lms-course-card__meta">
                    <span>{course.course.moduleCount} modül</span>
                    <span>{course.course.lessonCount} ders</span>
                    <span>%{course.progressPercent}</span>
                  </div>
                  <div className="ega-lms-course-card__cta">
                    {course.course.nextLessonTitle ? `Sıradaki: ${course.course.nextLessonTitle}` : "Kursu aç"}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="ega-dashboard-empty">
              <p>
                Ders erişimi tanımlandığında burada görünecek. Bu sırada paketleri inceleyebilirsin.
              </p>
              <div className="ega-actions">
                <Link className="ega-button" href="/paketlerimiz">
                  Paketlerimizi İncele
                </Link>
              </div>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
