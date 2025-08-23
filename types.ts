import React from 'react';

export enum Screen {
  MINING = 'Mining',
  FORGE = 'Forge',
  MARKET = 'Market',
  UPGRADES = 'Upgrades'
}

export enum OreType {
  STONE = 'Stone',
  COAL = 'Coal',
  COPPER = 'Copper',
  TIN = 'Tin',
  BRONZE = 'Bronze',
  IRON = 'Iron',
  GOLD = 'Gold',
  MYTHRIL = 'Mythril',
  ADAMANTITE = 'Adamantite'
}

export enum ItemCategory {
    WEAPON = 'Weapon',
    ARMOR = 'Armor',
    TOOL = 'Tool',
    MATERIAL = 'Material',
}

export interface Item {
  id: string;
  name: string;
  description: string;
  recipe: Record<string, number>;
  sellPrice: number;
  icon: React.ReactNode;
  category: ItemCategory;
  tier: number;
}

export interface PlayerStats {
  totalClicks: number;
  totalGoldEarned: number;
  totalGoldSpent: number;
  itemsCrafted: Record<string, number>;
  itemsSold: Record<string, number>;
  goldFromItems: Record<string, number>;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number | ((currentTier: number) => number);
  prereq?: string;
  repeatable?: boolean;
  maxTiers?: number;
  apply: (state: GameState) => GameState;
  icon: React.ReactNode;
}

export interface GameState {
  gold: number;
  ores: Record<OreType, number>;
  inventory: Record<string, number>;
  currentOreTier: number; // index of ORE_TIERS
  maxOreTier: number; // highest unlocked tier index
  orePerClick: number;
  autoMinerRate: number; // Clicks per second
  upgrades: Record<string, number>; // Changed to number for repeatable upgrades
  forgeSpeedMultiplier: number;
  sellPriceMultiplier: number;
  miningProgress: Record<OreType, number>;
  highestPickaxeTier: number;
  lastActiveTime: number; // For offline progress
  lastSaveTime: number; // For offline progress
  stats: PlayerStats;
}

export interface ClickData {
  id: number;
  x: number;
  y: number;
  value: string;
}