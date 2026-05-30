import type { ResourceLink } from "./free-materials";

export type ScoreExamKey = "lgs" | "tyt" | "ayt" | "ydt";

export type ScoreSubjectConfig = {
  id: string;
  label: string;
  maxQuestions: number;
  weight: number;
};

export type ScoreCalculatorConfig = {
  key: ScoreExamKey;
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  formulaNote: string;
  subjects: readonly ScoreSubjectConfig[];
  minScore: number;
  maxScore: number;
};

export type ScoreSubjectInput = {
  correct: number;
  wrong: number;
  blank: number;
};

export type ScoreSubjectResult = {
  id: string;
  label: string;
  maxQuestions: number;
  correct: number;
  wrong: number;
  blank: number;
  net: number;
};

export type ScoreCalculatorResult = {
  totalNet: number;
  weightedNet: number;
  maxWeightedNet: number;
  estimatedScore: number;
  completionRatio: number;
  recommendation: string;
  subjects: ScoreSubjectResult[];
};

export const scoreCalculatorBasePath = "/ucretsiz-materyaller/puan-hesapla";

export const scoreCalculatorConfigs: Record<ScoreExamKey, ScoreCalculatorConfig> = {
  lgs: {
    key: "lgs",
    eyebrow: "LGS Puan Hesaplama",
    title: "LGS Puan Hesapla",
    shortTitle: "LGS",
    description:
      "Sözel ve sayısal oturum netlerini girerek LGS için tahmini puan aralığını platform içinde hesapla.",
    formulaNote:
      "LGS tahmini; Türkçe, matematik ve fen bilimleri ağırlığı daha yüksek olacak şekilde net oranı üzerinden hesaplanır.",
    minScore: 100,
    maxScore: 500,
    subjects: [
      { id: "turkce", label: "Türkçe", maxQuestions: 20, weight: 4 },
      { id: "matematik", label: "Matematik", maxQuestions: 20, weight: 4 },
      { id: "fen", label: "Fen Bilimleri", maxQuestions: 20, weight: 4 },
      { id: "inkilap", label: "T.C. İnkılap Tarihi", maxQuestions: 10, weight: 1 },
      { id: "din", label: "Din Kültürü", maxQuestions: 10, weight: 1 },
      { id: "ingilizce", label: "İngilizce", maxQuestions: 10, weight: 1 }
    ]
  },
  tyt: {
    key: "tyt",
    eyebrow: "TYT Puan Hesaplama",
    title: "TYT Puan Hesapla",
    shortTitle: "TYT",
    description:
      "TYT testlerindeki doğru, yanlış ve boş sayılarını girerek toplam netini ve tahmini puanını gör.",
    formulaNote:
      "TYT tahmini, dört testteki toplam netin 120 soru üzerinden oluşturduğu oranla hesaplanır.",
    minScore: 100,
    maxScore: 500,
    subjects: [
      { id: "turkce", label: "Türkçe", maxQuestions: 40, weight: 1 },
      { id: "sosyal", label: "Sosyal Bilimler", maxQuestions: 20, weight: 1 },
      { id: "matematik", label: "Temel Matematik", maxQuestions: 40, weight: 1 },
      { id: "fen", label: "Fen Bilimleri", maxQuestions: 20, weight: 1 }
    ]
  },
  ayt: {
    key: "ayt",
    eyebrow: "AYT Puan Hesaplama",
    title: "AYT Puan Hesapla",
    shortTitle: "AYT",
    description:
      "Alan derslerindeki net dağılımını tek ekranda gör; sayısal, eşit ağırlık ve sözel hazırlık dengesini yorumla.",
    formulaNote:
      "AYT'de resmi puan türleri farklı ağırlıklarla hesaplanır. Bu ekran net dengenizi tek tahmini puanda özetler.",
    minScore: 100,
    maxScore: 500,
    subjects: [
      { id: "matematik", label: "Matematik", maxQuestions: 40, weight: 1.15 },
      { id: "fizik", label: "Fizik", maxQuestions: 14, weight: 1.1 },
      { id: "kimya", label: "Kimya", maxQuestions: 13, weight: 1.1 },
      { id: "biyoloji", label: "Biyoloji", maxQuestions: 13, weight: 1.1 },
      { id: "edebiyat", label: "Edebiyat", maxQuestions: 24, weight: 1 },
      { id: "tarih", label: "Tarih", maxQuestions: 10, weight: 0.9 },
      { id: "cografya", label: "Coğrafya", maxQuestions: 6, weight: 0.9 },
      { id: "felsefe-din", label: "Felsefe / Din", maxQuestions: 12, weight: 0.85 }
    ]
  },
  ydt: {
    key: "ydt",
    eyebrow: "YDT Puan Hesaplama",
    title: "YDT Puan Hesapla",
    shortTitle: "YDT",
    description:
      "Yabancı dil testindeki doğru, yanlış ve boş sayılarını girerek YDT için tahmini puanını hesapla.",
    formulaNote:
      "YDT tahmini, 80 soruluk dil testindeki net oranına göre hesaplanır.",
    minScore: 100,
    maxScore: 500,
    subjects: [{ id: "yabanci-dil", label: "Yabancı Dil", maxQuestions: 80, weight: 1 }]
  }
} as const;

