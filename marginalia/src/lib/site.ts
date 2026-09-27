export const site = {
  name: 'Marginalia',
  tagline: 'A private library of a thousand readers.',
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}
