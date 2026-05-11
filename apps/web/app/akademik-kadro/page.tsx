import { SectionHeading } from "@ega/ui";
import { PublicPageLayout } from "../../components/public-page-layout";
import { StaffMarquee } from "../../components/staff-marquee";
import { getAcademicStaffGroups } from "../../lib/public-content-api";

export default async function AcademicStaffPage() {
  const academicStaffGroups = await getAcademicStaffGroups();

  return (
    <PublicPageLayout>
      <section className="ega-staff-page-hero">
        <div className="ega-container ega-staff-page-hero__inner">
          <div className="ega-staff-page-hero__copy">
            <span className="ega-eyebrow">Akademik Kadro</span>
            <h1>Koçlarımızı ve öğretmenlerimizi tek bakışta tanıyabileceğin canlı kadro alanı.</h1>
            <p>
              Rehber öğretmenlerden branş hocalarına kadar tüm ekip, öğrencinin rahatça inceleyebileceği akışlı bir vitrin içinde sunulur.
            </p>
          </div>

          <div className="ega-staff-page-hero__panel">
            <span>Akademik ekip</span>
            <strong>{academicStaffGroups.length} ayrı kadro alanı</strong>
            <p>Her alan farklı ekip yapısını öne çıkarır; öğrenci danışmanını ve ders kadrosunu ayrı ayrı görebilir.</p>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <SectionHeading
          eyebrow="Kadro Vitrini"
          title="Aynı sayfada iki ayrı ekip, iki yönlü akan canlı galeri düzeni"
          description="İmleç üstüne geldiğinde akış durur; böylece ziyaretçi isimleri, branşları ve görevleri rahatça inceleyebilir."
        />

        <div className="ega-staff-page-grid">
          {academicStaffGroups.map((group) => (
            <StaffMarquee key={group.id} group={group} />
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
