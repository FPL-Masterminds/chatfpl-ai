import { MetadataRoute } from 'next'

const baseUrl = 'https://www.chatfpl.ai'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  
  // Static pages
  const staticPages = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/about`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/contact`, priority: 0.8, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/terms`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/privacy`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/playbook`, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/login`, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/signup`, priority: 0.9, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/chat`, priority: 0.9, changeFrequency: 'always' as const },
  ]
  
  // Question/Answer pages - automatically discovered and added
  const questionPages = [
    '/mohamed-salah-statistics',
    '/erling-haaland-price-worth-it',
    '/arsenal-defender-next-5-gameweeks',
    '/salah-vs-cole-palmer-transfer',
    '/differential-midfielders-under-7-5m',
    '/best-form-players',
    '/jack-grealish-everton-fixtures',
    '/points-hit-explained',
    '/antoine-semenyo-budget-midfielder',
    '/danny-welbeck-last-5-games',
    '/best-fixture-run-6-gameweeks',
    '/van-dijk-vs-gabriel-comparison',
    '/highest-expected-points-next-gameweeks',
    '/best-defenders-under-4-5m',
    '/bench-boost-chip-timing',
    '/haaland-pedro-isak-comparison',
    '/top-10-most-transferred-in-players',
  ]
  
  const questionEntries = questionPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
  
  return [
    ...staticPages.map(page => ({
      url: page.url,
      lastModified: now,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...questionEntries,
  ]
}

