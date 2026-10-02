import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromAcceptLanguage } from './config.ts'

test('picks the most preferred supported language', () => {
  assert.equal(fromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8'), 'fr')
  assert.equal(fromAcceptLanguage('de-DE,en;q=0.5,ar;q=0.7'), 'ar')
  assert.equal(fromAcceptLanguage('en-US'), 'en')
})

test('returns null when nothing matches', () => {
  assert.equal(fromAcceptLanguage('de,it;q=0.8'), null)
  assert.equal(fromAcceptLanguage(null), null)
})
