/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // data: URI（プレースホルダーSVG）を許可
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
