"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearUserTokens, fetchCurrentUser, logoutUser } from "../../lib/auth-client";

type CurrentUserResponse = Awaited<ReturnType<typeof fetchCurrentUser>>;

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState<CurrentUserResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const response = await fetchCurrentUser();

        if (!active) {
          return;
        }

        setData(response);
        setError("");
      } catch (requestError) {
        if (!active) {
          return;
        }

        clearUserTokens();
        setData(null);
        setError(
          requestError instanceof Error ? requestError.message : "Hesap bilgileri alınamadı."
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
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.push("/giris");
  }

  return (
    <main className="ega-auth-shell">
      <section className="ega-auth-card">
        <div className="ega-pill">Öğrenci Paneli</div>
        <h1 style={{ fontFamily: "var(--font-display)" }}>Hesap görünümü</h1>
        <p>Bu ekran şu an auth bağlantısını doğrulamak ve temel kullanıcı verisini göstermek için bağlıdır.</p>

        {loading ? <div className="ega-message ega-message--success">Hesap bilgileri yükleniyor...</div> : null}
        {error ? <div className="ega-message ega-message--error">{error}</div> : null}

        {data?.user ? (
          <div className="ega-auth-summary">
            <div className="ega-summary-row">
              <strong>Kullanıcı</strong>
              <span>
                {data.user.profile?.firstName} {data.user.profile?.lastName}
              </span>
            </div>

            <div className="ega-summary-row">
              <strong>E-posta</strong>
              <span>{data.user.email}</span>
            </div>

            <div className="ega-summary-row">
              <strong>Telefon</strong>
              <span>{data.user.phone || "Belirtilmemiş"}</span>
            </div>

            <div className="ega-summary-row">
              <strong>Öğrenci Profili</strong>
              <span>
                {data.user.studentProfile?.gradeLevel || "Sınıf bilgisi yok"} /{" "}
                {data.user.studentProfile?.studyTrack || "Alan bilgisi yok"}
              </span>
            </div>

            <div className="ega-actions">
              <button className="ega-button" type="button" onClick={handleLogout}>
                Çıkış Yap
              </button>
              <Link className="ega-button--ghost" href="/">
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
