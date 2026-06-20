import {
  idbGetAll,
  idbReplaceAll,
} from '~/core/persist/adapters/idb/primitives';
import type { PersistCollection } from '~/core/storage/idbRegistry';

export type GetAll = <T>(collection: PersistCollection) => Promise<T[]>;
export type ReplaceAll = <T extends { id: string }>(
  collection: PersistCollection,
  values: T[]
) => Promise<void>;

export function getPlatformOps(): { getAll: GetAll; replaceAll: ReplaceAll } {
  return { getAll: idbGetAll, replaceAll: idbReplaceAll };
}
