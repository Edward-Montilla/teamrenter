import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/signin",
        destination: "/sign-in",
        permanent: false,
      },
      {
        source: "/write-review",
        destination: "/submit-review/new",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
