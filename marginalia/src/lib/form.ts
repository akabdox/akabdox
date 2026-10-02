import type { Dict } from '@/i18n/dictionaries'

export type ActionState = { error?: string; ok?: string } | null

export function field(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function optionalField(form: FormData, key: string): string | null {
  return field(form, key) || null
}

// Postgres errors raised with a message from our own functions are written
// for members and translated by their English text; anything else is hidden
// behind a generic line.
export function friendlyError(error: { code?: string; message: string } | null, t: Dict): string {
  if (!error) return t.form.unknown
  if (error.code === 'P0001') return t.db[error.message] ?? error.message
  if (error.code === '23505') return t.form.exists
  if (error.code === '23514') return t.form.notAllowedValues
  if (error.code === '42501') return t.form.forbidden
  return t.form.generic
}
