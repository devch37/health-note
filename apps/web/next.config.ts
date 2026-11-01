import type { NextConfig } from "next";

// 백엔드 API를 같은 출처(/api)로 프록시해 쿠키·CSRF를 단순하게 유지한다(docs/ARCHITECTURE.md §3).
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:8080";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 비밀번호 재설정 토큰이 URL에 있으므로 외부로 Referer를 보내지 않는다.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
