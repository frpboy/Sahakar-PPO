
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Modern workbox features
  workboxOptions: {
    disableDevLogs: true,
  },
});

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true
};

export default withPWA(nextConfig);
