import Link from 'next/link'
import { Icon } from './ui/icon'

export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="state-layer -ml-3 inline-flex w-fit items-center gap-2 rounded-full py-2 pr-4 pl-3 type-label-lg text-on-surface-variant">
      <Icon name="arrow_back" size={20} />
      {children}
    </Link>
  )
}
