import { useContext } from 'react';
import { DbContext } from './DatabaseProvider';
import type { DbClient } from './client';

export function useDb(): DbClient {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb must be used inside DatabaseProvider');
  return db;
}
