import { EmailVerificationClient } from "./email-verification-client";

type EmailVerificationPageProps = {
  searchParams: Promise<{
    token?: string;
    email?: string;
  }>;
};

export default async function EmailVerificationPage({
  searchParams
}: EmailVerificationPageProps) {
  if (process.env.NEXT_STATIC_EXPORT === "1") {
    return <EmailVerificationClient token="" initialEmail="" />;
  }

  const params = await searchParams;

  return (
    <EmailVerificationClient
      token={params.token ?? ""}
      initialEmail={params.email ?? ""}
    />
  );
}
