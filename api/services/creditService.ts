import { store, generateId, formatDate } from '../data/store';
import { teamLocks } from '../utils/lock';
import type { Team, CreditLog, CreditLogType } from '../../shared/types';

export const creditService = {
  getAllTeams: (): Team[] => {
    return [...store.teams];
  },

  getTeamById: (id: string): Team | undefined => {
    return store.teams.find(t => t.id === id);
  },

  createTeam: (name: string, initialCredits: number): Team => {
    const team: Team = {
      id: generateId(),
      name,
      totalCredits: initialCredits,
      usedCredits: 0,
      status: 'active',
      createdAt: formatDate(new Date()),
    };
    store.teams.push(team);
    
    const log: CreditLog = {
      id: generateId(),
      teamId: team.id,
      amount: initialCredits,
      type: 'recharge',
      description: '初始额度',
      createdAt: formatDate(new Date()),
    };
    store.creditLogs.push(log);
    
    return team;
  },

  getTeamCredits: (teamId: string): { total: number; used: number; available: number } | undefined => {
    const team = store.teams.find(t => t.id === teamId);
    if (!team) return undefined;
    return {
      total: team.totalCredits,
      used: team.usedCredits,
      available: team.totalCredits - team.usedCredits,
    };
  },

  rechargeCredits: async (teamId: string, amount: number, description: string = '充值'): Promise<Team | undefined> => {
    const release = await teamLocks.acquire(teamId);
    try {
      const team = store.teams.find(t => t.id === teamId);
      if (!team) return undefined;
      
      team.totalCredits += amount;
      
      const log: CreditLog = {
        id: generateId(),
        teamId,
        amount,
        type: 'recharge',
        description,
        createdAt: formatDate(new Date()),
      };
      store.creditLogs.push(log);
      
      return team;
    } finally {
      release();
    }
  },

  deductCredits: async (
    teamId: string, 
    amount: number, 
    bookingId?: string, 
    description: string = '预约消费'
  ): Promise<boolean> => {
    const release = await teamLocks.acquire(teamId);
    try {
      const team = store.teams.find(t => t.id === teamId);
      if (!team) return false;
      
      const available = team.totalCredits - team.usedCredits;
      if (available < amount) {
        return false;
      }
      
      team.usedCredits += amount;
      
      const log: CreditLog = {
        id: generateId(),
        teamId,
        amount,
        type: 'consume',
        bookingId,
        description,
        createdAt: formatDate(new Date()),
      };
      store.creditLogs.push(log);
      
      return true;
    } finally {
      release();
    }
  },

  refundCredits: async (
    teamId: string, 
    amount: number, 
    bookingId?: string, 
    description: string = '退订退款'
  ): Promise<boolean> => {
    const release = await teamLocks.acquire(teamId);
    try {
      const team = store.teams.find(t => t.id === teamId);
      if (!team) return false;
      
      if (team.usedCredits < amount) {
        team.usedCredits = 0;
      } else {
        team.usedCredits -= amount;
      }
      
      const log: CreditLog = {
        id: generateId(),
        teamId,
        amount,
        type: 'refund',
        bookingId,
        description,
        createdAt: formatDate(new Date()),
      };
      store.creditLogs.push(log);
      
      return true;
    } finally {
      release();
    }
  },

  getCreditLogs: (teamId: string, limit: number = 50): CreditLog[] => {
    return store.creditLogs
      .filter(log => log.teamId === teamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },

  getAllCreditLogs: (limit: number = 100): CreditLog[] => {
    return [...store.creditLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  },
};
