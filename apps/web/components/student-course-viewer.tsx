"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthFailure } from "../lib/auth-client";
import { fetchMyCourse, fetchMyCourses, type StudentCourseDetail, type StudentCourseSummary } from "../lib/lms-client";

export function StudentCoursesPage() {
  const [courses, setCourses] = useState<StudentCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
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
          isAuthFailure(requestError)
            ? "Oturum süren doldu. Lütfen tekrar giriş yap."
            : requestError instanceof Error
              ? requestError.message
              : "Kurslar şu anda alınamadı."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="ega-lms-shell">
      <section className="ega-lms-hero">
        <div>
          <div className="ega-pill ega-pill--warm">LMS</div>
          <h1 className="ega-dashboard-title">Derslerin ve modül akışın</h1>
          <p className="ega-dashboard-lead">
            Satın aldığın video paketleri, modüller ve ders içerikleri tek panelde toplanır.
          </p>
        </div>
        <div className="ega-actions">
          <Link className="ega-button ega-button--ghost" href="/hesabim">
            Öğrenci Paneline Dön
          </Link>
        </div>
      </section>

      {loading ? <div className="ega-message ega-message--success">Kurslar yükleniyor...</div> : null}
      {!loading && error ? <div className="ega-message ega-message--error">{error}</div> : null}

      {!loading && !error ? (
        courses.length ? (
          <section className="ega-lms-course-grid">
            {courses.map((course) => (
              <Link
                key={course.enrollmentId}
                className="ega-lms-course-card"
                href={`/derslerim/${course.course.slug}`}
              >
                <div className="ega-lms-course-card__top">
                  <span className="ega-pill ega-pill--soft">
                    {course.product?.name || "LMS kursu"}
                  </span>
                  <strong>{course.course.title}</strong>
                </div>
                <p>{course.course.shortDescription || "Bu kurs yayınlanan dersleri ve kaynakları içerir."}</p>
                <div className="ega-lms-course-card__meta">
                  <span>{course.course.moduleCount} modül</span>
                  <span>{course.course.lessonCount} ders</span>
                  <span>%{course.progressPercent}</span>
                </div>
                <div className="ega-lms-course-card__cta">
                  {course.course.nextLessonTitle ? `Devam et: ${course.course.nextLessonTitle}` : "Kursu aç"}
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="ega-dashboard-card">
            <div className="ega-dashboard-empty">
              <p>
                Aktif kurs erişimi bulunmuyor. Ders paketleri hesabına tanımlandığında listelenir.
              </p>
              <div className="ega-actions">
                <Link className="ega-button" href="/paketlerimiz">
                  Paketlerimizi İncele
                </Link>
              </div>
            </div>
          </section>
        )
      ) : null}
    </main>
  );
}

export function StudentCoursePage({ courseSlug }: { courseSlug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonSlug = searchParams.get("lesson") ?? undefined;
  const [course, setCourse] = useState<StudentCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const response = await fetchMyCourse(courseSlug, lessonSlug);

        if (!active) {
          return;
        }

        setCourse(response);
        setError("");
      } catch (requestError) {
        if (!active) {
          return;
        }

        setCourse(null);
        setError(
          requestError instanceof Error ? requestError.message : "Kurs içeriği şu anda yüklenemedi."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [courseSlug, lessonSlug]);

  return (
    <main className="ega-lms-shell">
      <section className="ega-lms-hero">
        <div>
          <div className="ega-pill">Kurs Görünümü</div>
          <h1 className="ega-dashboard-title">{course?.course.title || "Kurs yükleniyor"}</h1>
          <p className="ega-dashboard-lead">
            Modüller solda, aktif ders görünümü sağda çalışır. Video, doküman ve kaynaklar bu
            alanda izlenir.
          </p>
        </div>
        <div className="ega-actions">
          <Link className="ega-button ega-button--ghost" href="/derslerim">
            Tüm Kurslar
          </Link>
          <Link className="ega-button ega-button--ghost" href="/hesabim">
            Öğrenci Paneli
          </Link>
        </div>
      </section>

      {loading ? <div className="ega-message ega-message--success">Kurs içeriği yükleniyor...</div> : null}
      {!loading && error ? <div className="ega-message ega-message--error">{error}</div> : null}

      {!loading && course ? (
        <div className="ega-lms-viewer">
          <aside className="ega-lms-sidebar">
            <div className="ega-dashboard-card">
              <div className="ega-dashboard-card__head">
                <div>
                  <div className="ega-pill ega-pill--soft">{course.product?.name || "Kurs erişimi"}</div>
                  <h2>{course.course.title}</h2>
                </div>
              </div>

              <div className="ega-dashboard-kpis ega-dashboard-kpis--compact">
                <div className="ega-dashboard-kpi">
                  <strong>{course.course.moduleCount}</strong>
                  <span>Modül</span>
                </div>
                <div className="ega-dashboard-kpi">
                  <strong>{course.course.lessonCount}</strong>
                  <span>Ders</span>
                </div>
                <div className="ega-dashboard-kpi">
                  <strong>%{course.enrollment.progressPercent}</strong>
                  <span>İlerleme</span>
                </div>
              </div>
            </div>

            <div className="ega-dashboard-card">
              <div className="ega-dashboard-card__head">
                <div>
                  <div className="ega-pill">Modüller</div>
                  <h2>Ders Akışı</h2>
                </div>
              </div>

              <div className="ega-lms-module-list">
                {course.course.modules.map((module) => (
                  <div key={module.id} className="ega-lms-module-card">
                    <strong>{module.title}</strong>
                    {module.description ? <p>{module.description}</p> : null}
                    <div className="ega-lms-lesson-list">
                      {module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          className={`ega-lms-lesson-button ${
                            course.activeLesson.slug === lesson.slug ? "ega-lms-lesson-button--active" : ""
                          }`}
                          type="button"
                          onClick={() => router.push(`/derslerim/${course.course.slug}?lesson=${lesson.slug}`)}
                        >
                          <strong>{lesson.title}</strong>
                          <span>
                            {lesson.lessonType} · {formatDuration(lesson.durationSeconds)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="ega-lms-content">
            <div className="ega-dashboard-card">
              <div className="ega-dashboard-card__head">
                <div>
                  <div className="ega-pill ega-pill--warm">{course.activeLesson.moduleTitle}</div>
                  <h2>{course.activeLesson.title}</h2>
                </div>
                <span className="ega-dashboard-status">{course.activeLesson.lessonTypeLabel}</span>
              </div>

              <div className="ega-lms-player-shell">
                {course.activeLesson.video?.sourceUrl ? (
                  <video
                    className="ega-lms-video"
                    controls
                    poster={course.activeLesson.video.thumbnailUrl || undefined}
                    src={course.activeLesson.video.sourceUrl}
                  />
                ) : (
                  <div className="ega-lms-video-placeholder">
                    <strong>Bu derse ait video henüz eklenmedi.</strong>
                    <span>Video yayına alındığında oynatılır.</span>
                  </div>
                )}
              </div>

              <div className="ega-lms-lesson-copy">
                <p>{course.activeLesson.description || "Bu derse ait açıklama henüz eklenmedi."}</p>
                <div className="ega-lms-lesson-meta">
                  <span>{course.activeLesson.lessonTypeLabel}</span>
                  <span>{formatDuration(course.activeLesson.durationSeconds)}</span>
                  <span>{course.activeLesson.resources.length} kaynak</span>
                </div>
              </div>
            </div>

            <div className="ega-dashboard-card">
              <div className="ega-dashboard-card__head">
                <div>
                  <div className="ega-pill">Kaynaklar</div>
                  <h2>Ders Materyalleri</h2>
                </div>
              </div>

              {course.activeLesson.resources.length ? (
                <div className="ega-lms-resource-grid">
                  {course.activeLesson.resources.map((resource) => (
                    <a
                      key={resource.id}
                      className="ega-lms-resource-card"
                      href={resource.externalUrl || "#"}
                      target={resource.externalUrl ? "_blank" : undefined}
                      rel={resource.externalUrl ? "noreferrer" : undefined}
                    >
                      <strong>{resource.title}</strong>
                      <span>{resource.resourceType}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="ega-dashboard-empty">
                  <p>Bu derse bağlı yayınlanmış kaynak görünmüyor.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function formatDuration(durationSeconds?: number | null) {
  if (!durationSeconds || durationSeconds <= 0) {
    return "Süre tanımsız";
  }

  const minutes = Math.round(durationSeconds / 60);
  return `${minutes} dk`;
}
