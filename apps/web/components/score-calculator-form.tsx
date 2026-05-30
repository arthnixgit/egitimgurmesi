"use client";

import { useMemo, useState } from "react";
import {
  calculateScore,
  type ScoreCalculatorConfig,
  type ScoreSubjectInput
} from "../lib/score-calculators";

function createInitialInputs(config: ScoreCalculatorConfig) {
  return Object.fromEntries(
    config.subjects.map((subject) => [
      subject.id,
      {
        correct: 0,
        wrong: 0,
        blank: subject.maxQuestions
      }
    ])
  ) as Record<string, ScoreSubjectInput>;
}

function clampQuestionValue(value: string, maxQuestions: number) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(maxQuestions, parsed));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

export function ScoreCalculatorForm({ config }: { config: ScoreCalculatorConfig }) {
  const [inputs, setInputs] = useState(() => createInitialInputs(config));

  const result = useMemo(() => calculateScore(config, inputs), [config, inputs]);
  const hasTotalWarning = result.subjects.some(
    (subject) => subject.correct + subject.wrong + subject.blank > subject.maxQuestions
  );

  function updateInput(subjectId: string, field: keyof ScoreSubjectInput, value: string) {
    const subject = config.subjects.find((item) => item.id === subjectId);

    if (!subject) {
      return;
    }

    setInputs((current) => {
      const currentInput = current[subjectId] ?? {
        correct: 0,
        wrong: 0,
        blank: subject.maxQuestions
      };
      const nextInput = {
        ...currentInput,
        [field]: clampQuestionValue(value, subject.maxQuestions)
      };

      if (field === "correct" || field === "wrong") {
        nextInput.blank = Math.max(0, subject.maxQuestions - nextInput.correct - nextInput.wrong);
      }

      return {
        ...current,
        [subjectId]: nextInput
      };
    });
  }

  function resetInputs() {
    setInputs(createInitialInputs(config));
  }

  return (
    <section className="ega-score-calculator">
      <div className="ega-score-calculator__layout">
        <div className="ega-score-calculator__form-card">
          <div className="ega-score-calculator__head">
            <h2>Netlerini Gir</h2>
            <p>Her ders için doğru, yanlış ve boş sayılarını yaz. Netler anında hesaplanır.</p>
          </div>

          <div className="ega-score-subjects">
            {config.subjects.map((subject) => {
              const input = inputs[subject.id] ?? {
                correct: 0,
                wrong: 0,
                blank: subject.maxQuestions
              };
              const subjectResult = result.subjects.find((item) => item.id === subject.id);
              const totalAnswered = input.correct + input.wrong + input.blank;
              const isInvalid = totalAnswered > subject.maxQuestions;

              return (
                <article key={subject.id} className="ega-score-subject" data-invalid={isInvalid}>
                  <div className="ega-score-subject__title">
                    <strong>{subject.label}</strong>
                    <span>{subject.maxQuestions} soru</span>
                  </div>

                  <div className="ega-score-subject__inputs">
                    <label>
                      <span>Doğru</span>
                      <input
                        type="number"
                        min={0}
                        max={subject.maxQuestions}
                        value={input.correct}
                        onClick={(event) => event.currentTarget.select()}
                        onFocus={(event) => event.currentTarget.select()}
                        onChange={(event) => updateInput(subject.id, "correct", event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Yanlış</span>
                      <input
                        type="number"
                        min={0}
                        max={subject.maxQuestions}
                        value={input.wrong}
                        onClick={(event) => event.currentTarget.select()}
                        onFocus={(event) => event.currentTarget.select()}
                        onChange={(event) => updateInput(subject.id, "wrong", event.target.value)}
                      />
                    </label>
                    <label>
                      <span>Boş</span>
                      <input
                        type="number"
                        min={0}
                        max={subject.maxQuestions}
                        value={input.blank}
                        onClick={(event) => event.currentTarget.select()}
                        onFocus={(event) => event.currentTarget.select()}
                        onChange={(event) => updateInput(subject.id, "blank", event.target.value)}
                      />
                    </label>
                    <div className="ega-score-subject__net">
                      <span>Net</span>
                      <strong>{formatNumber(subjectResult?.net ?? 0)}</strong>
                    </div>
                  </div>

                  {isInvalid ? (
                    <p className="ega-score-subject__warning">Toplam sayı {subject.maxQuestions} soruyu aşmamalı.</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <aside className="ega-score-result-card">
          <span className="ega-score-result-card__eyebrow">Tahmini Hesaplama</span>
          <h2>{config.shortTitle} Sonucu</h2>

          <div className="ega-score-result-card__score">
            <span>Tahmini Puan</span>
            <strong>{formatNumber(result.estimatedScore)}</strong>
          </div>

          <div className="ega-score-result-card__stats">
            <div>
              <span>Toplam Net</span>
              <strong>{formatNumber(result.totalNet)}</strong>
            </div>
            <div>
              <span>Ağırlıklı Net</span>
              <strong>{formatNumber(result.weightedNet)}</strong>
            </div>
          </div>

          <p>{result.recommendation}</p>
          <small>{config.formulaNote}</small>

          {hasTotalWarning ? (
            <div className="ega-score-result-card__alert">Bazı derslerde soru toplamı sınırı aşıyor.</div>
          ) : null}

          <button type="button" className="ega-score-reset-button" onClick={resetInputs}>
            Formu Temizle
          </button>
        </aside>
      </div>

      <p className="ega-score-calculator__notice">
        Bu hesaplama tahmini sonuç verir. Resmî yerleştirme sonuçları için ÖSYM/MEB duyuruları esas alınır.
      </p>
    </section>
  );
}
