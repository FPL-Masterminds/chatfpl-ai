import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { buildSlugLookup, toSlug } from '@/lib/fpl-player-page'

const baseUrl = 'https://www.chatfpl.ai'

// Routes to exclude from sitemap (private, dev, or utility pages)
const excludedRoutes = [
  '/api',
  '/admin',
  '/account',
  '/earn-messages',
  '/devlandingpage',
  '/devchat',
  '/dashboard',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
  '/fpl',           // exclude the /fpl parent — only include /fpl/[slug] entries
]

// Recursively find all static page routes from the filesystem
function getAllPageRoutes(dir: string, baseRoute: string = ''): string[] {
  const routes: string[] = []

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
      if (entry.name === 'api') continue
      // Skip dynamic route directories — they are handled separately below
      if (entry.name.startsWith('[')) continue

      const fullPath = path.join(dir, entry.name)
      const routePath = `${baseRoute}/${entry.name}`

      const dirContents = fs.readdirSync(fullPath)
      const hasPage = dirContents.some((file) =>
        ['page.tsx', 'page.ts', 'page.jsx', 'page.js'].includes(file)
      )

      if (hasPage && !excludedRoutes.includes(routePath)) {
        routes.push(routePath)
      }

      const subRoutes = getAllPageRoutes(fullPath, routePath)
      routes.push(...subRoutes)
    }
  } catch {
    // Directory not accessible
  }

  return routes
}

function getRouteMetadata(route: string) {
  if (route === '') return { priority: 1.0, changeFrequency: 'daily' as const }
  if (['/chat', '/signup'].includes(route)) return { priority: 0.9, changeFrequency: 'always' as const }
  if (['/about', '/faq', '/contact'].includes(route)) return { priority: 0.8, changeFrequency: 'weekly' as const }
  if (['/terms', '/privacy'].includes(route)) return { priority: 0.5, changeFrequency: 'monthly' as const }
  if (['/login'].includes(route)) return { priority: 0.6, changeFrequency: 'monthly' as const }
  if (route.startsWith('/fpl/')) return { priority: 0.85, changeFrequency: 'daily' as const }
  return { priority: 0.7, changeFrequency: 'weekly' as const }
}

// Fetch all eligible player slugs from the FPL API
async function getPlayerSlugs(): Promise<string[]> {
  try {
    const bootstrap = await fetch(
      'https://fantasy.premierleague.com/api/bootstrap-static/',
      { headers: { 'User-Agent': 'ChatFPL/1.0' }, next: { revalidate: 86400 } }
    ).then((r) => r.json())

    const eligible = (bootstrap.elements ?? []).filter(
      (p: any) =>
        p.minutes >= 1000 &&
        parseFloat(p.selected_by_percent ?? '0') >= 1.0
    )

    const slugMap = buildSlugLookup(eligible, bootstrap.teams ?? [])
    return Array.from(slugMap.keys())
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const appDir = path.join(process.cwd(), 'app')

  // Static file-system routes
  const staticRoutes = ['', ...getAllPageRoutes(appDir)]

  // Dynamic player routes from FPL API
  const playerSlugs = await getPlayerSlugs()
  const captainRoutes  = playerSlugs.map((slug) => `/fpl/${slug}`)
  const transferRoutes = playerSlugs.map((slug) => `/fpl/${slug}/transfer`)

  const allRoutes = [...staticRoutes, ...captainRoutes, ...transferRoutes]

  return allRoutes.map((route) => {
    const meta = getRouteMetadata(route)
    return {
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: meta.changeFrequency,
      priority: meta.priority,
    }
  })
}
