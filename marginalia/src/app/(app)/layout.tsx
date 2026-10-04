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
      <main className="md:ps-24">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 md:pt-10 md:pb-20 lg:px-8">{children}</div>
      </main>
      {/* Strictly null: before the onboarding migration the column is missing, and the guide stays hidden. */}
      {viewer.onboarded_at === null ? <Welcome viewer={viewer} /> : null}
    </>
  )
}
