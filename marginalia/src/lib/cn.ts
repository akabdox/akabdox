import { extendTailwindMerge } from 'tailwind-merge'

// Later classes win over earlier ones in the same group, so a className
// passed to a component can override its defaults (bg, text, display...).
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ['e1', 'e2', 'e3'] }],
      'font-size': [{ type: [(v: string) => /^(display|headline|title|body|label)-(lg|md|sm)$/.test(v)] }],
    },
  },
})

export function cn(...classes: Array<string | false | null | undefined>): string {
  return merge(classes.filter(Boolean).join(' '))
}
