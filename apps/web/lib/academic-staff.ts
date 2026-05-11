export type AcademicStaffMember = {
  id: string;
  name: string;
  title: string;
  city?: string;
  photoSrc?: string;
};

export type AcademicStaffGroup = {
  id: string;
  label: string;
  eyebrow: string;
  description: string;
  members: readonly AcademicStaffMember[];
};

export const academicStaffGroups: readonly AcademicStaffGroup[] = [
  {
    id: "coaches",
    label: "Koçlarımız",
    eyebrow: "Birebir Takip",
    description:
      "Yüz yüze ve çevrim içi süreçlerde öğrencinin haftalık ritmini, görüşme takibini ve karar yönünü taşıyan ekip.",
    members: [
      { id: "coach-busra-kaya", name: "Büşra Kaya", title: "Akademik Planlama Koçu", city: "Ankara" },
      { id: "coach-oguzhan-erdem", name: "Oğuzhan Erdem", title: "YKS Süreç Koçu", city: "Ankara" },
      { id: "coach-zeynep-arslan", name: "Zeynep Arslan", title: "LGS ve Alt Sınıf Koçu", city: "Ankara" },
      { id: "coach-emre-tuncel", name: "Emre Tuncel", title: "Deneme Analiz Koçu", city: "Ankara" },
      { id: "coach-elif-cetin", name: "Elif Çetin", title: "Motivasyon ve Takip Koçu", city: "Ankara" },
      { id: "coach-mert-yildiz", name: "Mert Yıldız", title: "Hedef ve Tempo Koçu", city: "Ankara" }
    ]
  },
  {
    id: "teachers",
    label: "Öğretmenlerimiz",
    eyebrow: "Ders Omurgası",
    description:
      "Ders anlatımı, konu derinliği ve öğrencinin kaynakla ilişkisini güçlendiren öğretmen kadrosu.",
    members: [
      { id: "teacher-selin-ucar", name: "Selin Uçar", title: "TYT Türkçe Öğretmeni", city: "Ankara" },
      { id: "teacher-hakan-demir", name: "Hakan Demir", title: "AYT Matematik Öğretmeni", city: "Ankara" },
      { id: "teacher-doga-sahin", name: "Doğa Şahin", title: "Biyoloji Öğretmeni", city: "Ankara" },
      { id: "teacher-burak-koc", name: "Burak Koç", title: "Fizik Öğretmeni", city: "Ankara" },
      { id: "teacher-mine-acar", name: "Mine Acar", title: "Kimya Öğretmeni", city: "Ankara" },
      { id: "teacher-yigit-gunes", name: "Yiğit Güneş", title: "Geometri Öğretmeni", city: "Ankara" }
    ]
  }
] as const;
