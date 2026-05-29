"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearStaffTokens,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  fetchStaffOverview,
  logoutStaff
} from "../../lib/auth-client";
import {
  createExternalMedia,
  fetchAdminMedia,
  uploadAdminMedia,
  type AdminMediaAsset,
  type AdminMediaKind
} from "../../lib/media-client";

const mediaKindOptions: AdminMediaKind[] = ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO", "BRANDING", "OTHER"];

type StaffMeResponse = Awaited<ReturnType<typeof fetchCurrentStaffUser>>;
type StaffOverviewResponse = Awaited<ReturnType<typeof fetchStaffOverview>>;

export default function AdminMediaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<StaffMeResponse | null>(null);
  const [overview, setOverview] = useState<StaffOverviewResponse | null>(null);
  const [assets, setAssets] = useState<AdminMediaAsset[]>([]);
  const [kindFilter, setKindFilter] = useState<AdminMediaKind | "ALL">("ALL");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadKind, setUploadKind] = useState<AdminMediaKind>("IMAGE");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAltText, setUploadAltText] = useState("");
  const [externalKind, setExternalKind] = useState<AdminMediaKind>("VIDEO");
  const [externalTitle, setExternalTitle] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [externalThumbnailUrl, setExternalThumbnailUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

        const [staffResponse, overviewResponse, mediaResponse] = await Promise.all([
          fetchCurrentStaffUser(),
          fetchStaffOverview(),
          fetchAdminMedia()
        ]);

        if (!active) {
          return;
        }

        setStaff(staffResponse);
        setOverview(overviewResponse);
        setAssets(mediaResponse);
      } catch (requestError) {
        if (!active) {
          return;
        }

        clearStaffTokens();
        router.replace("/giris");
        setError(requestError instanceof Error ? requestError.message : "Medya kayıtları yüklenemedi.");
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

  const filteredAssets = useMemo(
    () => (kindFilter === "ALL" ? assets : assets.filter((asset) => asset.kind === kindFilter)),
    [assets, kindFilter]
  );

  async function reloadMedia() {
    setAssets(await fetchAdminMedia());
  }

  async function handleLogout() {
    await logoutStaff();
    router.push("/giris");
  }

  async function handleUpload() {
    if (!uploadFile) {
      setError("Önce bir dosya seçin.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const asset = await uploadAdminMedia({
        file: uploadFile,
        kind: uploadKind,
        title: uploadTitle || uploadFile.name,
        altText: uploadAltText
      });

      setUploadFile(null);
      setUploadTitle("");
      setUploadAltText("");
      setAssets((current) => [asset, ...current.filter((entry) => entry.id !== asset.id)]);
      setSuccess("Dosya medya kütüphanesine yüklendi.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Dosya yüklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateExternal() {
    if (!externalUrl.trim() || !externalTitle.trim()) {
      setError("Harici medya için başlık ve URL zorunlu.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const asset = await createExternalMedia({
        kind: externalKind,
        title: externalTitle,
        externalUrl,
        thumbnailUrl: externalThumbnailUrl || undefined
      });

      setExternalTitle("");
      setExternalUrl("");
      setExternalThumbnailUrl("");
      setAssets((current) => [asset, ...current.filter((entry) => entry.id !== asset.id)]);
      setSuccess("Harici medya normalize edilip kütüphaneye eklendi.");
    } catch (externalError) {
      setError(externalError instanceof Error ? externalError.message : "Harici medya eklenemedi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="admin-shell">
        <section className="admin-card">
          <span className="admin-badge">Yükleniyor</span>
          <h1>Medya kütüphanesi yükleniyor</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand__mark">MED</div>
          <div>
            <strong style={{ display: "block" }}>Medya Kütüphanesi</strong>
            <span style={{ color: "var(--admin-muted)" }}>
              Upload, Google Drive / YouTube / Vimeo embed ve içerik bağlantıları
            </span>
          </div>
        </div>

        <div className="admin-actions">
          <Link className="admin-button--ghost" href="/">
            Kontrol Merkezi
          </Link>
          <Link className="admin-button--ghost" href="/icerik">
            İçerik Stüdyosu
          </Link>
          <Link className="admin-button--ghost" href="/ticaret">
            Ticaret Merkezi
          </Link>
          <button className="admin-button--ghost" type="button" onClick={() => void reloadMedia()}>
            Yeniden Yükle
          </button>
          <button className="admin-button" type="button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      {error ? <div className="admin-message admin-message--error">{error}</div> : null}
      {success ? <div className="admin-message admin-message--success">{success}</div> : null}

      <section className="admin-media-destination-grid" aria-label="Medya kullanım rehberi">
        <article>
          <span>Ana Sayfa Banner</span>
          <strong>İçerik Yönetimi → Sayfa Bölümleri → Ana Sayfa</strong>
          <p>Banner görseli veya videosu için kütüphanedeki medya URL’sini kullanın.</p>
        </article>
        <article>
          <span>Paket Kart Videosu</span>
          <strong>Ürün ve Sipariş → Ürün Yönetimi</strong>
          <p>Google Drive veya cloud streamer bağlantısını paket videosu olarak hazırlayın.</p>
        </article>
        <article>
          <span>Akademik Kadro Videosu</span>
          <strong>İçerik Yönetimi → Akademik Kadro</strong>
          <p>Koç ve öğretmen tanıtım videolarını kadro alanlarına bağlayın.</p>
        </article>
        <article>
          <span>PDF / Ücretsiz Materyal</span>
          <strong>İçerik Yönetimi → Ücretsiz Materyaller</strong>
          <p>PDF dosyasını yükle, kullanılacak URL'yi materyal kartının bağlantı alanına ekle.</p>
        </article>
      </section>

      <div className="admin-panel-grid admin-panel-grid--wide">
        <aside className="admin-card admin-sidebar">
          <span className="admin-badge">Personel</span>
          <div className="admin-summary">
            <div className="admin-list__item">
              <strong>
                {staff?.staffUser.firstName} {staff?.staffUser.lastName}
              </strong>
              <div>{staff?.staffUser.email}</div>
            </div>
            <div className="admin-list__item">
              <strong>Yetkiler</strong>
              <div>{overview?.permissionKeys.length ?? 0} adet</div>
            </div>
          </div>

          <div className="admin-message admin-message--success">
            Büyük videolar için Google Drive, YouTube, Vimeo veya cloud streamer bağlantısı kullanın.
          </div>
        </aside>

        <section className="admin-card admin-editor-panel">
          <div className="admin-form-stack">
            <div className="admin-form-grid">
              <section className="admin-subpanel">
                <div className="admin-editor-meta">
                  <span className="admin-badge">Dosya Yükle</span>
                  <span className="admin-editor-meta__text">Görsel, PDF, kısa video veya marka dosyası</span>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Tür</label>
                    <select
                      className="admin-input admin-select"
                      value={uploadKind}
                      onChange={(event) => setUploadKind(event.target.value as AdminMediaKind)}
                    >
                      {mediaKindOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label>Dosya</label>
                    <label className="admin-local-upload-field admin-local-upload-field--library">
                      <input
                        className="admin-local-upload-field__input"
                        type="file"
                        onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                      />
                      <span className="admin-local-upload-field__button">Bilgisayardan dosya seç</span>
                      <small>{uploadFile ? uploadFile.name : "Yerel bilgisayardan görsel, PDF, video veya ses dosyası seç."}</small>
                    </label>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Başlık</label>
                    <input
                      className="admin-input"
                      value={uploadTitle}
                      onChange={(event) => setUploadTitle(event.target.value)}
                      placeholder="Örn. Ana sayfa koçluk görseli"
                    />
                  </div>
                  <div className="admin-field">
                    <label>Alt Metin</label>
                    <input
                      className="admin-input"
                      value={uploadAltText}
                      onChange={(event) => setUploadAltText(event.target.value)}
                      placeholder="Erişilebilirlik ve SEO açıklaması"
                    />
                  </div>
                </div>

                <button className="admin-button" type="button" disabled={saving} onClick={() => void handleUpload()}>
                  {saving ? "Kaydediliyor..." : "Dosyayı Yükle"}
                </button>
              </section>

              <section className="admin-subpanel">
                <div className="admin-editor-meta">
                  <span className="admin-badge">Cloud Video / Harici URL</span>
                  <span className="admin-editor-meta__text">Google Drive, YouTube, Vimeo veya direct video URL</span>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-field">
                    <label>Tür</label>
                    <select
                      className="admin-input admin-select"
                      value={externalKind}
                      onChange={(event) => setExternalKind(event.target.value as AdminMediaKind)}
                    >
                      {mediaKindOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-field">
                    <label>Başlık</label>
                    <input
                      className="admin-input"
                      value={externalTitle}
                      onChange={(event) => setExternalTitle(event.target.value)}
                      placeholder="Örn. Paket tanıtım videosu"
                    />
                  </div>
                </div>

                <div className="admin-field">
                  <label>Cloud / Embed / Direct URL</label>
                  <input
                    className="admin-input"
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    placeholder="Google Drive paylaşım linki, YouTube, Vimeo veya .mp4 URL"
                  />
                </div>

                <div className="admin-field">
                  <label>Poster / Thumbnail URL</label>
                  <input
                    className="admin-input"
                    value={externalThumbnailUrl}
                    onChange={(event) => setExternalThumbnailUrl(event.target.value)}
                    placeholder="Opsiyonel kapak görseli"
                  />
                </div>

                <button
                  className="admin-button"
                  type="button"
                  disabled={saving}
                  onClick={() => void handleCreateExternal()}
                >
                  {saving ? "Kaydediliyor..." : "URL'yi Normalize Et"}
                </button>
              </section>
            </div>

            <div className="admin-toolbar admin-toolbar--split">
              <div className="admin-editor-meta">
                <span className="admin-badge">Kütüphane</span>
                <span className="admin-editor-meta__text">
                  Seçili medya URL’sini içerik ve ürünlerde kullanın
                </span>
              </div>
              <select
                className="admin-input admin-select admin-select--compact"
                value={kindFilter}
                onChange={(event) => setKindFilter(event.target.value as AdminMediaKind | "ALL")}
              >
                <option value="ALL">Tüm medya</option>
                {mediaKindOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-media-grid">
              {filteredAssets.map((asset) => (
                <MediaAssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MediaAssetCard({ asset }: { asset: AdminMediaAsset }) {
  const usableUrl = asset.url ?? "";
  const posterUrl = asset.thumbnailUrl ?? asset.publicUrl ?? "";

  async function copy(value: string) {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
  }

  return (
    <article className="admin-media-card">
      <div className="admin-media-card__preview">
        {asset.kind === "IMAGE" && usableUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={usableUrl} alt={asset.altText ?? asset.title} />
        ) : asset.kind === "VIDEO" && asset.embedUrl ? (
          <iframe src={asset.embedUrl} title={asset.title} loading="lazy" allowFullScreen />
        ) : asset.kind === "VIDEO" && asset.publicUrl ? (
          <video src={asset.publicUrl} poster={posterUrl || undefined} controls preload="metadata" />
        ) : (
          <span>{asset.kind}</span>
        )}
      </div>

      <div className="admin-media-card__body">
        <strong>{asset.title}</strong>
        <span>
          {asset.sourceType} {asset.externalProvider ? `· ${asset.externalProvider}` : ""}
        </span>
        <code>{usableUrl || "URL yok"}</code>
      </div>

      <div className="admin-actions">
        <button className="admin-button--ghost" type="button" onClick={() => void copy(usableUrl)}>
          Kullanılacak URL
        </button>
        {asset.embedUrl ? (
          <button className="admin-button--ghost" type="button" onClick={() => void copy(asset.embedUrl ?? "")}>
            Embed URL
          </button>
        ) : null}
        {asset.playbackSourceType ? (
          <button
            className="admin-button--ghost"
            type="button"
            onClick={() => void copy(asset.playbackSourceType ?? "")}
          >
            {asset.playbackSourceType}
          </button>
        ) : null}
      </div>
    </article>
  );
}
