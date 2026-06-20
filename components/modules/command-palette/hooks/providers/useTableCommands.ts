import type {
  CommandItem,
  CommandProvider,
} from '../../types/commandEngine.types';

const PREFIX = {
  key: 't:',
  label: 'Tables',
  placeholder: 'Search tables...',
  icon: 'hugeicons:grid-table',
  iconClass: 'text-yellow-400',
} as const;

export function useTableCommands(): CommandProvider {
  return {
    prefix: PREFIX,
    includeInGlobal: true,
    resolve(_query: string): CommandItem[] {
      return [];
    },
  };
}
