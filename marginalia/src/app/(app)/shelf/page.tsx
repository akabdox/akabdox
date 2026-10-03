import { redirect } from 'next/navigation'
import { requireViewer } from '@/lib/viewer'

export default async function ShelfPage() {
  const viewer = await requireViewer()
  redirect(`/u/${viewer.username}`)
}
