import type { ReactNode } from 'react'
import { Nav } from '@/components/nav'
import { Welcome } from '@/components/welcome'
import { requireViewer } from '@/lib/viewer'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const viewer = await requireViewer()
  return (
    <>
      <Nav viewer={viewer} />
      <main className="mx-auto w-full max-w-5xl px-4 pt-10 pb-28 sm:px-6 md:pb-16">{children}</main>
      {viewer.onboarded_at ? null : <Welcome viewer={viewer} />}
    </>
  )
}
