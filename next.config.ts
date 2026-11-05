import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Haldus koondati aadressile /haldus; vanad lingid (ka juba saadetud e-kirjades) suunatakse edasi
  async redirects() {
    return [
      { source: "/tootepildid", destination: "/haldus/tooted", permanent: true },
      { source: "/opitoad/haldus", destination: "/haldus/opitoad", permanent: true },
      { source: "/opitoad/haldus/:id", destination: "/haldus/opitoad/:id", permanent: true },
    ];
  },
  images: {
    domains: ["zjmxbodufagyimpfsjwp.supabase.co"], // lisa oma Supabase host
  },
};

export default nextConfig;
