import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

type ButtonLinkProps = {
  href: string;
  label: string;
  variant?: "primary" | "ghost";
  target?: "_blank" | "_self";
  rel?: string;
  className?: string;
};

type MetricCardProps = {
  value: string;
  label: string;
  description: string;
};

type FeatureCardProps = {
  eyebrow?: string;
  title: string;
  description: string;
  detail?: string;
};

type OfferCardProps = {
  label: string;
  title: string;
  description: string;
  bullets: readonly string[];
  note: string;
  primaryAction: ButtonLinkProps;
  secondaryAction?: ButtonLinkProps;
  tone?: "navy" | "teal";
};

type ProcessStepProps = {
  step: string;
  title: string;
  description: string;
};

type FaqItemProps = {
  question: string;
  answer: string;
};

type QuoteCardProps = {
  quote: string;
  caption: string;
  icon?: ReactNode;
};

function buttonClassName(
  variant: ButtonLinkProps["variant"] = "primary",
  className?: string
) {
  const base = variant === "ghost" ? "ega-button ega-button--ghost" : "ega-button";
  return className ? `${base} ${className}` : base;
}

export function ButtonLink({ href, label, variant = "primary", target, rel, className }: ButtonLinkProps) {
  return (
    <a className={buttonClassName(variant, className)} href={href} target={target} rel={rel}>
      {label}
    </a>
  );
}

export function SectionHeading({
  eyebrow = "Eğitim Gurmesi Akademi",
  title,
  description
}: SectionHeadingProps) {
  return (
    <div className="ega-section-heading">
      {eyebrow ? <div className="ega-pill">{eyebrow}</div> : null}
      <h2 className="ega-section-heading__title">{title}</h2>
      {description ? <p className="ega-section-heading__description">{description}</p> : null}
    </div>
  );
}

export function MetricCard({ value, label, description }: MetricCardProps) {
  return (
    <article className="ega-metric-card">
      <strong className="ega-metric-card__value">{value}</strong>
      <h3 className="ega-metric-card__label">{label}</h3>
      <p className="ega-metric-card__description">{description}</p>
    </article>
  );
}

export function FeatureCard({ eyebrow, title, description, detail }: FeatureCardProps) {
  return (
    <article className="ega-feature-card">
      {eyebrow ? <div className="ega-pill">{eyebrow}</div> : null}
      <h3 className="ega-feature-card__title">{title}</h3>
      <p className="ega-feature-card__description">{description}</p>
      {detail ? <p className="ega-feature-card__detail">{detail}</p> : null}
    </article>
  );
}

export function OfferCard({
  label,
  title,
  description,
  bullets,
  note,
  primaryAction,
  secondaryAction,
  tone = "navy"
}: OfferCardProps) {
  return (
    <article className="ega-offer-card" data-tone={tone}>
      <div className="ega-offer-card__header">
        <div className="ega-pill">{label}</div>
        <h3 className="ega-offer-card__title">{title}</h3>
        <p className="ega-offer-card__description">{description}</p>
      </div>

      <div className="ega-offer-card__divider" />

      <ul className="ega-check-list">
        {bullets.map((bullet, index) => (
          <li key={bullet} className="ega-check-list__item">
            <span className="ega-check-list__mark">{String(index + 1).padStart(2, "0")}</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <p className="ega-offer-card__note">{note}</p>

      <div className="ega-offer-card__actions">
        <ButtonLink {...primaryAction} />
        {secondaryAction ? <ButtonLink {...secondaryAction} /> : null}
      </div>
    </article>
  );
}

export function ProcessStep({ step, title, description }: ProcessStepProps) {
  return (
    <article className="ega-process-step">
      <div className="ega-process-step__number">{step}</div>
      <h3 className="ega-process-step__title">{title}</h3>
      <p className="ega-process-step__description">{description}</p>
    </article>
  );
}

export function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <article className="ega-faq-item">
      <h3 className="ega-faq-item__question">{question}</h3>
      <p className="ega-faq-item__answer">{answer}</p>
    </article>
  );
}

export function QuoteCard({ quote, caption, icon }: QuoteCardProps) {
  return (
    <article className="ega-quote-card">
      <div className="ega-quote-card__icon">{icon ?? ">"}</div>
      <p className="ega-quote-card__quote">{quote}</p>
      <span className="ega-quote-card__caption">{caption}</span>
    </article>
  );
}
