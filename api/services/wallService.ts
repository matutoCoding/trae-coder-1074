import { store, generateId } from '../data/store';
import type { Wall, DifficultyLevel, WallType } from '../../shared/types';

export const wallService = {
  getAllWalls: (): Wall[] => {
    return [...store.walls];
  },

  getWallById: (id: string): Wall | undefined => {
    return store.walls.find(w => w.id === id);
  },

  createWall: (data: Omit<Wall, 'id'>): Wall => {
    const wall: Wall = {
      ...data,
      id: generateId(),
    };
    store.walls.push(wall);
    return wall;
  },

  updateWall: (id: string, data: Partial<Omit<Wall, 'id'>>): Wall | undefined => {
    const index = store.walls.findIndex(w => w.id === id);
    if (index === -1) return undefined;
    store.walls[index] = { ...store.walls[index], ...data };
    return store.walls[index];
  },

  deleteWall: (id: string): boolean => {
    const index = store.walls.findIndex(w => w.id === id);
    if (index === -1) return false;
    store.walls.splice(index, 1);
    return true;
  },

  getWallsByDifficulty: (difficulty: DifficultyLevel): Wall[] => {
    return store.walls.filter(w => w.difficulty === difficulty && w.status === 'active');
  },

  getWallsByType: (type: WallType): Wall[] => {
    return store.walls.filter(w => w.type === type && w.status === 'active');
  },
};
