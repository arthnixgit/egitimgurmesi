export const ROLE_KEYS = {
  superAdmin: "super-admin",
  admin: "admin",
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
      lmsManage,
      integrationsRead,
      whatsappRead,
      whatsappExport,
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
