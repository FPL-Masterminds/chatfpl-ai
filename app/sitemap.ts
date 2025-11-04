import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

const baseUrl = 'https://www.chatfpl.ai'

// Routes to exclude from sitemap
const excludedRoutes = [
  '/api',
  '/admin',
  '/account',
  '/earn-messages',
]

// Function to recursively find all page routes
function getAllPageRoutes(dir: string, baseRoute: string = ''): string[] {
  const routes: string[] = []
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      // Skip non-directories and special directories
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
      if (entry.name === 'api') continue
      
      const fullPath = path.join(dir, entry.name)
      const routePath = `${baseRoute}/${entry.name}`
      
      // Check if this directory has a page file
      const dirContents = fs.readdirSync(fullPath)
      const hasPage = dirContents.some(file => 
        file === 'page.tsx' || 
        file === 'page.ts' || 
        file === 'page.jsx' || 
        file === 'page.js'
      )
      
      if (hasPage && !excludedRoutes.includes(routePath)) {
        routes.push(routePath)
      }
      
      // Recursively check subdirectories
      const subRoutes = getAllPageRoutes(fullPath, routePath)
      routes.push(...subRoutes)
    }
  } catch (error) {
    // Directory not accessible, skip
  }
  
  return routes
}

// Determine priority and change frequency based on route
function getRouteMetadata(route: string) {
  // Homepage
  if (route === '') {
    return { priority: 1.0, changeFrequency: 'daily' as const }
  }
  
  // High priority pages
  if (['/chat', '/signup'].includes(route)) {
    return { priority: 0.9, changeFrequency: 'always' as const }
  }
  
  // Important content pages
  if (['/about', '/playbook', '/contact'].includes(route)) {
    return { priority: 0.8, changeFrequency: 'weekly' as const }
  }
  
  // Legal pages
  if (['/terms', '/privacy'].includes(route)) {
    return { priority: 0.5, changeFrequency: 'monthly' as const }
  }
  
  // Auth pages
  if (['/login'].includes(route)) {
    return { priority: 0.6, changeFrequency: 'monthly' as const }
  }
  
  // All other pages (question/answer pages, etc.)
  return { priority: 0.7, changeFrequency: 'weekly' as const }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const appDir = path.join(process.cwd(), 'app')
  
  // Get all dynamic routes
  const allRoutes = getAllPageRoutes(appDir)
  
  // Add homepage
  const routes = ['', ...allRoutes]
  
  // Generate sitemap entries
  const sitemapEntries: MetadataRoute.Sitemap = routes.map((route) => {
    const metadata = getRouteMetadata(route)
    
    return {
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: metadata.changeFrequency,
      priority: metadata.priority,
    }
  })
  
  return sitemapEntries
}

