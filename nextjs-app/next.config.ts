import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/login", destination: "/", permanent: false },
      { source: "/dashboard", destination: "/products", permanent: false },
    ];
  },
};

export default nextConfig;
