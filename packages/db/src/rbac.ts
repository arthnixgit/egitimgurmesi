export const ROLE_KEYS = {
  superAdmin: "super-admin",
  admin: "admin",
  branchAdmin: "branch-admin",
  instructor: "instructor",
  coach: "coach",
  accountant: "accountant",
  accounting: "accounting",
  technician: "technician"
} as const;

export const PERMISSION_KEYS = {
  dashboardRead: "dashboard.read",
  settingsRead: "settings.read",
  settingsWrite: "settings.write",
  cmsManage: "cms.manage",
  productsManage: "products.manage",
  pricingManage: "pricing.manage",
  couponsManage: "coupons.manage",
  ordersRead: "orders.read",
  ordersManage: "orders.manage",
  paymentsRead: "payments.read",
  paymentsReconcile: "payments.reconcile",
  paymentsRefund: "payments.refund",
  reportsFinancialExport: "reports.financial.export",
  usersRead: "users.read",
  usersManage: "users.manage",
  lmsManage: "lms.manage",
  integrationsRead: "integrations.read",
  integrationsManage: "integrations.manage",
  whatsappRead: "whatsapp.read",
  whatsappExport: "whatsapp.export",
  staffManage: "staff.manage",
  rolesManage: "roles.manage",
  organizationsRead: "organizations.read",
  organizationsManage: "organizations.manage",
  branchesRead: "branches.read",
  branchesManage: "branches.manage",
  classesRead: "classes.read",
  classesManage: "classes.manage",
  assignmentsRead: "assignments.read",
  assignmentsManage: "assignments.manage",
  instructorDashboardRead: "instructor.dashboard.read",
  coachDashboardRead: "coach.dashboard.read",
  accountingDashboardRead: "accounting.dashboard.read",
  simulationsManage: "simulations.manage",
  aiLearningManage: "ai-learning.manage",
  auditRead: "audit.read",
  maintenanceManage: "maintenance.manage"
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];
export type PermissionKey = (typeof PERMISSION_KEYS)[keyof typeof PERMISSION_KEYS];

type RoleDefinition = {
  key: RoleKey;
  name: string;
  description: string;
  permissions: PermissionKey[];
};

const {
  dashboardRead,
  settingsRead,
  settingsWrite,
  cmsManage,
  productsManage,
  pricingManage,
  couponsManage,
  ordersRead,
  ordersManage,
  paymentsRead,
  paymentsReconcile,
  paymentsRefund,
  reportsFinancialExport,
  usersRead,
  usersManage,
  lmsManage,
  integrationsRead,
  integrationsManage,
  whatsappRead,
  whatsappExport,
  staffManage,
  rolesManage,
  organizationsRead,
  organizationsManage,
  branchesRead,
  branchesManage,
  classesRead,
  classesManage,
  assignmentsRead,
  assignmentsManage,
  instructorDashboardRead,
  coachDashboardRead,
  accountingDashboardRead,
  simulationsManage,
  aiLearningManage,
  auditRead,
  maintenanceManage
} = PERMISSION_KEYS;

