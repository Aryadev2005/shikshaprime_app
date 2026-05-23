import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",

  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || "",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
    NEXT_PUBLIC_BASE_DOMAIN: process.env.NEXT_PUBLIC_BASE_DOMAIN,
    NEXT_PUBLIC_BASE_PORT: process.env.NEXT_PUBLIC_BASE_PORT,
    NEXT_PUBLIC_BASE_METHOD: process.env.NEXT_PUBLIC_BASE_METHOD
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/auth/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
