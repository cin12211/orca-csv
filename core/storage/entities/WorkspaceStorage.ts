import type { Workspace } from '~/core/types/entities';
import { IDBStorage } from '../base/IDBStorage';
import { WORKSPACE_IDB } from '../idbRegistry';

class WorkspaceStorage extends IDBStorage<Workspace> {
  readonly name = 'workspace';

  constructor() {
    super(WORKSPACE_IDB);
  }

  async getAll(): Promise<Workspace[]> {
    return this.getMany();
  }
}

export const workspaceStorage = new WorkspaceStorage();