export const DEFAULT_PERMISSIONS = [
  { key: dashboardRead, name: "Dashboard goruntuleme", description: "Operasyon dashboard ekranlarini goruntuler." },
  { key: settingsRead, name: "Ayar goruntuleme", description: "Sistem ve site ayarlarini goruntuler." },
  { key: settingsWrite, name: "Ayar duzenleme", description: "Sistem ve site ayarlarini duzenler." },
  { key: cmsManage, name: "CMS yonetimi", description: "Sayfa, banner ve kart iceriklerini yonetir." },
  { key: productsManage, name: "Urun yonetimi", description: "Urun, varyant ve kategori yonetimi yapar." },
  { key: pricingManage, name: "Fiyat yonetimi", description: "Fiyat, kampanya ve gorunurluk degisiklikleri yapar." },
  { key: couponsManage, name: "Kupon yonetimi", description: "Kupon olusturur, gunceller veya pasife alir." },
  { key: ordersRead, name: "Siparis goruntuleme", description: "Siparisleri ve detaylarini goruntuler." },
  { key: ordersManage, name: "Siparis yonetimi", description: "Siparis notu ve durum degisiklikleri yapar." },
  { key: paymentsRead, name: "Odeme goruntuleme", description: "Odeme kayitlarini goruntuler." },
  { key: paymentsReconcile, name: "Odeme uzlastirma", description: "Tahsilat ve mutabakat sureclerini yonetir." },
  { key: paymentsRefund, name: "Iade islemleri", description: "Iade ve iptal odeme sureclerini baslatir." },
  { key: reportsFinancialExport, name: "Finans raporu disa aktarma", description: "Finansal raporlari disa aktarir." },
  { key: usersRead, name: "Kullanici goruntuleme", description: "Kullanici hesaplarini goruntuler." },
  { key: usersManage, name: "Kullanici yonetimi", description: "Kullanici profili gunceller ve erisimi askiya alir." },
  { key: lmsManage, name: "LMS yonetimi", description: "Kurs, modul, ders ve video yayini yonetir." },
  { key: integrationsRead, name: "Entegrasyon goruntuleme", description: "Webhook ve entegrasyon sagligini goruntuler." },
  { key: integrationsManage, name: "Entegrasyon yonetimi", description: "Secret, webhook ve teknik entegrasyon ayarlarina mudahale eder." },
  { key: whatsappRead, name: "WhatsApp lead goruntuleme", description: "Lead kayitlarini goruntuler." },
  { key: whatsappExport, name: "WhatsApp lead disa aktarma", description: "Lead verilerini disa aktarir." },
  { key: staffManage, name: "Personel yonetimi", description: "Personel hesaplarini yonetir." },
  { key: rolesManage, name: "Rol yonetimi", description: "Rol ve yetki atamalarini yonetir." },
  { key: organizationsRead, name: "Kurum goruntuleme", description: "Organizasyon ve egitim merkezi kayitlarini goruntuler." },
  { key: organizationsManage, name: "Kurum yonetimi", description: "Organizasyon ve egitim merkezi kayitlarini yonetir." },
  { key: branchesRead, name: "Sube goruntuleme", description: "Sube kayitlarini ve sube kapsamlarini goruntuler." },
  { key: branchesManage, name: "Sube yonetimi", description: "Sube, sube personeli ve sube ayarlarini yonetir." },
  { key: classesRead, name: "Sinif/grup goruntuleme", description: "Sinif ve calisma gruplarini goruntuler." },
  { key: classesManage, name: "Sinif/grup yonetimi", description: "Sinif ve calisma gruplarini yonetir." },
  { key: assignmentsRead, name: "Atama goruntuleme", description: "Ogrenci, ogretmen ve koc atamalarini goruntuler." },
  { key: assignmentsManage, name: "Atama yonetimi", description: "Ogrenci, ogretmen ve koc atamalarini yonetir." },
  { key: instructorDashboardRead, name: "Ogretmen paneli", description: "Ogretmen paneli ve atanmis ders/ogrenci verilerini goruntuler." },
  { key: coachDashboardRead, name: "Koc paneli", description: "Koc paneli ve atanmis ogrenci takip verilerini goruntuler." },
  { key: accountingDashboardRead, name: "Muhasebe paneli", description: "Muhasebe paneli ve finansal ozetleri goruntuler." },
  { key: simulationsManage, name: "Simulasyon yonetimi", description: "Maarif simulasyonlarini ve iliskili meta veriyi yonetir." },
  { key: aiLearningManage, name: "AI ogrenme yonetimi", description: "AI ogrenme sistemi ayarlarini ve onerilerini yonetir." },
  { key: auditRead, name: "Audit log goruntuleme", description: "Audit ve degisiklik kayitlarini goruntuler." },
  { key: maintenanceManage, name: "Bakim yonetimi", description: "Bakim modu ve teknik operasyon aksiyonlarini yonetir." }
] as const;

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    key: ROLE_KEYS.superAdmin,
    name: "Super Admin",
    description: "Tum sistem, finans, icerik ve rol yonetimine sahiptir.",
    permissions: DEFAULT_PERMISSIONS.map((permission) => permission.key)
  },
  {
    key: ROLE_KEYS.admin,
    name: "Admin",
    description: "Gunluk operasyon, katalog, siparis ve icerik sureclerini yonetir.",
    permissions: [
      dashboardRead,
      settingsRead,
      cmsManage,
      productsManage,
      pricingManage,
      couponsManage,
      ordersRead,
      ordersManage,
      paymentsRead,
      usersRead,
      usersManage,
      organizationsRead,
      branchesRead,
      branchesManage,
      classesRead,
      classesManage,
      assignmentsRead,
      assignmentsManage,
      lmsManage,
      integrationsRead,
      whatsappRead,
      whatsappExport,
      auditRead
    ]
  },
  {
    key: ROLE_KEYS.branchAdmin,
    name: "Branch Admin",
    description: "Kendi subesinin ogrenci, ekip, grup ve rapor sureclerini yonetir.",
    permissions: [
      dashboardRead,
      branchesRead,
      classesRead,
      classesManage,
      assignmentsRead,
      assignmentsManage,
      usersRead,
      usersManage,
      staffManage,
      productsManage,
      ordersRead,
      paymentsRead,
      reportsFinancialExport,
      whatsappRead,
      lmsManage
    ]
  },
  {
    key: ROLE_KEYS.instructor,
    name: "Instructor",
    description: "Atanmis sinif, ders, materyal ve ogrenci ilerleme sureclerini yonetir.",
    permissions: [
      dashboardRead,
      instructorDashboardRead,
      classesRead,
      assignmentsRead,
      usersRead,
      lmsManage
    ]
  },
  {
    key: ROLE_KEYS.coach,
    name: "Coach",
    description: "Atanmis ogrencilerin kocluk plani ve takip sureclerini yonetir.",
    permissions: [
      dashboardRead,
      coachDashboardRead,
      assignmentsRead,
      usersRead
    ]
  },
  {
    key: ROLE_KEYS.accountant,
    name: "Accountant",
    description: "Sube veya platform finans, tahsilat, mutabakat ve rapor sureclerini yonetir.",
    permissions: [
      dashboardRead,
      accountingDashboardRead,
      ordersRead,
      paymentsRead,
      paymentsReconcile,
      paymentsRefund,
      reportsFinancialExport,
      usersRead,
      auditRead
    ]
  },
  {
    key: ROLE_KEYS.accounting,
    name: "Accounting",
    description: "Tahsilat, odeme mutabakati ve iade sureclerini yonetir.",
    permissions: [
      dashboardRead,
      ordersRead,
      ordersManage,
      paymentsRead,
      paymentsReconcile,
      paymentsRefund,
      reportsFinancialExport,
      usersRead,
      whatsappRead,
      auditRead
    ]
  },
  {
    key: ROLE_KEYS.technician,
    name: "Technician",
    description: "Teknik entegrasyon, webhook, LMS altyapisi ve bakim sureclerini yonetir.",
    permissions: [
      dashboardRead,
      settingsRead,
      settingsWrite,
      ordersRead,
      paymentsRead,
      usersRead,
      lmsManage,
      integrationsRead,
      integrationsManage,
      whatsappRead,
      auditRead,
      maintenanceManage
    ]
  }
];
