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
          '/devteams',
          '/devemails',
          '/devboard',
          '/dashboard/owner/',
          '/dev-pricechangeshub',
          '/verify-email',
          '/reset-password',
          '/forgot-password',
          '/earn-messages',
          '/internal/',
        ],
      },
    ],
    sitemap: [
      "https://www.chatfpl.ai/sitemap.xml",
      "https://www.chatfpl.ai/sitemap.md",
    ],
  }
}
