import { useContext } from 'react'
import type { DbClient } from './client'
import { DbContext } from './DatabaseProvider'

export function useDb(): DbClient {
  const db = useContext(DbContext)
  if (!db) throw new Error('useDb must be used inside DatabaseProvider')
  return db
}
