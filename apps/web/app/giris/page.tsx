import { AuthPageClient } from "./auth-page-client";

type AuthPageProps = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  if (process.env.NEXT_STATIC_EXPORT === "1") {
    return <AuthPageClient redirectHref="/hesabim" />;
  }

  const params = await searchParams;
  const redirectHref =
    params.redirect && params.redirect.startsWith("/") ? params.redirect : "/hesabim";

  return <AuthPageClient redirectHref={redirectHref} />;
}
