function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function ensureV1Suffix(value) {
  const trimmed = trimTrailingSlash(value);
  return /\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

const apiBaseUrl = ensureV1Suffix(
  process.env.INTERNAL_API_BASE_URL?.trim() ||
    process.env.API_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "http://localhost:4000"
);

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isStaticExport ? "export" : "standalone",
  trailingSlash: isStaticExport ? true : false,
  images: {
    unoptimized: isStaticExport
  },
  experimental: {
    devtoolSegmentExplorer: false
  },
  transpilePackages: ["@ega/ui"],
  ...(isStaticExport
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/v1/:path*",
              destination: `${apiBaseUrl}/:path*`
            }
          ];
        }
      })
};

export default nextConfig;
