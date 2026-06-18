import { store, generateId } from '../data/store';
import type { ActivityPackage } from '../../shared/types';

export const packageService = {
  getAllPackages: (): ActivityPackage[] => {
    return [...store.packages];
  },

  getActivePackages: (): ActivityPackage[] => {
    return store.packages.filter(p => p.status === 'active');
  },

  getPackageById: (id: string): ActivityPackage | undefined => {
    return store.packages.find(p => p.id === id);
  },

  createPackage: (data: Omit<ActivityPackage, 'id'>): ActivityPackage => {
    const pkg: ActivityPackage = {
      ...data,
      id: generateId(),
    };
    store.packages.push(pkg);
    return pkg;
  },

  updatePackage: (id: string, data: Partial<Omit<ActivityPackage, 'id'>>): ActivityPackage | undefined => {
    const index = store.packages.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    store.packages[index] = { ...store.packages[index], ...data };
    return store.packages[index];
  },

  deletePackage: (id: string): boolean => {
    const index = store.packages.findIndex(p => p.id === id);
    if (index === -1) return false;
    store.packages.splice(index, 1);
    return true;
  },
};
