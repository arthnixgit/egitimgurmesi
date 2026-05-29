"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicNavbar } from "../../components/public-navbar";
import { loginUser, registerUser, saveUserTokens } from "../../lib/auth-client";
import { gradeOptions, studyTrackOptions } from "../../lib/student-profile-options";

type AuthPageClientProps = {
  redirectHref: string;
};

type AuthMode = "login" | "register";

const authHighlights = [
  "Video paketlerine tek hesapla eriş.",
  "Siparişlerini ve panel girişini aynı yerden yönet.",
  "Mini Quiz, ücretsiz ön görüşme ve LMS akışına hazır hesap oluştur."
] as const;

export function AuthPageClient({ redirectHref }: AuthPageClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    district: "",
    gradeLevel: "",
    studyTrack: "",
    schoolName: "",
    targetExamYear: "",
    parentName: "",
    parentPhone: "",
    marketingConsent: false,
    kvkkConsent: false,
    termsAccepted: false,
    distanceSalesAccepted: false
  });

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await loginUser({ email: loginEmail, password: loginPassword });
      saveUserTokens(response);
      router.push(redirectHref);
    } catch (submissionError) {
      setLoginError(
        submissionError instanceof Error
          ? submissionError.message
          : "Giriş yapılırken beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");
    setRegisterSuccess("");

    try {
      const response = await registerUser({
        ...form,
        targetExamYear: form.targetExamYear ? Number(form.targetExamYear) : undefined,
        gradeLevel: form.gradeLevel || undefined,
        studyTrack: form.studyTrack || undefined
      });

      setRegisterSuccess(response.message);
    } catch (submissionError) {
      setRegisterError(
        submissionError instanceof Error
          ? submissionError.message
          : "Kayıt sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <main className="ega-page">
      <PublicNavbar />

      <section className="ega-auth-stage">
        <div className="ega-auth-stage__inner">
          <section className="ega-auth-showcase">
            <div className="ega-auth-showcase__badge">Öğrenci Hesabı</div>

            <div className="ega-auth-showcase__copy">
              <h1>Giriş yap, hesabını oluştur ve akışı tek panelde yönet.</h1>
              <p>
                Eğitim Gurmesi hesabın; paket erişimi, sipariş takibi, mini quiz akışı ve
                öğrenci paneli bağlantısını tek yerde toplar.
              </p>
            </div>

            <div className="ega-auth-showcase__highlights">
              {authHighlights.map((item) => (
                <div key={item} className="ega-auth-highlight-card">
                  <span className="ega-auth-highlight-card__dot" />
                  <strong>{item}</strong>
                </div>
              ))}
            </div>

            <div className="ega-auth-showcase__stats">
              <div className="ega-auth-showcase__stat">
                <strong>Tek Hesap</strong>
                <span>Video, koçluk ve sipariş düzeni tek yerde.</span>
              </div>
              <div className="ega-auth-showcase__stat">
                <strong>Güvenli Giriş</strong>
                <span>E-posta doğrulama ve şifre sıfırlama akışı hazır.</span>
              </div>
            </div>
          </section>

          <section className="ega-auth-panel">
            <div className="ega-auth-panel__head">
              <div className="ega-auth-panel__badge">{mode === "login" ? "Öğrenci Girişi" : "Yeni Hesap"}</div>
              <h2>{mode === "login" ? "Mevcut hesabına giriş yap" : "Hızlıca yeni hesap oluştur"}</h2>
              <p>
                {mode === "login"
                  ? "Ürünlerine, sipariş durumuna ve öğrenci paneline tek yerden eriş."
                  : "Video paketlerin, sipariş geçmişin ve öğrenci panelin için hızlıca hesap oluştur."}
              </p>
            </div>

            <div className="ega-auth-mode-switch" role="tablist" aria-label="Kimlik doğrulama modu">
              <button
                type="button"
                className="ega-auth-mode-switch__tab"
                data-active={mode === "login"}
                onClick={() => setMode("login")}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                className="ega-auth-mode-switch__tab"
                data-active={mode === "register"}
                onClick={() => setMode("register")}
              >
                Hızlı Kayıt
              </button>
            </div>

            {mode === "login" ? (
              <form className="ega-form ega-auth-form" onSubmit={handleLogin}>
                <div className="ega-field">
                  <label htmlFor="login-email">E-posta</label>
                  <input
                    id="login-email"
                    className="ega-input"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="ega-field">
                  <label htmlFor="login-password">Şifre</label>
                  <input
                    id="login-password"
                    className="ega-input"
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                  />
                </div>

                {loginError ? <div className="ega-message ega-message--error">{loginError}</div> : null}

                <div className="ega-inline-links ega-inline-links--stacked">
                  <Link href="/eposta-dogrula">E-posta doğrulama</Link>
                  <Link href="/sifremi-unuttum">Şifremi unuttum</Link>
                </div>

                <button className="ega-button" type="submit" disabled={loginLoading}>
                  {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </button>
              </form>
            ) : (
              <form className="ega-form ega-auth-form" onSubmit={handleRegister}>
                <div className="ega-form-grid ega-form-grid--auth">
                  <div className="ega-field">
                    <label htmlFor="firstName">Ad</label>
                    <input
                      id="firstName"
                      className="ega-input"
                      value={form.firstName}
                      onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="lastName">Soyad</label>
                    <input
                      id="lastName"
                      className="ega-input"
                      value={form.lastName}
                      onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="email">E-posta</label>
                    <input
                      id="email"
                      className="ega-input"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="phone">Telefon</label>
                    <input
                      id="phone"
                      className="ega-input"
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      placeholder="5XXXXXXXXX"
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="password">Şifre</label>
                    <input
                      id="password"
                      className="ega-input"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="schoolName">Okul</label>
                    <input
                      id="schoolName"
                      className="ega-input"
                      value={form.schoolName}
                      onChange={(event) => setForm((current) => ({ ...current, schoolName: event.target.value }))}
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="city">Şehir</label>
                    <input
                      id="city"
                      className="ega-input"
                      value={form.city}
                      onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="district">İlçe</label>
                    <input
                      id="district"
                      className="ega-input"
                      value={form.district}
                      onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="gradeLevel">Sınıf düzeyi</label>
                    <select
                      id="gradeLevel"
                      className="ega-select"
                      value={form.gradeLevel}
                      onChange={(event) => setForm((current) => ({ ...current, gradeLevel: event.target.value }))}
                    >
                      {gradeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ega-field">
                    <label htmlFor="studyTrack">Alan</label>
                    <select
                      id="studyTrack"
                      className="ega-select"
                      value={form.studyTrack}
                      onChange={(event) => setForm((current) => ({ ...current, studyTrack: event.target.value }))}
                    >
                      {studyTrackOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ega-field">
                    <label htmlFor="targetExamYear">Hedef sınav yılı</label>
                    <input
                      id="targetExamYear"
                      className="ega-input"
                      type="number"
                      min={2026}
                      value={form.targetExamYear}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, targetExamYear: event.target.value }))
                      }
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="parentName">Veli adı</label>
                    <input
                      id="parentName"
                      className="ega-input"
                      value={form.parentName}
                      onChange={(event) => setForm((current) => ({ ...current, parentName: event.target.value }))}
                    />
                  </div>

                  <div className="ega-field">
                    <label htmlFor="parentPhone">Veli telefonu</label>
                    <input
                      id="parentPhone"
                      className="ega-input"
                      value={form.parentPhone}
                      onChange={(event) => setForm((current) => ({ ...current, parentPhone: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="ega-checklist">
                  <label className="ega-check">
                    <input
                      type="checkbox"
                      checked={form.kvkkConsent}
                      onChange={(event) => setForm((current) => ({ ...current, kvkkConsent: event.target.checked }))}
                      required
                    />
                    <span>KVKK aydınlatma metnini okudum ve onaylıyorum.</span>
                  </label>

                  <label className="ega-check">
                    <input
                      type="checkbox"
                      checked={form.termsAccepted}
                      onChange={(event) => setForm((current) => ({ ...current, termsAccepted: event.target.checked }))}
                      required
                    />
                    <span>Kullanım koşullarını kabul ediyorum.</span>
                  </label>

                  <label className="ega-check">
                    <input
                      type="checkbox"
                      checked={form.distanceSalesAccepted}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          distanceSalesAccepted: event.target.checked
                        }))
                      }
                      required
                    />
                    <span>Mesafeli satış ve üyelik süreci koşullarını kabul ediyorum.</span>
                  </label>

                  <label className="ega-check">
                    <input
                      type="checkbox"
                      checked={form.marketingConsent}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, marketingConsent: event.target.checked }))
                      }
                    />
                    <span>Kampanya ve bilgilendirme mesajları almak istiyorum.</span>
                  </label>
                </div>

                {registerError ? <div className="ega-message ega-message--error">{registerError}</div> : null}
                {registerSuccess ? <div className="ega-message ega-message--success">{registerSuccess}</div> : null}

                <button className="ega-button" type="submit" disabled={registerLoading}>
                  {registerLoading ? "Kayıt oluşturuluyor..." : "Hesabı Oluştur"}
                </button>
              </form>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
