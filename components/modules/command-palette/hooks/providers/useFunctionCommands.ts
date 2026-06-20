import type {
  CommandItem,
  CommandProvider,
} from '../../types/commandEngine.types';

const PREFIX = {
  key: 'f:',
  label: 'Functions',
  placeholder: 'Search functions...',
  icon: 'gravity-ui:function',
  iconClass: 'text-blue-400',
} as const;

export function useFunctionCommands(): CommandProvider {
  return {
    prefix: PREFIX,
    includeInGlobal: true,
    resolve(_query: string): CommandItem[] {
      return [];
    },
  };
}
