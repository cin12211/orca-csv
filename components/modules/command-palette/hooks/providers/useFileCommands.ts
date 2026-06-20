import type {
  CommandItem,
  CommandProvider,
} from '../../types/commandEngine.types';

const PREFIX = {
  key: '__file__',
  label: 'Files',
  placeholder: 'Search files...',
  icon: 'hugeicons:document-code',
} as const;

export function useFileCommands(): CommandProvider {
  return {
    prefix: PREFIX,
    includeInGlobal: true,
    resolve(_query: string): CommandItem[] {
      return [];
    },
  };
}
