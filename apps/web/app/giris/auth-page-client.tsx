"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, saveUserTokens } from "../../lib/auth-client";
import { gradeOptions, studyTrackOptions } from "../../lib/student-profile-options";

type AuthPageClientProps = {
  redirectHref: string;
};

export function AuthPageClient({ redirectHref }: AuthPageClientProps) {
  const router = useRouter();
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

      saveUserTokens(response);
      setRegisterSuccess("Kayıt tamamlandı. Hesabın açıldı, yönlendiriliyorsun.");
      router.push(redirectHref);
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
    <main className="ega-auth-shell ega-auth-shell--wide">
      <div className="ega-auth-page-head">
        <div className="ega-pill ega-pill--warm">Öğrenci hesabı</div>
        <h1>Giriş yap veya yeni hesap oluştur</h1>
        <p>
          Aynı sayfada oturum açabilir ya da yeni öğrenci hesabı oluşturabilirsin.
          Satın alma ve öğrenci paneli erişimi bu hesap üzerinden ilerler.
        </p>
      </div>

      <section className="ega-auth-split">
        <section className="ega-auth-card ega-auth-card--compact">
          <div className="ega-pill">Öğrenci girişi</div>
          <h2>Mevcut hesabına giriş yap</h2>
          <p>
            Satın aldığın ürünleri, sipariş durumunu ve öğrenci panelini buradan
            açarsın.
          </p>

          <form className="ega-form" onSubmit={handleLogin}>
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

            <button className="ega-button" type="submit" disabled={loginLoading}>
              {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="ega-auth-card__footer-note">
            İlk kez geliyorsan sağdaki karttan hesabını oluşturup doğrudan ödeme
            akışına devam edebilirsin.
          </div>
        </section>

        <section className="ega-auth-card">
          <div className="ega-pill">Yeni hesap</div>
          <h2>Kayıt ol ve hesabını oluştur</h2>
          <p>
            Video paketleri, sipariş geçmişi ve ileride açılacak LMS erişimleri için
            kullanıcı hesabı burada oluşturulur.
          </p>

          <form className="ega-form" onSubmit={handleRegister}>
            <div className="ega-form-grid">
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
                  onChange={(event) => setForm((current) => ({ ...current, targetExamYear: event.target.value }))}
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
                  onChange={(event) => setForm((current) => ({ ...current, marketingConsent: event.target.checked }))}
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
        </section>
      </section>
    </main>
  );
}
