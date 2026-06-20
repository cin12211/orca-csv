import type {
  CommandItem,
  CommandProvider,
} from '../../types/commandEngine.types';

const PREFIX = {
  key: 'v:',
  label: 'Views',
  placeholder: 'Search views...',
  icon: 'hugeicons:property-view',
  iconClass: 'text-green-700',
} as const;

export function useViewCommands(): CommandProvider {
  return {
    prefix: PREFIX,
    includeInGlobal: true,
    resolve(_query: string): CommandItem[] {
      return [];
    },
  };
}
