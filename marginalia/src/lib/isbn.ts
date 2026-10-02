import 'server-only'
import { createClient } from './supabase/server'

export type BookDetails = { title: string; author: string; year: number | null }

// Strips spaces and dashes. Valid input is 10 digits (last may be X) or 13 digits.
export function normalizeIsbn(raw: string): string | null {
  const isbn = raw.replace(/[\s-]/g, '').toUpperCase()
  return /^([0-9]{9}[0-9X]|[0-9]{13})$/.test(isbn) ? isbn : null
}

function yearOf(text: unknown): number | null {
  const match = typeof text === 'string' ? text.match(/\d{4}/) : null
  return match ? Number(match[0]) : null
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(4000), next: { revalidate: 60 * 60 * 24 * 30 } })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

// Fahrasa's own catalogue first: Algerian and Arabic editions are thin in the
// public databases, and every book a member types in is found here next time.
async function fromCatalogue(isbn: string): Promise<BookDetails | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('books').select('title, author, published_year').eq('isbn', isbn).maybeSingle()
  return data ? { title: data.title, author: data.author, year: data.published_year } : null
}

async function fromGoogle(isbn: string): Promise<BookDetails | null> {
  const body = (await getJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)) as {
    items?: { volumeInfo?: { title?: string; authors?: string[]; publishedDate?: string } }[]
  }
  const info = body.items?.[0]?.volumeInfo
  if (!info?.title || !info.authors?.length) return null
  return { title: info.title, author: info.authors.join(', '), year: yearOf(info.publishedDate) }
}

async function fromOpenLibrary(isbn: string): Promise<BookDetails | null> {
  const body = (await getJson(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)) as Record<
    string,
    { title?: string; authors?: { name: string }[]; publish_date?: string }
  >
  const info = body[`ISBN:${isbn}`]
  if (!info?.title || !info.authors?.length) return null
  return { title: info.title, author: info.authors.map((a) => a.name).join(', '), year: yearOf(info.publish_date) }
}

export async function findBook(isbn: string): Promise<BookDetails | null> {
  for (const source of [fromCatalogue, fromGoogle, fromOpenLibrary]) {
    try {
      const found = await source(isbn)
      if (found) return found
    } catch {
      // A source that is down or slow is skipped, not fatal.
    }
  }
  return null
}
