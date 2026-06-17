import type { GradeLevel, StudyTrack } from "@ega/db";

export const GRADE_LEVEL_VALUES = {
  GRADE_5: "GRADE_5",
  GRADE_6: "GRADE_6",
  GRADE_7: "GRADE_7",
  GRADE_8: "GRADE_8",
  GRADE_9: "GRADE_9",
  GRADE_10: "GRADE_10",
  GRADE_11: "GRADE_11",
  GRADE_12: "GRADE_12",
  GRADUATE: "GRADUATE",
  UNIVERSITY: "UNIVERSITY",
  OTHER: "OTHER"
} as const satisfies Record<GradeLevel, GradeLevel>;

export const STUDY_TRACK_VALUES = {
  SAYISAL: "SAYISAL",
  SOZEL: "SOZEL",
  ESIT_AGIRLIK: "ESIT_AGIRLIK",
  DIL: "DIL",
  TYT: "TYT",
  LGS: "LGS",
  MSU: "MSU",
  ARA_SINIF: "ARA_SINIF",
  KPSS: "KPSS",
  OTHER: "OTHER"
} as const satisfies Record<StudyTrack, StudyTrack>;
