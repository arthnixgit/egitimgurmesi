import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageLayout } from "../../../components/public-page-layout";
import { scoreCalculatorBasePath, scoreCalculatorConfigs } from "../../../lib/score-calculators";

export const metadata: Metadata = {
  title: "Puan Hesapla | Eğitim Gurmesi Akademi",
  description:
    "LGS, TYT, AYT ve YDT için netlerini girerek tahmini puanını Eğitim Gurmesi Akademi içinde hesapla."
};

const yksCalculators = [
  scoreCalculatorConfigs.tyt,
  scoreCalculatorConfigs.ayt,
  scoreCalculatorConfigs.ydt
] as const;

export default function ScoreCalculatorLandingPage() {
  return (
    <PublicPageLayout>
      <section className="ega-exam-hero">
        <div className="ega-container ega-exam-hero__inner">
          <div className="ega-exam-hero__intro">
            <span className="ega-eyebrow">Puan Hesaplama</span>
            <h1>Puanını platform içinde hesapla.</h1>
            <p>
              LGS ve YKS oturumları için doğru, yanlış ve boş sayılarını gir; toplam netini,
              ders dağılımını ve tahmini puanını egitimgurmesi.com içinde gör.
            </p>
            <div className="ega-exam-hero__update">Dış sayfaya yönlendirme yapılmaz; hesaplama bu ekranda tamamlanır.</div>
          </div>
        </div>
      </section>

      <section className="ega-section ega-container">
        <div className="ega-score-picker">
          <article className="ega-score-picker-card ega-score-picker-card--yks">
            <span>YKS Puan Hesapla</span>
            <h2>TYT, AYT ve YDT netlerini ayrı ayrı hesapla.</h2>
            <p>
              Her oturum kendi soru yapısına göre açılır; net ve tahmini puan bilgisi anında güncellenir.
            </p>

            <div className="ega-score-picker-card__links">
              {yksCalculators.map((calculator) => (
                <Link key={calculator.key} href={`${scoreCalculatorBasePath}/${calculator.key}`}>
                  {calculator.title}
                </Link>
              ))}
            </div>
          </article>

          <article className="ega-score-picker-card ega-score-picker-card--lgs">
            <span>LGS Puan Hesapla</span>
            <h2>Sözel ve sayısal oturum netlerini tek ekranda gör.</h2>
            <p>
              LGS testlerindeki doğru, yanlış ve boş sayılarını girerek tahmini puanını hesapla.
            </p>

            <div className="ega-score-picker-card__links">
              <Link href={`${scoreCalculatorBasePath}/lgs`}>LGS Puan Hesapla</Link>
            </div>
          </article>
        </div>
      </section>
    </PublicPageLayout>
  );
}
