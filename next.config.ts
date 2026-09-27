import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{source:'/:path*',headers:[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'Permissions-Policy',value:'microphone=(self), camera=(), geolocation=()'},
    ]}];
  },
  // Keep the framework's development badge from covering mobile navigation.
  devIndicators: false,
};
export default config;
