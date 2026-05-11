export const gradeOptions = [
  { value: "", label: "Seçiniz" },
  { value: "GRADE_5", label: "5. Sınıf" },
  { value: "GRADE_6", label: "6. Sınıf" },
  { value: "GRADE_7", label: "7. Sınıf" },
  { value: "GRADE_8", label: "8. Sınıf" },
  { value: "GRADE_9", label: "9. Sınıf" },
  { value: "GRADE_10", label: "10. Sınıf" },
  { value: "GRADE_11", label: "11. Sınıf" },
  { value: "GRADE_12", label: "12. Sınıf" },
  { value: "GRADUATE", label: "Mezun" },
  { value: "UNIVERSITY", label: "Üniversite" },
  { value: "OTHER", label: "Diğer" }
] as const;

export const studyTrackOptions = [
  { value: "", label: "Seçiniz" },
  { value: "SAYISAL", label: "Sayısal" },
  { value: "SOZEL", label: "Sözel" },
  { value: "ESIT_AGIRLIK", label: "Eşit Ağırlık" },
  { value: "DIL", label: "Dil" },
  { value: "TYT", label: "TYT" },
  { value: "LGS", label: "LGS" },
  { value: "MSU", label: "MSÜ" },
  { value: "ARA_SINIF", label: "Ara Sınıf" },
  { value: "KPSS", label: "KPSS" },
  { value: "OTHER", label: "Diğer" }
] as const;
