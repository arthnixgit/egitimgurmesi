import { PublicPageLayout } from "../../components/public-page-layout";
import { ShowcaseQuickActions } from "../../components/showcase-quick-actions";
import { StaffMarquee } from "../../components/staff-marquee";
import { getAcademicStaffGroups } from "../../lib/public-content-api";

export default async function AcademicStaffPage() {
  const academicStaffGroups = await getAcademicStaffGroups();

  return (
    <PublicPageLayout>
      <section className="ega-section ega-container">
        <div className="ega-staff-quiz-trigger">
          <ShowcaseQuickActions
            sourcePage="academic-staff-mini-quiz"
            mode="quiz-only"
            align="center"
          />
        </div>

        <div className="ega-staff-page-grid">
          {academicStaffGroups.map((group) => (
            <StaffMarquee key={group.id} group={group} />
          ))}
        </div>
      </section>
    </PublicPageLayout>
  );
}
