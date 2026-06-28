import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["http://21.0.7.133:3000", "http://localhost:3000", "http://127.0.0.1:3000"],
};

export default nextConfig;
