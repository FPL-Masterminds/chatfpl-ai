import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/dashboard',
          '/devlandingpage',
          '/devchat',
          '/verify-email',
          '/reset-password',
          '/forgot-password',
          '/earn-messages',
        ],
      },
    ],
    sitemap: 'https://www.chatfpl.ai/sitemap.xml',
  }
}
