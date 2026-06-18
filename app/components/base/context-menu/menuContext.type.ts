export enum ContextMenuItemType {
  ACTION = 'action',
  LABEL = 'label',
  SEPARATOR = 'separator',
  SUBMENU = 'submenu',
}

export type ContextMenuItemAction = {
  title: string;
  icon: string;
  desc?: string;
  shortcut?: string;
  type: ContextMenuItemType.ACTION;
  select?: () => void;
  condition?: boolean;
  disabled?: boolean;
};

export type ContextMenuItemLabel = {
  title: string;
  icon?: string;
  type: ContextMenuItemType.LABEL;
  condition?: boolean;
};

export type ContextMenuItemSeparator = {
  type: ContextMenuItemType.SEPARATOR;
  condition?: boolean;
};

export type ContextMenuItemSubMenu = {
  title: string;
  icon?: string;
  desc?: string;
  type: ContextMenuItemType.SUBMENU;
  items: (
    | ContextMenuItemAction
    | ContextMenuItemLabel
    | ContextMenuItemSeparator
    | ContextMenuItemSubMenu
  )[];
  condition?: boolean;
  disabled?: boolean;
};

export type ContextMenuItem =
  | ContextMenuItemAction
  | ContextMenuItemLabel
  | ContextMenuItemSeparator
  | ContextMenuItemSubMenu;
