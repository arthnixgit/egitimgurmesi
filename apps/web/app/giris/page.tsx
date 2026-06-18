import { AuthPageClient } from "./auth-page-client";

type AuthPageProps = {
  searchParams: Promise<{
    redirect?: string;
    reason?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  if (process.env.NEXT_STATIC_EXPORT === "1") {
    return <AuthPageClient redirectHref="/hesabim" />;
  }

  const params = await searchParams;
  const redirectHref =
    params.redirect && params.redirect.startsWith("/") ? params.redirect : "/hesabim";
  const sessionMessage =
    params.reason === "timeout" ? "Güvenliğiniz için oturumunuz otomatik kapatıldı." : "";

  return <AuthPageClient redirectHref={redirectHref} sessionMessage={sessionMessage} />;
}
