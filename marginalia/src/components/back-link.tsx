import Link from 'next/link'
import { Icon } from './ui/icon'

export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="state-layer -ms-3 inline-flex w-fit items-center gap-2 rounded-full py-2 ps-3 pe-4 type-label-lg text-on-surface-variant">
      <Icon name="arrow_back" size={20} className="flip-rtl" />
      {children}
    </Link>
  )
}
