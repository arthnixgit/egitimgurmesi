/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    devtoolSegmentExplorer: false
  },
  transpilePackages: ["@ega/ui"]
};

export default nextConfig;
