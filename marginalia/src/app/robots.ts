import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

// Only the front door is public. Everything behind sign in stays out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/join', '/login'],
      disallow: ['/feed', '/market', '/chat', '/u/', '/shelf', '/orders', '/settings', '/admin', '/api/', '/auth/', '/styleguide'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
