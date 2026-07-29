import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost", "21.0.12.15", "21.0.10.146", "space-z.ai", "preview-chat-15bf4e86-5baa-4754-a2a7-d1c1bb2ceee6.space-z.ai"],
};

export default nextConfig;
