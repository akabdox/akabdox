import { test } from 'node:test'
import assert from 'node:assert/strict'
import { breakdown, commissionFor, formatRate } from './commission.ts'

// Same cases as supabase/tests/smoke.sql, so the UI preview and the ledger agree.
test('matches the database rounding', () => {
  assert.equal(commissionFor(90000, 700), 6300)
  assert.equal(commissionFor(1, 5000), 1)
  assert.equal(commissionFor(149, 700), 10)
  assert.equal(commissionFor(0, 700), 0)
})

test('seller net is price minus commission', () => {
  assert.deepEqual(breakdown(50000, 700), { amount: 50000, commission: 3500, sellerNet: 46500 })
})

test('formats basis points as a percentage', () => {
  assert.equal(formatRate(700), '7%')
  assert.equal(formatRate(750), '7.5%')
})
