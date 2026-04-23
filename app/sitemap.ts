import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'
import { getEligibleSlugs, BEST_VALUE_COMBOS, getTeamSlugs, TEAM_POSITION_SLUGS } from '@/lib/fpl-player-page'
import { getComparisonSlugs } from '@/lib/fpl-comparison'
import { getInjurySlugs } from '@/lib/fpl-injury'
import { getTransferTrendSlugs } from '@/lib/fpl-transfer-trends'
import { getFixtureSlugs } from '@/lib/fpl-fixtures'
import { getGameweekSlugs, getDGWPlayerSlugs } from '@/lib/fpl-gameweeks'

const baseUrl = 'https://www.chatfpl.ai'

// Routes to exclude from sitemap (private, dev, or utility pages)
const excludedRoutes = [
  '/api',
  '/admin',
  '/account',
  '/earn-messages',
  '/devlandingpage',
  '/devchat',
  '/devcaptains',
  '/devdifferentials',
  '/devcomparisons',
  '/dashboard',
  '/verify-email',
  '/reset-password',
  '/forgot-password',
  '/fpl',           // exclude the /fpl parent — only include /fpl/[slug] entries
  '/fpl/injury',    // exclude parent — individual pages handled via injuryRoutes above
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
  if (['/fpl/captains', '/fpl/differentials', '/fpl/comparisons', '/fpl/transfer-trends', '/fpl/fixtures', '/fpl/gameweeks'].includes(route)) return { priority: 1.0, changeFrequency: 'always' as const }
  if (route.startsWith('/fpl/gameweeks/')) return { priority: 0.95, changeFrequency: 'daily' as const }
  if (route.startsWith('/fpl/double-gameweek/')) return { priority: 0.93, changeFrequency: 'daily' as const }
  if (route.startsWith('/fpl/fixtures/')) return { priority: 0.93, changeFrequency: 'daily' as const }
  if (route.startsWith('/fpl/transfer-trends/')) return { priority: 0.92, changeFrequency: 'daily' as const }
  if (route.startsWith('/fpl/best/')) return { priority: 0.95, changeFrequency: 'daily' as const }
  if (route.startsWith('/fpl/team/')) return { priority: 0.9, changeFrequency: 'daily' as const }
  if (['/about', '/faq', '/contact'].includes(route)) return { priority: 0.8, changeFrequency: 'weekly' as const }
  if (['/terms', '/privacy'].includes(route)) return { priority: 0.5, changeFrequency: 'monthly' as const }
  if (['/login'].includes(route)) return { priority: 0.6, changeFrequency: 'monthly' as const }
  if (route.startsWith('/fpl/')) return { priority: 0.85, changeFrequency: 'daily' as const }
  return { priority: 0.7, changeFrequency: 'weekly' as const }
}

// Fetch all eligible player slugs via the shared cached bootstrap call
async function getPlayerSlugs(): Promise<string[]> {
  const params = await getEligibleSlugs()
  return params.map((p) => p.slug)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const appDir = path.join(process.cwd(), 'app')

  // Static file-system routes
  const staticRoutes = ['', ...getAllPageRoutes(appDir)]

  // Dynamic player routes from FPL API
  const playerSlugs = await getPlayerSlugs()
  const captainRoutes      = playerSlugs.map((slug) => `/fpl/${slug}`)
  const transferRoutes     = playerSlugs.map((slug) => `/fpl/${slug}/transfer`)
  const sellRoutes         = playerSlugs.map((slug) => `/fpl/${slug}/sell`)
  const differentialRoutes = playerSlugs.map((slug) => `/fpl/${slug}/differential`)

  // Comparison routes — top 500 same-position pairs by combined ownership
  const comparisonPairs = await getComparisonSlugs(4250)
  const comparisonRoutes = comparisonPairs.map(
    ({ playerA, playerB }) => `/fpl/compare/${playerA}/${playerB}`
  )

  // Transfer trends — top 400 same-position sell/buy pairs by combined activity
  const transferTrendPairs = await getTransferTrendSlugs(400)
  const transferTrendRoutes = transferTrendPairs.map(
    ({ player_out, player_in }) => `/fpl/transfer-trends/${player_out}/${player_in}`
  )

  // Injury routes — only currently flagged players
  const injurySlugsData = await getInjurySlugs()
  const injuryRoutes = injurySlugsData.map(({ slug }) => `/fpl/injury/${slug}`)

  // Best value hub pages — position + price bracket (skipped by filesystem crawler)
  const bestValueRoutes = BEST_VALUE_COMBOS.map(
    ({ position, price }) => `/fpl/best/${position}/${price}`
  )

  // Team hub pages — overview + position breakdown (skipped by filesystem crawler)
  const teamSlugsData = await getTeamSlugs()
  const teamOverviewRoutes  = teamSlugsData.map(({ teamSlug }) => `/fpl/team/${teamSlug}`)
  const teamPositionRoutes  = teamSlugsData.flatMap(({ teamSlug }) =>
    TEAM_POSITION_SLUGS.map((pos) => `/fpl/team/${teamSlug}/${pos}`)
  )

  // Fixture difficulty pages — threshold-based: pages added automatically as players
  // hit eligibility benchmarks (net transfer surge, hot form, or base criteria)
  const fixtureSlugsData = await getFixtureSlugs()
  const fixtureRoutes = fixtureSlugsData.map(({ slug }) => `/fpl/fixtures/${slug}`)

  // Gameweek planner — DGW/BGW hub, GW detail pages, and individual player DGW pages
  const gwSlugsData     = await getGameweekSlugs()
  const gwDetailRoutes  = gwSlugsData.map(({ gw }) => `/fpl/gameweeks/${gw}`)
  const dgwPlayerSlugs  = await getDGWPlayerSlugs()
  const dgwPlayerRoutes = dgwPlayerSlugs.map(({ slug }) => `/fpl/double-gameweek/${slug}`)

  const allRoutes = [
    ...staticRoutes,
    "/fpl/captains",
    "/fpl/differentials",
    "/fpl/comparisons",
    "/fpl/transfer-trends",
    "/fpl/injuries",
    "/fpl/fixtures",
    "/fpl/gameweeks",
    ...bestValueRoutes,
    ...teamOverviewRoutes,
    ...teamPositionRoutes,
    ...captainRoutes,
    ...transferRoutes,
    ...sellRoutes,
    ...differentialRoutes,
    ...comparisonRoutes,
    ...injuryRoutes,
    ...transferTrendRoutes,
    ...fixtureRoutes,
    ...gwDetailRoutes,
    ...dgwPlayerRoutes,
  ]

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
