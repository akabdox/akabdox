import type { Locale } from '../config'
import { ar } from './ar'
import { en, type Dict } from './en'
import { fr } from './fr'

export type { Dict }
export const dictionaries: Record<Locale, Dict> = { ar, fr, en }
