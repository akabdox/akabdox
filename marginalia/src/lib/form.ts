export type ActionState = { error?: string; ok?: string } | null

export function field(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function optionalField(form: FormData, key: string): string | null {
  return field(form, key) || null
}

// Postgres errors raised with a message from our own functions are written
// for members; anything else is hidden behind a generic line.
export function friendlyError(error: { code?: string; message: string } | null): string {
  if (!error) return 'Something went wrong.'
  if (error.code === 'P0001') return error.message
  if (error.code === '23505') return 'That already exists.'
  if (error.code === '23514') return 'Some of those values are not allowed.'
  if (error.code === '42501') return 'You are not allowed to do that.'
  return 'Something went wrong. Try again.'
}
