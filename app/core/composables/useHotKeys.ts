import { useActiveElement } from '@vueuse/core';
import { onMounted, onUnmounted, ref, watch, type Ref, isRef } from 'vue';

type ModKey = 'ctrl' | 'shift' | 'alt' | 'meta' | 'cmd' | 'mod';
type Letter =
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  | ',' | '.';
type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
type Special =
  | 'enter' | 'escape' | 'space' | 'tab' | 'backspace' | 'delete'
  | 'arrowup' | 'arrowdown' | 'arrowleft' | 'arrowright'
  | `f${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;
type MainKey = Letter | Digit | Special;

type HotkeyTemplate =
  | `${MainKey}`
  | `${ModKey}+${MainKey}`
  | `${ModKey}+${ModKey}+${MainKey}`;

export interface Hotkey {
  key: HotkeyTemplate;
  callback: (e: KeyboardEvent) => void;
  isPreventDefault?: boolean;
  excludeInput?: boolean;
}

const MODIFIERS = ['ctrl', 'shift', 'alt', 'meta', 'cmd', 'mod'] as const;

const matchHotkey = (e: KeyboardEvent, template: string): boolean => {
  const parts = template.toLowerCase().replace(/\s+/g, '').split('+');
  const want = {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.some(p => p === 'meta' || p === 'cmd' || p === 'mod'),
  };
  const main = parts.find(p => !MODIFIERS.includes(p as any)) ?? '';
  const hitMain = main ? e.key.toLowerCase() === main : true;

  return (
    hitMain &&
    e.ctrlKey === want.ctrl &&
    e.shiftKey === want.shift &&
    e.altKey === want.alt &&
    e.metaKey === want.meta
  );
};

export function useHotkeys(
  hotkeys: ReadonlyArray<Hotkey> | Ref<ReadonlyArray<Hotkey>>,
  {
    target = window,
    isPreventDefault = false,
  }: {
    target?: Window | HTMLElement | Ref<HTMLElement | undefined>;
    isPreventDefault?: boolean;
  } = {
    target: window,
    isPreventDefault: true,
  }
): void {
  const activeElement = useActiveElement();
  const isEventInsideInput = computed(() => {
    return (
      activeElement.value?.tagName === 'INPUT' ||
      activeElement.value?.tagName === 'TEXTAREA'
    );
  });

  const hotkeysRef: Ref<ReadonlyArray<Hotkey>> = isRef(hotkeys)
    ? hotkeys
    : ref(hotkeys);

  const getTarget = (): Window | HTMLElement | undefined =>
    isRef(target) ? target.value : target;

  const handler = (e: KeyboardEvent) => {
    for (const hk of hotkeysRef.value) {
      if (matchHotkey(e, hk.key)) {
        const isExcluded = hk.excludeInput && isEventInsideInput.value;

        if (isExcluded) {
          return;
        }

        if (isPreventDefault || hk.isPreventDefault) {
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();
        }
        hk.callback(e);
        break;
      }
    }
  };

  const attach = () =>
    getTarget()?.addEventListener('keydown', handler as EventListener);
  const detach = () =>
    getTarget()?.removeEventListener('keydown', handler as EventListener);

  onMounted(attach);
  onUnmounted(detach);

  onActivated(attach);
  onDeactivated(detach);

  watch(
    [hotkeysRef, () => (isRef(target) ? target.value : target)],
    () => {
      detach();
      attach();
    },
    { flush: 'post' }
  );
}
