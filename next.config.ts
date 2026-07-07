import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost:3000', '127.0.0.1:3000', '*'],
  /* config options here */
  reactCompiler: true,
};

export default nextConfig;
