/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Linting runs as its own CI step (`npm run lint`) from the repository root,
  // where eslint-suppressions.json resolves. `next build` would run ESLint with
  // this app as the working directory instead, find no suppressions file, and
  // fail the production build on the pre-existing violations the ratchet
  // deliberately holds. Type errors still fail the build; only linting moves.
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: ["@ega/ui"]
};

export default nextConfig;
