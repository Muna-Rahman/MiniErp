const API_URL = process.env.API_URL || "http://localhost:5000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser only talks to Next; /api/* is proxied to Express so cookies stay same-origin.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
