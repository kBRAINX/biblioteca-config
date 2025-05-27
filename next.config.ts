import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;