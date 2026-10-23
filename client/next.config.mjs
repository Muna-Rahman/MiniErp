// Normalise API_URL so common deploy mistakes can't cause redirect loops:
//  - trailing slash / trailing "/api"  -> removed
//  - missing scheme                    -> https:// assumed (http:// on Vercel 308-redirects to https,
//                                         and Next hands that redirect back to the browser = loop)
let API_URL = (process.env.API_URL || "http://localhost:5000").trim().replace(/\/+$/, "").replace(/\/api$/, "");
if (!/^https?:\/\//.test(API_URL)) API_URL = `https://${API_URL}`;
if (process.env.VERCEL && API_URL.startsWith("http://")) API_URL = API_URL.replace("http://", "https://");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The browser only talks to Next; /api/* is proxied to Express so cookies stay same-origin.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
