const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Route params are user input; reject anything Postgres would choke on.
export function isUuid(value: string): boolean {
  return pattern.test(value)
}
