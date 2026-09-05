import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/login/',
          '/dashboard',
          '/dashboard/',
          '/api/',
          '/settings/',
          '/forgot-password/',
          '/reset-password/',
          '/verify-email/',
        ],
      },
    ],
    sitemap: 'https://tasktuntas.com/sitemap.xml',
  };
}
