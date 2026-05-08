"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { registerUser, saveUserTokens } from "../../lib/auth-client";

const gradeOptions = [
  { value: "", label: "Seçiniz" },
  { value: "GRADE_9", label: "9. Sınıf" },
  { value: "GRADE_10", label: "10. Sınıf" },
  { value: "GRADE_11", label: "11. Sınıf" },
  { value: "GRADE_12", label: "12. Sınıf" },
  { value: "GRADUATE", label: "Mezun" },
  { value: "UNIVERSITY", label: "Üniversite" },
  { value: "OTHER", label: "Diğer" }
] as const;

const studyTrackOptions = [
  { value: "", label: "Seçiniz" },
  { value: "SAYISAL", label: "Sayısal" },
  { value: "SOZEL", label: "Sözel" },
  { value: "ESIT_AGIRLIK", label: "Eşit Ağırlık" },
  { value: "DIL", label: "Dil" },
  { value: "TYT", label: "TYT" },
  { value: "OTHER", label: "Diğer" }
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await registerUser({
        ...form,
        targetExamYear: form.targetExamYear ? Number(form.targetExamYear) : undefined,
        gradeLevel: form.gradeLevel || undefined,
        studyTrack: form.studyTrack || undefined
      });

      saveUserTokens(response);
      setSuccess("Kayıt tamamlandı. Hesabın açıldı, yönlendiriliyorsun.");
      router.push("/hesabim");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Kayıt sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ega-auth-shell">
      <section className="ega-auth-card">
        <div className="ega-pill">Öğrenci Kaydı</div>
        <h1 style={{ fontFamily: "var(--font-display)" }}>Eğitim Gurmesi Akademi hesabını oluştur</h1>
        <p>
          Video paketleri, sipariş geçmişi ve ileride açılacak LMS erişimleri için kullanıcı hesabı burada
          oluşturulur.
        </p>

        <form className="ega-form" onSubmit={handleSubmit}>
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
              <label htmlFor="gradeLevel">Sınıf Düzeyi</label>
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
              <label htmlFor="targetExamYear">Hedef Sınav Yılı</label>
              <input
                id="targetExamYear"
                className="ega-input"
                type="number"
                min={2025}
                value={form.targetExamYear}
                onChange={(event) =>
                  setForm((current) => ({ ...current, targetExamYear: event.target.value }))
                }
              />
            </div>

            <div className="ega-field">
              <label htmlFor="parentName">Veli Adı</label>
              <input
                id="parentName"
                className="ega-input"
                value={form.parentName}
                onChange={(event) => setForm((current) => ({ ...current, parentName: event.target.value }))}
              />
            </div>

            <div className="ega-field">
              <label htmlFor="parentPhone">Veli Telefonu</label>
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
                onChange={(event) =>
                  setForm((current) => ({ ...current, kvkkConsent: event.target.checked }))
                }
                required
              />
              <span>KVKK aydınlatma metnini okudum ve onaylıyorum.</span>
            </label>

            <label className="ega-check">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(event) =>
                  setForm((current) => ({ ...current, termsAccepted: event.target.checked }))
                }
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

          {error ? <div className="ega-message ega-message--error">{error}</div> : null}
          {success ? <div className="ega-message ega-message--success">{success}</div> : null}

          <button className="ega-button" type="submit" disabled={loading}>
            {loading ? "Kayıt oluşturuluyor..." : "Hesabı Oluştur"}
          </button>
        </form>

        <div style={{ marginTop: 18 }} className="ega-inline-note">
          Zaten hesabın var mı? <Link href="/giris">Giriş yap</Link>
        </div>
      </section>
    </main>
  );
}
