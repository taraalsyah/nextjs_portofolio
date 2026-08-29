import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
