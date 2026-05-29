"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, saveUserTokens } from "../lib/auth-client";
import { submitFreeCallRequest } from "../lib/public-engagement-client";
import { gradeOptions, studyTrackOptions } from "../lib/student-profile-options";

type ShowcaseQuickActionsProps = {
  sourcePage: string;
  mode?: "both" | "quiz-only";
  align?: "default" | "center";
};

type OverlayType = "consultation" | "quiz" | null;
type QuizMode = "login" | "register";

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.5 14.3 8l5.7 2.3-5.7 2.4L12 18.2l-2.3-5.5L4 10.3 9.7 8 12 2.5Zm6.2 12.8 1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.1-2.8-2.8-1.2 2.8-1.2 1.1-2.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7.4 3.5h2.4c.4 0 .8.3.9.7l.8 3.1c.1.3 0 .7-.2 1l-1.3 1.8a14.8 14.8 0 0 0 4 4l1.8-1.3c.3-.2.7-.3 1-.2l3.1.8c.4.1.7.5.7 1V17c0 .8-.7 1.5-1.5 1.5h-.8A15.2 15.2 0 0 1 5.9 6V5c0-.8.7-1.5 1.5-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ShowcaseQuickActions({
  sourcePage,
  mode = "both",
  align = "default"
}: ShowcaseQuickActionsProps) {
  const router = useRouter();
  const [activeOverlay, setActiveOverlay] = useState<OverlayType>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>("login");
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationMessage, setConsultationMessage] = useState("");
  const [consultationError, setConsultationError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [consultationForm, setConsultationForm] = useState({
    fullName: "",
    studentName: "",
    phone: "",
    email: "",
    gradeLevel: "",
    studyTrack: "",
    city: "",
    note: ""
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    gradeLevel: "",
    studyTrack: "",
    marketingConsent: true,
    kvkkConsent: false,
    termsAccepted: false,
    distanceSalesAccepted: false
  });

  useEffect(() => {
    if (!activeOverlay) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeOverlay]);

  const consultationIconLabel = useMemo(
    () => ({ title: "Ücretsiz Ön Görüşme", body: "Hızlı ön başvuru formu" }),
    []
  );
  const quizIconLabel = useMemo(
    () => ({ title: "Mini Quiz", body: "Giriş yap veya hızlı hesap oluştur" }),
    []
  );

  async function handleConsultationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConsultationLoading(true);
    setConsultationError("");
    setConsultationMessage("");

    try {
      const response = await submitFreeCallRequest({
        ...consultationForm,
        gradeLevel: consultationForm.gradeLevel || undefined,
        studyTrack: consultationForm.studyTrack || undefined,
        email: consultationForm.email || undefined,
        studentName: consultationForm.studentName || undefined,
        city: consultationForm.city || undefined,
        note: consultationForm.note || undefined,
        sourcePage
      });

      setConsultationMessage(response.message);
      setConsultationForm({
        fullName: "",
        studentName: "",
        phone: "",
        email: "",
        gradeLevel: "",
        studyTrack: "",
        city: "",
        note: ""
      });
    } catch (error) {
      setConsultationError(error instanceof Error ? error.message : "Talep gönderilemedi.");
    } finally {
      setConsultationLoading(false);
    }
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await loginUser(loginForm);
      saveUserTokens(response);
      setActiveOverlay(null);
      router.push("/hesabim");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Giriş yapılamadı.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRegisterLoading(true);
    setRegisterError("");
    setRegisterSuccess("");

    try {
      const response = await registerUser({
        ...registerForm,
        gradeLevel: registerForm.gradeLevel || undefined,
        studyTrack: registerForm.studyTrack || undefined,
        city: "",
        district: "",
        schoolName: "",
        targetExamYear: undefined,
        parentName: "",
        parentPhone: ""
      });

      setRegisterSuccess(response.message);
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Kayıt oluşturulamadı.");
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <>
      <div
        className="ega-showcase-quick-actions"
        data-mode={mode}
        data-align={align}
        aria-label="Hızlı işlem alanı"
      >
        {mode !== "quiz-only" ? (
          <button
            type="button"
            className="ega-showcase-action-icon ega-showcase-action-icon--gold"
            onClick={() => setActiveOverlay("consultation")}
          >
            <span className="ega-showcase-action-icon__symbol">
              <PhoneIcon />
            </span>
            <span className="ega-showcase-action-icon__label">
              <strong>{consultationIconLabel.title}</strong>
              <small>{consultationIconLabel.body}</small>
            </span>
          </button>
        ) : null}

        <button
          type="button"
          className="ega-showcase-action-icon ega-showcase-action-icon--blue"
          onClick={() => setActiveOverlay("quiz")}
        >
          <span className="ega-showcase-action-icon__symbol">
            <SparkIcon />
          </span>
          <span className="ega-showcase-action-icon__label">
            <strong>{quizIconLabel.title}</strong>
            <small>{quizIconLabel.body}</small>
          </span>
        </button>
      </div>

      {activeOverlay ? (
        <div className="ega-overlay-shell" role="dialog" aria-modal="true">
          <button
            type="button"
            className="ega-overlay-shell__backdrop"
            aria-label="Pencereyi kapat"
            onClick={() => setActiveOverlay(null)}
          />

          <div className="ega-overlay-card">
            <button
              type="button"
              className="ega-overlay-card__close"
              aria-label="Pencereyi kapat"
              onClick={() => setActiveOverlay(null)}
            >
              ×
            </button>

            {activeOverlay === "consultation" ? (
              <div className="ega-overlay-card__content">
                <div className="ega-overlay-card__head">
                  <h3>Ücretsiz Ön Görüşme</h3>
                  <p>Sizi arayabilmemiz için temel bilgileri bırakın.</p>
                </div>

                <form className="ega-overlay-form" onSubmit={handleConsultationSubmit}>
                  <div className="ega-overlay-form__grid">
                    <label className="ega-field">
                      <span>Ad Soyad</span>
                      <input
                        className="ega-input"
                        value={consultationForm.fullName}
                        onChange={(event) =>
                          setConsultationForm((current) => ({ ...current, fullName: event.target.value }))
                        }
                        required
                      />
                    </label>

                    <label className="ega-field">
                      <span>Öğrenci Adı</span>
                      <input
                        className="ega-input"
                        value={consultationForm.studentName}
                        onChange={(event) =>
                          setConsultationForm((current) => ({ ...current, studentName: event.target.value }))
                        }
                      />
                    </label>

                    <label className="ega-field">
                      <span>Telefon</span>
                      <input
                        className="ega-input"
                        value={consultationForm.phone}
                        onChange={(event) =>
                          setConsultationForm((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="5XXXXXXXXX"
                        required
                      />
                    </label>

                    <label className="ega-field">
                      <span>E-posta</span>
                      <input
                        className="ega-input"
                        type="email"
                        value={consultationForm.email}
                        onChange={(event) =>
                          setConsultationForm((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </label>

                    <label className="ega-field">
                      <span>Sınıf Düzeyi</span>
                      <select
                        className="ega-select"
                        value={consultationForm.gradeLevel}
                        onChange={(event) =>
                          setConsultationForm((current) => ({ ...current, gradeLevel: event.target.value }))
                        }
                      >
                        {gradeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="ega-field">
                      <span>Alan</span>
                      <select
                        className="ega-select"
                        value={consultationForm.studyTrack}
                        onChange={(event) =>
                          setConsultationForm((current) => ({ ...current, studyTrack: event.target.value }))
                        }
                      >
                        {studyTrackOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="ega-field">
                      <span>Şehir</span>
                      <input
                        className="ega-input"
                        value={consultationForm.city}
                        onChange={(event) =>
                          setConsultationForm((current) => ({ ...current, city: event.target.value }))
                        }
                      />
                    </label>
                  </div>

                  <label className="ega-field">
                    <span>Kısa Not</span>
                    <textarea
                      className="ega-textarea"
                      rows={4}
                      value={consultationForm.note}
                      onChange={(event) =>
                        setConsultationForm((current) => ({ ...current, note: event.target.value }))
                      }
                      placeholder="Hangi paket ya da ihtiyaç için aranmak istediğinizi kısaca yazabilirsiniz."
                    />
                  </label>

                  {consultationError ? (
                    <div className="ega-message ega-message--error">{consultationError}</div>
                  ) : null}
                  {consultationMessage ? (
                    <div className="ega-message ega-message--success">{consultationMessage}</div>
                  ) : null}

                  <button className="ega-button" type="submit" disabled={consultationLoading}>
                    {consultationLoading ? "Gönderiliyor..." : "Talebi Gönder"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="ega-overlay-card__content">
                <div className="ega-overlay-card__head">
                  <h3>Mini Quiz</h3>
                  <p>Devam etmek için giriş yapın veya hızlıca hesap oluşturun.</p>
                </div>

                <div className="ega-overlay-switch">
                  <button
                    type="button"
                    className="ega-overlay-switch__tab"
                    data-active={quizMode === "login"}
                    onClick={() => setQuizMode("login")}
                  >
                    Giriş Yap
                  </button>
                  <button
                    type="button"
                    className="ega-overlay-switch__tab"
                    data-active={quizMode === "register"}
                    onClick={() => setQuizMode("register")}
                  >
                    Hızlı Kayıt
                  </button>
                </div>

                {quizMode === "login" ? (
                  <form className="ega-overlay-form" onSubmit={handleLoginSubmit}>
                    <label className="ega-field">
                      <span>E-posta</span>
                      <input
                        className="ega-input"
                        type="email"
                        value={loginForm.email}
                        onChange={(event) =>
                          setLoginForm((current) => ({ ...current, email: event.target.value }))
                        }
                        required
                      />
                    </label>

                    <label className="ega-field">
                      <span>Şifre</span>
                      <input
                        className="ega-input"
                        type="password"
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm((current) => ({ ...current, password: event.target.value }))
                        }
                        required
                      />
                    </label>

                    {loginError ? <div className="ega-message ega-message--error">{loginError}</div> : null}

                    <button className="ega-button" type="submit" disabled={loginLoading}>
                      {loginLoading ? "Giriş yapılıyor..." : "Mini Quiz'e Devam Et"}
                    </button>
                  </form>
                ) : (
                  <form className="ega-overlay-form" onSubmit={handleRegisterSubmit}>
                    <div className="ega-overlay-form__grid">
                      <label className="ega-field">
                        <span>Ad</span>
                        <input
                          className="ega-input"
                          value={registerForm.firstName}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, firstName: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label className="ega-field">
                        <span>Soyad</span>
                        <input
                          className="ega-input"
                          value={registerForm.lastName}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, lastName: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label className="ega-field">
                        <span>E-posta</span>
                        <input
                          className="ega-input"
                          type="email"
                          value={registerForm.email}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, email: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label className="ega-field">
                        <span>Telefon</span>
                        <input
                          className="ega-input"
                          value={registerForm.phone}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                          }
                        />
                      </label>

                      <label className="ega-field">
                        <span>Şifre</span>
                        <input
                          className="ega-input"
                          type="password"
                          value={registerForm.password}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, password: event.target.value }))
                          }
                          required
                        />
                      </label>

                      <label className="ega-field">
                        <span>Sınıf Düzeyi</span>
                        <select
                          className="ega-select"
                          value={registerForm.gradeLevel}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, gradeLevel: event.target.value }))
                          }
                        >
                          {gradeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="ega-field">
                        <span>Alan</span>
                        <select
                          className="ega-select"
                          value={registerForm.studyTrack}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, studyTrack: event.target.value }))
                          }
                        >
                          {studyTrackOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="ega-checklist">
                      <label className="ega-check">
                        <input
                          type="checkbox"
                          checked={registerForm.marketingConsent}
                          onChange={(event) =>
                            setRegisterForm((current) => ({
                              ...current,
                              marketingConsent: event.target.checked
                            }))
                          }
                        />
                        <span>Kampanya ve duyurular için bilgilendirme almak istiyorum.</span>
                      </label>

                      <label className="ega-check">
                        <input
                          type="checkbox"
                          checked={registerForm.kvkkConsent}
                          onChange={(event) =>
                            setRegisterForm((current) => ({ ...current, kvkkConsent: event.target.checked }))
                          }
                          required
                        />
                        <span>KVKK metnini okudum ve onaylıyorum.</span>
                      </label>

                      <label className="ega-check">
                        <input
                          type="checkbox"
                          checked={registerForm.termsAccepted}
                          onChange={(event) =>
                            setRegisterForm((current) => ({
                              ...current,
                              termsAccepted: event.target.checked
                            }))
                          }
                          required
                        />
                        <span>Kullanım koşullarını kabul ediyorum.</span>
                      </label>

                      <label className="ega-check">
                        <input
                          type="checkbox"
                          checked={registerForm.distanceSalesAccepted}
                          onChange={(event) =>
                            setRegisterForm((current) => ({
                              ...current,
                              distanceSalesAccepted: event.target.checked
                            }))
                          }
                          required
                        />
                        <span>Mesafeli satış ve üyelik koşullarını kabul ediyorum.</span>
                      </label>
                    </div>

                    {registerError ? <div className="ega-message ega-message--error">{registerError}</div> : null}
                    {registerSuccess ? (
                      <div className="ega-message ega-message--success">{registerSuccess}</div>
                    ) : null}

                    <button className="ega-button" type="submit" disabled={registerLoading}>
                      {registerLoading ? "Hesap oluşturuluyor..." : "Hızlı Hesap Oluştur"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
