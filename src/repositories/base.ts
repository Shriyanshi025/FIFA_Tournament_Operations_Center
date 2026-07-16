/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReadRepository<T, ID = string> {
  getById(id: ID): Promise<T | null>;
  getAll(): Promise<T[]>;
  find(filter: (item: T) => boolean): Promise<T[]>;
}

export interface WriteRepository<T, ID = string> {
  create(item: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: ID }): Promise<T>;
  update(id: ID, item: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
}

export interface Repository<T, ID = string> extends ReadRepository<T, ID>, WriteRepository<T, ID> {}
