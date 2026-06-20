import type {
  CommandItem,
  CommandProvider,
} from '../../types/commandEngine.types';

const PREFIX = {
  key: 'erd:',
  label: 'ERD',
  placeholder: 'Open ERD for table...',
  icon: 'hugeicons:flowchart-01',
} as const;

export function useErdCommands(): CommandProvider {
  return {
    prefix: PREFIX,
    includeInGlobal: true,
    resolve(_query: string): CommandItem[] {
      return [];
    },
  };
}
