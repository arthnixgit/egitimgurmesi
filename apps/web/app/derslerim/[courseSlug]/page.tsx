import Link from "next/link";
import { Suspense } from "react";
import { StudentCoursePage } from "../../../components/student-course-viewer";
import { PublicPageLayout } from "../../../components/public-page-layout";

export async function generateStaticParams() {
  return [{ courseSlug: "demo" }];
}

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;

  if (process.env.NEXT_STATIC_EXPORT === "1") {
    return (
      <PublicPageLayout>
        <main className="ega-auth-shell">
          <section className="ega-auth-card">
            <h1>Öğrenci paneli VPS yayınıyla açılacak</h1>
            <p>
              Bu statik cPanel ön izlemesi yalnızca web sitesi tanıtım sayfaları içindir. Ders
              içerikleri, öğrenci hesabı ve LMS akışı API yayına alındığında aktif çalışır.
            </p>
            <div className="ega-actions">
              <Link className="ega-button" href="/paketlerimiz">
                Paketlere Dön
              </Link>
              <Link className="ega-button ega-button--ghost" href="/">
                Ana Sayfaya Git
              </Link>
            </div>
          </section>
        </main>
      </PublicPageLayout>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="ega-lms-shell">
          <div className="ega-message ega-message--success">Kurs yukleniyor...</div>
        </main>
      }
    >
      <StudentCoursePage courseSlug={courseSlug} />
    </Suspense>
  );
}
