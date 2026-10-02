import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { Welcome } from '@/components/welcome'
import { requireViewer } from '@/lib/viewer'

// Member pages are private: keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer()
  return (
    <>
      <Nav viewer={viewer} />
      <main className="mx-auto w-full max-w-5xl px-4 pt-10 pb-28 sm:px-6 md:pb-16">{children}</main>
      {/* Strictly null: before the onboarding migration the column is missing, and the guide stays hidden. */}
      {viewer.onboarded_at === null ? <Welcome viewer={viewer} /> : null}
    </>
  )
}
