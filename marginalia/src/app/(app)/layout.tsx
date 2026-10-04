import type { ReactNode } from 'react'
import { Nav } from '@/components/nav'
import { requireViewer } from '@/lib/viewer'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer()
  return (
    <>
      <Nav viewer={viewer} />
      <main className="md:pl-24">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 md:pt-10 md:pb-20 lg:px-8">{children}</div>
      </main>
    </>
  )
}
