import type { Connection } from '~/core/types/entities';
import { IDBStorage } from '../base/IDBStorage';
import { CONNECTION_IDB } from '../idbRegistry';

class ConnectionStorage extends IDBStorage<Connection> {
  readonly name = 'connection';

  constructor() {
    super(CONNECTION_IDB);
  }

  async getAll(): Promise<Connection[]> {
    return this.getMany();
  }

  async getByWorkspaceId(wsId: string): Promise<Connection[]> {
    return this.getMany({ workspaceId: wsId } as Partial<Connection>);
  }
}

export const connectionStorage = new ConnectionStorage();
