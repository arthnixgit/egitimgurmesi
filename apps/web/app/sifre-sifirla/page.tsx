import { ResetPasswordClient } from "./reset-password-client";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  if (process.env.NEXT_STATIC_EXPORT === "1") {
    return <ResetPasswordClient token="" />;
  }

  const params = await searchParams;

  return <ResetPasswordClient token={params.token ?? ""} />;
}
