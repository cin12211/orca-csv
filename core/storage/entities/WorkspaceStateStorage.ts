import type { WorkspaceState } from '~/core/types/entities';
import { IDBStorage } from '../base/IDBStorage';
import { WORKSPACE_STATE_IDB } from '../idbRegistry';

class WorkspaceStateStorage extends IDBStorage<WorkspaceState> {
  readonly name = 'workspaceState';

  constructor() {
    super(WORKSPACE_STATE_IDB);
  }

  async getAll(): Promise<WorkspaceState[]> {
    return this.getMany();
  }
}

export const workspaceStateStorage = new WorkspaceStateStorage();
