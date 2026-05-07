type SectionTitleProps = {
  title: string;
  description: string;
};

type SectionCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

type StatCardProps = {
  value: string;
  label: string;
};

type SplitPanelProps = {
  label: string;
  title: string;
  description: string;
};

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <>
      <div className="ega-pill">Bilgi Mimarisi</div>
      <h2 style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
      <p>{description}</p>
    </>
  );
}

export function SectionCard({ eyebrow, title, description }: SectionCardProps) {
  return (
    <article className="ega-card">
      <div className="ega-pill">{eyebrow}</div>
      <h3 style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
      <p>{description}</p>
    </article>
  );
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="ega-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function SplitPanel({ label, title, description }: SplitPanelProps) {
  return (
    <article className="ega-split__panel">
      <strong className="ega-pill">{label}</strong>
      <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 10px" }}>{title}</h3>
      <p style={{ color: "var(--ega-muted)", lineHeight: 1.7 }}>{description}</p>
    </article>
  );
}
