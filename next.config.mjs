/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/portfolio", destination: "/#services", permanent: true },
      { source: "/work", destination: "/#services", permanent: true },
      { source: "/projects", destination: "/#services", permanent: true },
    ];
  },
};

export default nextConfig;
