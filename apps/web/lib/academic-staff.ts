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
  introVideoSourceType?: "DIRECT" | "EMBED";
  introVideoUrl?: string;
  introVideoPosterUrl?: string;
  introVideoTitle?: string;
  members: readonly AcademicStaffMember[];
};

export const academicStaffGroups: readonly AcademicStaffGroup[] = [
  {
    id: "coaches",
    label: "Koçlarımız",
    eyebrow: "Birebir Takip",
    description: "",
    members: [
      {
        id: "coach-busra-kaya",
        name: "Büşra Kaya",
        title: "Akademik Planlama Koçu",
        city: "Ankara",
        photoSrc: "/staff/coach-busra-kaya.png"
      },
      {
        id: "coach-oguzhan-erdem",
        name: "Oğuzhan Erdem",
        title: "YKS Süreç Koçu",
        city: "Ankara",
        photoSrc: "/staff/coach-oguzhan-erdem.png"
      },
      {
        id: "coach-zeynep-arslan",
        name: "Zeynep Arslan",
        title: "LGS ve Alt Sınıf Koçu",
        city: "Ankara",
        photoSrc: "/staff/coach-zeynep-arslan.png"
      },
      {
        id: "coach-emre-tuncel",
        name: "Emre Tuncel",
        title: "Deneme Analiz Koçu",
        city: "Ankara",
        photoSrc: "/staff/coach-emre-tuncel.png"
      },
      {
        id: "coach-elif-cetin",
        name: "Elif Çetin",
        title: "Motivasyon ve Takip Koçu",
        city: "Ankara",
        photoSrc: "/staff/coach-elif-cetin.png"
      },
      {
        id: "coach-mert-yildiz",
        name: "Mert Yıldız",
        title: "Hedef ve Tempo Koçu",
        city: "Ankara",
        photoSrc: "/staff/coach-mert-yildiz.png"
      }
    ]
  },
  {
    id: "teachers",
    label: "Öğretmenlerimiz",
    eyebrow: "Ders Omurgası",
    description: "",
    members: [
      {
        id: "teacher-selin-ucar",
        name: "Selin Uçar",
        title: "TYT Türkçe Öğretmeni",
        city: "Ankara",
        photoSrc: "/staff/teacher-selin-ucar.png"
      },
      {
        id: "teacher-hakan-demir",
        name: "Hakan Demir",
        title: "AYT Matematik Öğretmeni",
        city: "Ankara",
        photoSrc: "/staff/teacher-hakan-demir.png"
      },
      {
        id: "teacher-doga-sahin",
        name: "Doğa Şahin",
        title: "Biyoloji Öğretmeni",
        city: "Ankara",
        photoSrc: "/staff/teacher-doga-sahin.png"
      },
      {
        id: "teacher-burak-koc",
        name: "Burak Koç",
        title: "Fizik Öğretmeni",
        city: "Ankara",
        photoSrc: "/staff/teacher-burak-koc.png"
      },
      {
        id: "teacher-mine-acar",
        name: "Mine Acar",
        title: "Kimya Öğretmeni",
        city: "Ankara",
        photoSrc: "/staff/teacher-mine-acar.png"
      },
      {
        id: "teacher-yigit-gunes",
        name: "Yiğit Güneş",
        title: "Geometri Öğretmeni",
        city: "Ankara",
        photoSrc: "/staff/teacher-yigit-gunes.png"
      }
    ]
  }
] as const;
