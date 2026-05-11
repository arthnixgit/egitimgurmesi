"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearStaffTokens,
  fetchAdminFreeMaterialsDocument,
  fetchAdminMarketingPages,
  fetchAdminNavigationMenu,
  fetchAdminStaffProfilesDocument,
  fetchAdminSuccessStoriesDocument,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  logoutStaff,
  saveAdminFreeMaterialsDocument,
  saveAdminMarketingPage,
  saveAdminNavigationMenu,
  saveAdminStaffProfilesDocument,
  saveAdminSuccessStoriesDocument,
  type AdminFreeMaterialsDocument,
  type AdminMarketingPage,
  type AdminNavigationMenu,
  type AdminStaffProfilesDocument,
  type AdminSuccessStoriesDocument
} from "../../lib/auth-client";

type AdminTabKey =
  | "navigation"
  | "marketing-pages"
  | "academic-staff"
  | "success-stories"
  | "free-materials";

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

const tabMeta: Record<
  AdminTabKey,
  {
    label: string;
    description: string;
  }
> = {
  navigation: {
    label: "Navigasyon",
    description: "Navbar ve menü ağacı"
  },
  "marketing-pages": {
    label: "Pazarlama Sayfaları",
    description: "Home, about ve diğer marketing page kayıtları"
  },
  "academic-staff": {
    label: "Akademik Kadro",
    description: "Koç ve öğretmen grupları"
  },
  "success-stories": {
    label: "Başarı Hikayeleri",
    description: "Öğrenci başarı kayıtları"
  },
  "free-materials": {
    label: "Ücretsiz Materyaller",
    description: "Araçlar, linkler ve countdown sayfaları"
  }
};

