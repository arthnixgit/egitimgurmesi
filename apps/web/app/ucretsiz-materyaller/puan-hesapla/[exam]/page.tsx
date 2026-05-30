import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreCalculatorForm } from "../../../../components/score-calculator-form";
import { PublicPageLayout } from "../../../../components/public-page-layout";
import {
  getScoreCalculatorConfig,
  scoreCalculatorBasePath,
  scoreCalculatorConfigs,
  type ScoreExamKey
} from "../../../../lib/score-calculators";

export function generateStaticParams() {
  return Object.keys(scoreCalculatorConfigs).map((exam) => ({ exam }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ exam: string }>;
}): Promise<Metadata> {
  const { exam } = await params;
  const config = getScoreCalculatorConfig(exam);

  if (!config) {
    return {
      title: "Puan Hesaplama"
    };
  }

  return {
    title: `${config.title} | Eğitim Gurmesi Akademi`,
    description: config.description
  };
}

export default async function ScoreCalculatorExamPage({
  params
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  const config = getScoreCalculatorConfig(exam);

  if (!config) {
    notFound();
  }

  const siblingCalculators = (Object.keys(scoreCalculatorConfigs) as ScoreExamKey[])
    .map((key) => scoreCalculatorConfigs[key])
    .filter((item) => item.key !== config.key);

  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <span className="ega-eyebrow">{config.eyebrow}</span>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
            <div className="ega-exam-hero__update">Net hesabı: doğru sayısı - yanlış sayısı / 4</div>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-exam-stack">
          <ScoreCalculatorForm config={config} />

          <section className="ega-exam-surface">
            <div className="ega-free-block__head ega-free-block__head--tight">
              <h2>Diğer puan hesaplama ekranları</h2>
              <p>LGS ve YKS oturumları arasında geçiş yaparak netlerini ayrı ayrı değerlendirebilirsin.</p>
            </div>

            <div className="ega-score-link-grid">
              <Link href={scoreCalculatorBasePath}>Tüm Hesaplayıcılar</Link>
              {siblingCalculators.map((item) => (
                <Link key={item.key} href={`${scoreCalculatorBasePath}/${item.key}`}>
                  {item.title}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </PublicPageLayout>
  );
}
