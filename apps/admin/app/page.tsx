"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearStaffTokens,
  fetchBootstrapStatus,
  fetchCurrentStaffUser,
  getAdminRequestErrorMessage,
  isStaffSessionError
} from "../lib/auth-client";
import { getStaffDefaultRoute } from "../lib/role-routing";

export default function AdminGatewayPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Yönetim oturumu kontrol ediliyor.");

  useEffect(() => {
    let active = true;

    async function resolveEntryPoint() {
      try {
        const bootstrapStatus = await fetchBootstrapStatus();

        if (!active) {
          return;
        }

        if (bootstrapStatus.requiresBootstrap) {
          router.replace("/kurulum");
          return;
        }

        const currentStaff = await fetchCurrentStaffUser();

        if (!active) {
          return;
        }

        router.replace(
          getStaffDefaultRoute({
            roleKeys: currentStaff.staffUser.roleKeys,
            permissionKeys: currentStaff.staffUser.permissionKeys
          })
        );
      } catch (requestError) {
        if (!active) {
          return;
        }

        if (isStaffSessionError(requestError)) {
          clearStaffTokens();
          setMessage("Güvenli giriş ekranına yönlendiriliyorsunuz.");
          router.replace("/giris");
          return;
        }

        setMessage(
          getAdminRequestErrorMessage(requestError, {
            network: "Yönetim servisine ulaşılamadı. Lütfen bağlantınızı kontrol edin.",
            server: "Yönetim servisi şu anda yanıt vermiyor. Lütfen tekrar deneyin.",
            fallback: "Yönetim paneli açılırken teknik bir sorun oluştu."
          })
        );
      }
    }

    void resolveEntryPoint();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <span className="admin-badge admin-badge--warm">Güvenli Yönetim</span>
        <h1>Yönetim paneli açılıyor</h1>
        <p>{message}</p>
        <div className="admin-login-card__footer">
          <span>Otomatik yönlendirme çalışmazsa:</span>
          <Link href="/giris">Personel girişi</Link>
        </div>
      </section>
    </main>
  );
}
