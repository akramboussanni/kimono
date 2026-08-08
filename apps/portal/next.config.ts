import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@kimono/ui", "@kimono/app-sdk"],
};

export default nextConfig;