export default function AdminContentStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTabKey>("navigation");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [navigationMenu, setNavigationMenu] = useState<AdminNavigationMenu | null>(null);
  const [navigationEditor, setNavigationEditor] = useState("");

  const [marketingPages, setMarketingPages] = useState<AdminMarketingPage[]>([]);
  const [selectedMarketingKey, setSelectedMarketingKey] = useState("");
  const [marketingEditor, setMarketingEditor] = useState("");

  const [staffDocument, setStaffDocument] = useState<AdminStaffProfilesDocument | null>(null);
  const [staffEditor, setStaffEditor] = useState("");

  const [successDocument, setSuccessDocument] = useState<AdminSuccessStoriesDocument | null>(null);
  const [successEditor, setSuccessEditor] = useState("");

  const [freeMaterialsDocument, setFreeMaterialsDocument] = useState<AdminFreeMaterialsDocument | null>(null);
  const [freeMaterialsEditor, setFreeMaterialsEditor] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const bootstrap = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        if (bootstrap.requiresBootstrap) {
          router.replace("/kurulum");
          return;
        }

        const [staffResponse, overviewResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview()
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);

        const [menu, pages, staffDoc, successDoc, freeDoc] = await Promise.all([
          fetchAdminNavigationMenu("primary"),
          fetchAdminMarketingPages(),
          fetchAdminStaffProfilesDocument(),
          fetchAdminSuccessStoriesDocument(),
          fetchAdminFreeMaterialsDocument()
        ]);

        if (!active) {
          return;
        }

        setNavigationMenu(menu);
        setNavigationEditor(prettyPrint(menu));

        setMarketingPages(pages);
        const initialMarketingPage = pages[0] ?? null;
        setSelectedMarketingKey(initialMarketingPage?.key ?? "");
        setMarketingEditor(initialMarketingPage ? prettyPrint(initialMarketingPage) : "");

        setStaffDocument(staffDoc);
        setStaffEditor(prettyPrint(staffDoc));

        setSuccessDocument(successDoc);
        setSuccessEditor(prettyPrint(successDoc));

        setFreeMaterialsDocument(freeDoc);
        setFreeMaterialsEditor(prettyPrint(freeDoc));
      } catch (requestError) {
        if (!active) {
          return;
        }

        clearStaffTokens();
        router.replace("/giris");
        setError(
          requestError instanceof Error
            ? requestError.message
            : "İçerik stüdyosu verileri yüklenemedi."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!selectedMarketingKey) {
      return;
    }

    const selectedPage = marketingPages.find((page) => page.key === selectedMarketingKey);

    if (selectedPage) {
      setMarketingEditor(prettyPrint(selectedPage));
    }
  }, [marketingPages, selectedMarketingKey]);

  const contentStats = useMemo(
    () => ({
      navigationItems: countNavigationItems(navigationMenu?.items ?? []),
      marketingPages: marketingPages.length,
      staffProfiles: staffDocument?.groups.reduce((total, group) => total + group.profiles.length, 0) ?? 0,
      successStories: successDocument?.stories.length ?? 0,
      freeMaterialItems:
        freeMaterialsDocument?.categories.reduce((total, category) => total + category.items.length, 0) ?? 0
    }),
    [freeMaterialsDocument, marketingPages.length, navigationMenu?.items, staffDocument, successDocument]
  );

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  async function handleReload() {
    router.refresh();
    window.location.reload();
  }

  function handleFormatCurrent() {
    setError("");

    try {
      if (activeTab === "navigation") {
        setNavigationEditor(prettyPrint(parseJson<AdminNavigationMenu>(navigationEditor)));
        return;
      }

      if (activeTab === "marketing-pages") {
        setMarketingEditor(prettyPrint(parseJson<AdminMarketingPage>(marketingEditor)));
        return;
      }

      if (activeTab === "academic-staff") {
        setStaffEditor(prettyPrint(parseJson<AdminStaffProfilesDocument>(staffEditor)));
        return;
      }

      if (activeTab === "success-stories") {
        setSuccessEditor(prettyPrint(parseJson<AdminSuccessStoriesDocument>(successEditor)));
        return;
      }

      setFreeMaterialsEditor(prettyPrint(parseJson<AdminFreeMaterialsDocument>(freeMaterialsEditor)));
    } catch (formatError) {
      setError(formatError instanceof Error ? formatError.message : "JSON biçimlendirilemedi.");
    }
  }

  async function handleSaveCurrent() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (activeTab === "navigation") {
        const parsed = parseJson<AdminNavigationMenu>(navigationEditor);
        const saved = await saveAdminNavigationMenu(parsed.key, {
          name: parsed.name,
          location: parsed.location,
          description: parsed.description ?? undefined,
          isActive: parsed.isActive,
          items: parsed.items
        });

        setNavigationMenu(saved);
        setNavigationEditor(prettyPrint(saved));
        setSuccess("Navigasyon kaydedildi.");
        return;
      }

      if (activeTab === "marketing-pages") {
        const parsed = parseJson<AdminMarketingPage>(marketingEditor);
        const saved = await saveAdminMarketingPage(parsed.key, {
          slug: parsed.slug,
          title: parsed.title,
          excerpt: parsed.excerpt ?? undefined,
          description: parsed.description ?? undefined,
          pageType: parsed.pageType,
          publishStatus: parsed.publishStatus,
          seoTitle: parsed.seoTitle ?? undefined,
          seoDescription: parsed.seoDescription ?? undefined,
          heroImageUrl: parsed.heroImageUrl ?? undefined,
          metadata: parsed.metadata ?? undefined,
          sections: parsed.sections
        });

        const nextPages = marketingPages.map((page) => (page.key === saved.key ? saved : page));
        setMarketingPages(nextPages);
        setMarketingEditor(prettyPrint(saved));
        setSuccess(`${saved.title} sayfası kaydedildi.`);
        return;
      }

      if (activeTab === "academic-staff") {
        const parsed = parseJson<AdminStaffProfilesDocument>(staffEditor);
        const saved = await saveAdminStaffProfilesDocument(parsed);
        setStaffDocument(saved);
        setStaffEditor(prettyPrint(saved));
        setSuccess("Akademik kadro içeriği kaydedildi.");
        return;
      }

      if (activeTab === "success-stories") {
        const parsed = parseJson<AdminSuccessStoriesDocument>(successEditor);
        const saved = await saveAdminSuccessStoriesDocument(parsed);
        setSuccessDocument(saved);
        setSuccessEditor(prettyPrint(saved));
        setSuccess("Başarı hikayeleri kaydedildi.");
        return;
      }

      const parsed = parseJson<AdminFreeMaterialsDocument>(freeMaterialsEditor);
      const saved = await saveAdminFreeMaterialsDocument(parsed);
      setFreeMaterialsDocument(saved);
      setFreeMaterialsEditor(prettyPrint(saved));
      setSuccess("Ücretsiz materyaller ve countdown sayfaları kaydedildi.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kaydetme sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <span className="admin-badge">Yükleniyor</span>
          <h1>İçerik stüdyosu hazırlanıyor</h1>
          <div className="admin-message admin-message--success">
            CMS verileri ve yetkiler kontrol ediliyor.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">CMS</div>
          <div>
            <strong style={{ display: "block" }}>İçerik Stüdyosu</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Public site ile aynı tabloları yöneten ilk admin içerik ekranları
            </span>
          </div>
        </div>

        <div className="admin-actions">
          <Link className="admin-button--ghost" href="/">
            Kontrol Merkezi
          </Link>
          <button className="admin-button--ghost" type="button" onClick={handleReload}>
            Yeniden Yükle
          </button>
          <button className="admin-button" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      <div className="admin-panel-grid">
        <aside className="admin-card admin-sidebar">
          <span className="admin-badge">Yetki</span>
          <h2 style={{ marginTop: 18 }}>CMS yönetimi açık</h2>
          <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
            Bu ekranlar doğrudan `cms.manage` yetkisine bağlıdır ve public web’in kullandığı
            aynı içerik kayıtlarını günceller.
          </p>

          <div className="admin-summary">
            <div className="admin-list__item">
              <strong>
                {staff?.staffUser.firstName} {staff?.staffUser.lastName}
              </strong>
              <div>{staff?.staffUser.email}</div>
            </div>
            <div className="admin-list__item">
              <strong>Rol</strong>
              <div>{staff?.staffUser.roleKeys.join(", ") || "Tanımsız"}</div>
            </div>
            <div className="admin-list__item">
              <strong>Yetkiler</strong>
              <div>{overview?.permissionKeys.length ?? 0} adet</div>
            </div>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi">
              <strong>{contentStats.navigationItems}</strong>
              <span>Menü öğesi</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.marketingPages}</strong>
              <span>Marketing page</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.staffProfiles}</strong>
              <span>Kadro profili</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.successStories}</strong>
              <span>Başarı kaydı</span>
            </div>
            <div className="admin-kpi">
              <strong>{contentStats.freeMaterialItems}</strong>
              <span>Ücretsiz içerik</span>
            </div>
          </div>

          <div className="admin-tab-list">
            {(Object.keys(tabMeta) as AdminTabKey[]).map((tabKey) => (
              <button
                key={tabKey}
                className={`admin-tab ${activeTab === tabKey ? "admin-tab--active" : ""}`}
                type="button"
                onClick={() => {
                  setActiveTab(tabKey);
                  setError("");
                  setSuccess("");
                }}
              >
                <strong>{tabMeta[tabKey].label}</strong>
                <span>{tabMeta[tabKey].description}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="admin-card admin-editor-panel">
          <div className="admin-editor-header">
            <div>
              <span className="admin-badge">{tabMeta[activeTab].label}</span>
              <h1>{tabMeta[activeTab].description}</h1>
              <p style={{ color: "var(--admin-muted)", lineHeight: 1.7 }}>
                İlk sürümde her içerik alanı belge mantığında düzenleniyor. Yapı artık API ve
                veritabanına bağlı; yarın istenirse alan bazlı form düzenine rafine edilebilir.
              </p>
            </div>

            {activeTab === "marketing-pages" ? (
              <label className="admin-field admin-field--compact">
                <span>Sayfa seç</span>
                <select
                  className="admin-input admin-select"
                  value={selectedMarketingKey}
                  onChange={(event) => setSelectedMarketingKey(event.target.value)}
                >
                  {marketingPages.map((page) => (
                    <option key={page.key} value={page.key}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          {error ? <div className="admin-message admin-message--error">{error}</div> : null}
          {success ? <div className="admin-message admin-message--success">{success}</div> : null}

          <div className="admin-toolbar">
            <button className="admin-button--ghost" type="button" onClick={handleFormatCurrent}>
              JSON Düzenle
            </button>
            <button className="admin-button" type="button" disabled={saving} onClick={handleSaveCurrent}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>

          {activeTab === "navigation" ? (
            <JsonDocumentEditor
              value={navigationEditor}
              onChange={setNavigationEditor}
              helper="Bu belge navbar ve mega menu ağacını yönetir. `children` dizileri bir sonraki seviye menüyü temsil eder."
            />
          ) : null}

          {activeTab === "marketing-pages" ? (
            <JsonDocumentEditor
              value={marketingEditor}
              onChange={setMarketingEditor}
              helper="Seçili marketing page ve section kayıtlarını düzenler. `payload` alanı section varyantlarının ek verisini taşır."
            />
          ) : null}

          {activeTab === "academic-staff" ? (
            <JsonDocumentEditor
              value={staffEditor}
              onChange={setStaffEditor}
              helper="`groups` altında koç ve öğretmen blokları, onların altında da profil kayıtları bulunur."
            />
          ) : null}

          {activeTab === "success-stories" ? (
            <JsonDocumentEditor
              value={successEditor}
              onChange={setSuccessEditor}
              helper="Başarı hikayeleri public başarılar sayfasında kullanılacak içerikleri ve sıralamayı taşır."
            />
          ) : null}

          {activeTab === "free-materials" ? (
            <JsonDocumentEditor
              value={freeMaterialsEditor}
              onChange={setFreeMaterialsEditor}
              helper="`categories` ücretsiz materyal kartlarını, `countdownPages` ise geri sayım sayfalarının hedef/link/makale yapısını yönetir."
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function JsonDocumentEditor({
  value,
  onChange,
  helper
}: {
  value: string;
  onChange: (nextValue: string) => void;
  helper: string;
}) {
  return (
    <div className="admin-editor-shell">
      <div className="admin-editor-meta">
        <span className="admin-badge">JSON Editör</span>
        <span className="admin-editor-meta__text">
          Bu ilk sürümde içerik doğrudan yapılandırılmış belge olarak düzenlenir. Aşağıda görünen
          veri, HTML hatası değil kaydedilebilir içerik belgesidir.
        </span>
      </div>
      <p className="admin-editor-helper">{helper}</p>
      <textarea
        className="admin-code-editor"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function prettyPrint(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseJson<T>(rawValue: string) {
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    throw new Error("JSON geçerli değil. Kaydetmeden önce belgeyi düzelt.");
  }
}

function countNavigationItems(items: readonly { children?: readonly unknown[] }[]): number {
  return items.reduce((total, item) => {
    const childCount: number = Array.isArray(item.children)
      ? countNavigationItems(item.children)
      : 0;
    return total + 1 + childCount;
  }, 0);
}