export const scoreCalculatorLinks: readonly ResourceLink[] = [
  {
    title: "TYT Puan Hesapla",
    type: "YKS",
    summary: scoreCalculatorConfigs.tyt.description,
    href: `${scoreCalculatorBasePath}/tyt`,
    buttonLabel: "TYT Hesapla"
  },
  {
    title: "AYT Puan Hesapla",
    type: "YKS",
    summary: scoreCalculatorConfigs.ayt.description,
    href: `${scoreCalculatorBasePath}/ayt`,
    buttonLabel: "AYT Hesapla"
  },
  {
    title: "YDT Puan Hesapla",
    type: "YKS",
    summary: scoreCalculatorConfigs.ydt.description,
    href: `${scoreCalculatorBasePath}/ydt`,
    buttonLabel: "YDT Hesapla"
  },
  {
    title: "LGS Puan Hesapla",
    type: "LGS",
    summary: scoreCalculatorConfigs.lgs.description,
    href: `${scoreCalculatorBasePath}/lgs`,
    buttonLabel: "LGS Hesapla"
  }
] as const;

function toSafeNumber(value: number | undefined) {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

export function calculateSubjectNet(input: ScoreSubjectInput) {
  return toSafeNumber(input.correct) - toSafeNumber(input.wrong) / 4;
}

export function calculateScore(
  config: ScoreCalculatorConfig,
  inputs: Record<string, ScoreSubjectInput>
): ScoreCalculatorResult {
  const subjects = config.subjects.map((subject) => {
    const input = inputs[subject.id] ?? { correct: 0, wrong: 0, blank: subject.maxQuestions };
    const net = calculateSubjectNet(input);

    return {
      id: subject.id,
      label: subject.label,
      maxQuestions: subject.maxQuestions,
      correct: toSafeNumber(input.correct),
      wrong: toSafeNumber(input.wrong),
      blank: toSafeNumber(input.blank),
      net: Number(net.toFixed(2))
    };
  });

  const totalNet = subjects.reduce((total, subject) => total + subject.net, 0);
  const weightedNet = subjects.reduce((total, subject) => {
    const configSubject = config.subjects.find((item) => item.id === subject.id);
    return total + Math.max(0, subject.net) * (configSubject?.weight ?? 1);
  }, 0);
  const maxWeightedNet = config.subjects.reduce(
    (total, subject) => total + subject.maxQuestions * subject.weight,
    0
  );
  const completionRatio = maxWeightedNet > 0 ? Math.max(0, Math.min(1, weightedNet / maxWeightedNet)) : 0;
  const estimatedScore = config.minScore + (config.maxScore - config.minScore) * completionRatio;

  return {
    totalNet: Number(totalNet.toFixed(2)),
    weightedNet: Number(weightedNet.toFixed(2)),
    maxWeightedNet: Number(maxWeightedNet.toFixed(2)),
    estimatedScore: Number(estimatedScore.toFixed(2)),
    completionRatio,
    recommendation: getScoreRecommendation(completionRatio),
    subjects
  };
}

export function getScoreRecommendation(completionRatio: number) {
  if (completionRatio >= 0.78) {
    return "Güçlü bir tablo var. Deneme analizi ve hız kontrolüyle son hataları azaltmaya odaklan.";
  }

  if (completionRatio >= 0.55) {
    return "Hedefe yaklaşan bir net dengesi görünüyor. Yanlış yoğunlaşan derslerde kazanım tekrarı yap.";
  }

  if (completionRatio >= 0.35) {
    return "Temel kazanımlar güçlendirilmeli. Haftalık planı konu tekrarı ve düzenli soru çözümüyle destekle.";
  }

  return "Öncelik temel eksikleri kapatmak olmalı. Kısa hedefler, düzenli tekrar ve kontrollü deneme takibiyle başla.";
}

export function getScoreCalculatorConfig(key: string) {
  return scoreCalculatorConfigs[key as ScoreExamKey] ?? null;
}
