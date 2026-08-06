import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kimono/ui", "@kimono/app-sdk"],
};

export default nextConfig;
