import { useReducer, Reducer } from 'react';
import { GameState, OreType, Item, ItemCategory } from '../types';
import { UPGRADES, ITEMS, ORE_TIERS } from '../constants';

const getInitialState = (): GameState => {
    const savedState = localStorage.getItem('blacksmithGameState');
    const defaultState: GameState = {
        gold: 0,
        ores: Object.values(OreType).reduce((acc, ore) => ({ ...acc, [ore]: 0 }), {} as Record<OreType, number>),
        inventory: {},
        currentOreTier: 0,
        maxOreTier: 0,
        orePerClick: 1,
        autoMinerRate: 0,
        upgrades: {},
        forgeSpeedMultiplier: 1,
        sellPriceMultiplier: 1,
        stats: {
            totalClicks: 0,
            totalGoldEarned: 0,
            totalGoldSpent: 0,
            itemsCrafted: {},
            itemsSold: {},
            goldFromItems: {},
        },
        miningProgress: Object.values(OreType).reduce((acc, ore) => ({ ...acc, [ore]: 0 }), {} as Record<OreType, number>),
        highestPickaxeTier: -1,
        lastActiveTime: Date.now(),
        lastSaveTime: Date.now(),
    };

    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            // Basic validation to ensure saved state isn't wildly different
            if (parsed.gold !== undefined && parsed.ores) {
                
                // MIGRATION: Remove Tin Pickaxe from saved states
                if (parsed.inventory?.tinPickaxe) {
                    delete parsed.inventory.tinPickaxe;
                }
                // MIGRATION: from forgedItemsCount to stats.itemsCrafted
                if (parsed.forgedItemsCount) {
                    if (!parsed.stats) {
                        parsed.stats = { totalClicks: 0, totalGoldEarned: 0, totalGoldSpent: 0, itemsCrafted: {}, itemsSold: {}, goldFromItems: {} };
                    }
                    parsed.stats.itemsCrafted = { ...parsed.stats.itemsCrafted, ...parsed.forgedItemsCount };
                    delete parsed.forgedItemsCount;
                }

                if (parsed.inventory?.tinPickaxe) {
                    delete parsed.inventory.tinPickaxe;
                }
                if (parsed.stats?.itemsCrafted?.tinPickaxe) {
                    delete parsed.stats.itemsCrafted.tinPickaxe;
                }
                
                // MIGRATION: Update 'betterAnvil' to 'Mystical Anvil' logic
                if (parsed.upgrades?.betterAnvil) {
                    parsed.upgrades.betterAnvil = 1; // Cap at 1 as it's no longer repeatable
                    delete parsed.forgeSpeedMultiplier; // Reset speed multiplier to default (1)
                }

                // MIGRATION: Rename adamantitePlate -> adamantiteChestplate
                if (parsed.inventory?.adamantitePlate) {
                    parsed.inventory.adamantiteChestplate = (parsed.inventory.adamantiteChestplate || 0) + parsed.inventory.adamantitePlate;
                    delete parsed.inventory.adamantitePlate;
                }
                if (parsed.stats?.itemsCrafted?.adamantitePlate) {
                    parsed.stats.itemsCrafted.adamantiteChestplate = (parsed.stats.itemsCrafted.adamantiteChestplate || 0) + parsed.stats.itemsCrafted.adamantitePlate;
                    delete parsed.stats.itemsCrafted.adamantitePlate;
                }
                
                // MIGRATION: Add highestPickaxeTier and miningProgress
                if (parsed.highestPickaxeTier === undefined) {
                    let maxTier = -1;
                    const itemsToCheck = parsed.stats?.itemsCrafted || {};
                    for (const itemId in itemsToCheck) {
                        if (itemId.includes('Pickaxe')) {
                            const item = ITEMS[itemId];
                            if (item && item.category === ItemCategory.TOOL) {
                                maxTier = Math.max(maxTier, item.tier);
                            }
                        }
                    }
                    parsed.highestPickaxeTier = maxTier;
                }
                if (parsed.miningProgress === undefined) {
                    parsed.miningProgress = Object.values(OreType).reduce((acc, ore) => ({ ...acc, [ore]: 0 }), {} as Record<OreType, number>);
                }
                if (parsed.lastActiveTime === undefined) {
                    parsed.lastActiveTime = Date.now();
                }

                // MIGRATION: Add stats object if it doesn't exist
                if (!parsed.stats) {
                    parsed.stats = defaultState.stats;
                } else {
                    parsed.stats = { ...defaultState.stats, ...parsed.stats };
                }


                // Ensure new fields from updates exist
                const state = { ...defaultState, ...parsed };

                // Ensure all ore types exist on loaded state
                Object.values(OreType).forEach(ore => {
                    if (state.ores[ore] === undefined) {
                        state.ores[ore] = 0;
                    }
                });
                
                if (typeof state.miningProgress !== 'object' || state.miningProgress === null) {
                    state.miningProgress = defaultState.miningProgress;
                }
                 Object.values(OreType).forEach(ore => {
                    if (state.miningProgress[ore] === undefined) {
                        state.miningProgress[ore] = 0;
                    }
                });

                if (typeof state.upgrades !== 'object' || state.upgrades === null) state.upgrades = {};
                 // Migrate from boolean upgrades to number-based
                Object.keys(state.upgrades).forEach(key => {
                    if(state.upgrades[key] === true) state.upgrades[key] = 1;
                    if(state.upgrades[key] === false) delete state.upgrades[key];
                });
                return state;
            }
        } catch (e) {
            console.error("Failed to parse saved game state, starting fresh.", e);
            return defaultState;
        }
    }
    return defaultState;
};

const getEffectiveRecipe = (item: Item, state: GameState): Record<string, number> => {
    const hasFurnaceMKII = (state.upgrades['furnaceMKII'] || 0) > 0;
    // Apply discount only to ingots
    if (hasFurnaceMKII && item.id.endsWith('Ingot')) {
        const newRecipe = { ...item.recipe };
        // Halve the cost of ore ingredients
        for (const resourceId in newRecipe) {
            if (Object.values(OreType).includes(resourceId as OreType)) {
                newRecipe[resourceId] = Math.ceil(newRecipe[resourceId] / 2);
            }
        }
        return newRecipe;
    }
    return item.recipe;
};

export enum GameActionType {
    MINE_ORE,
    AUTO_MINE,
    BUY_UPGRADE,
    FORGE_ITEM,
    SELL_ITEM,
    FORGE_ALL_ITEMS,
    SELL_ALL_ITEMS,
    SWITCH_ORE_TIER,
    APPLY_OFFLINE_PROGRESS,
    RESET_GAME
}

export type GameAction =
    | { type: GameActionType.MINE_ORE }
    | { type: GameActionType.AUTO_MINE }
    | { type: GameActionType.BUY_UPGRADE, payload: { upgradeId: string } }
    | { type: GameActionType.FORGE_ITEM, payload: { itemId: string } }
    | { type: GameActionType.SELL_ITEM, payload: { itemId: string } }
    | { type: GameActionType.FORGE_ALL_ITEMS, payload: { itemId: string } }
    | { type: GameActionType.SELL_ALL_ITEMS, payload: { itemId: string } }
    | { type: GameActionType.SWITCH_ORE_TIER, payload: { direction: 'up' | 'down' } }
    | { type: GameActionType.APPLY_OFFLINE_PROGRESS, payload: { oresGained: Record<string, number> } }
    | { type: GameActionType.RESET_GAME };

const gameStateReducer: Reducer<GameState, GameAction> = (state, action): GameState => {
    switch (action.type) {
        case GameActionType.MINE_ORE: {
            const currentOre = ORE_TIERS[state.currentOreTier];
            const clicksRequired = Math.max(1, 2 ** (state.currentOreTier - state.highestPickaxeTier));
            const newProgress = (state.miningProgress[currentOre] || 0) + 1;
            const newStats = { ...state.stats, totalClicks: state.stats.totalClicks + 1 };

            if (newProgress >= clicksRequired) {
                const newOres = {
                    ...state.ores,
                    [currentOre]: state.ores[currentOre] + state.orePerClick,
                };
                if (Math.random() < 0.15 && currentOre !== OreType.COAL) {
                    newOres[OreType.COAL] = (newOres[OreType.COAL] || 0) + 1;
                }
                return {
                    ...state,
                    ores: newOres,
                    miningProgress: { ...state.miningProgress, [currentOre]: 0 },
                    stats: newStats,
                };
            } else {
                return {
                    ...state,
                    miningProgress: { ...state.miningProgress, [currentOre]: newProgress },
                    stats: newStats,
                };
            }
        }
        case GameActionType.AUTO_MINE: {
            const currentOre = ORE_TIERS[state.currentOreTier];
            const clicksRequired = Math.max(1, 2 ** (state.currentOreTier - state.highestPickaxeTier));

            const newProgress = (state.miningProgress[currentOre] || 0) + 1;

            if (newProgress >= clicksRequired) {
                const newOres = {
                    ...state.ores,
                    [currentOre]: state.ores[currentOre] + state.orePerClick,
                };
                // Add a 15% chance to also get 1 coal when mining non-coal ores.
                if (Math.random() < 0.15 && currentOre !== OreType.COAL) {
                    newOres[OreType.COAL] = (newOres[OreType.COAL] || 0) + 1;
                }
                return {
                    ...state,
                    ores: newOres,
                    miningProgress: { ...state.miningProgress, [currentOre]: 0 },
                };
            } else {
                return {
                    ...state,
                    miningProgress: { ...state.miningProgress, [currentOre]: newProgress },
                };
            }
        }
        case GameActionType.BUY_UPGRADE: {
            const { upgradeId } = action.payload;
            const upgrade = UPGRADES[upgradeId];
            const currentTier = state.upgrades[upgradeId] || 0;

            // Pre-purchase validation
            if (upgrade.prereq && !(state.upgrades[upgrade.prereq] > 0)) {
                return state; // Prerequisite not met
            }
            if (!upgrade.repeatable && currentTier > 0) {
                return state; // Already purchased
            }
            if (upgrade.id === 'reinforcedPicks' && currentTier >= 3) {
                return state; // Max level reached
            }
             if (upgrade.id === 'offlineMining' && currentTier >= 5) {
                return state; // Max level for offline mining
            }

            const cost = typeof upgrade.cost === 'function' ? upgrade.cost(currentTier) : upgrade.cost;

            if (state.gold < cost) {
                return state; // Not enough gold
            }

            // Purchase logic
            const newUpgrades = { ...state.upgrades, [upgradeId]: currentTier + 1 };
            const newStats = { ...state.stats, totalGoldSpent: state.stats.totalGoldSpent + cost };
            let newState = {
                ...state,
                gold: state.gold - cost,
                upgrades: newUpgrades,
                stats: newStats,
            };

            // Apply the upgrade's primary effect
            newState = upgrade.apply(newState);

            // Handle specific aggregated effects
            if (upgrade.id === 'miner') {
                newState.autoMinerRate = newUpgrades.miner;
            }

            return newState;
        }
        case GameActionType.FORGE_ITEM:
        case GameActionType.FORGE_ALL_ITEMS: {
            const { itemId } = action.payload;
            const item = ITEMS[itemId];
            if (!item) return state;

            if (item.id.endsWith('Ingot') && !(state.upgrades.furnace > 0)) {
                return state; // Furnace is required to craft ingots.
            }

            const recipe = getEffectiveRecipe(item, state);

            let forgeableAmount = 1;
            if(action.type === GameActionType.FORGE_ALL_ITEMS) {
                forgeableAmount = Math.min(
                    ...Object.entries(recipe).map(([resourceId, required]) => {
                        const isOre = Object.values(OreType).includes(resourceId as OreType);
                        if (isOre) {
                            return Math.floor((state.ores[resourceId as OreType] || 0) / (required as number));
                        } else {
                            return Math.floor((state.inventory[resourceId] || 0) / (required as number));
                        }
                    })
                );
            }

            if (forgeableAmount <= 0) return state;
            
            const canForge = Object.entries(recipe).every(([resourceId, required]) => {
                const isOre = Object.values(OreType).includes(resourceId as OreType);
                const amountNeeded = (required as number); // Forge all calc is done above, here check for 1
                 if (action.type === GameActionType.FORGE_ALL_ITEMS) {
                     return true; // We already know we can forge this amount
                 }
                if (isOre) {
                    return (state.ores[resourceId as OreType] || 0) >= amountNeeded;
                } else {
                    return (state.inventory[resourceId] || 0) >= amountNeeded;
                }
            });

            if (!canForge) return state;

            const newOres = { ...state.ores };
            const newInventory = { ...state.inventory };

            Object.entries(recipe).forEach(([resourceId, required]) => {
                const amountToConsume = (required as number) * forgeableAmount;
                const isOre = Object.values(OreType).includes(resourceId as OreType);
                if(isOre) {
                    newOres[resourceId as OreType] -= amountToConsume;
                } else {
                    newInventory[resourceId] -= amountToConsume;
                    if (newInventory[resourceId] <= 0) delete newInventory[resourceId];
                }
            });
            
            // Mystical Anvil logic
            let itemsToAdd = forgeableAmount;
            const hasMysticalAnvil = (state.upgrades['betterAnvil'] || 0) > 0;
            if (hasMysticalAnvil && item.category === ItemCategory.WEAPON) {
                itemsToAdd *= 2;
            }

            newInventory[itemId] = (newInventory[itemId] || 0) + itemsToAdd;

            const newStats = {
                ...state.stats,
                itemsCrafted: {
                    ...state.stats.itemsCrafted,
                    [itemId]: (state.stats.itemsCrafted[itemId] || 0) + itemsToAdd
                }
            };

            // Check for new highest tier pickaxe
            let newHighestPickaxeTier = state.highestPickaxeTier;
            let newMiningProgress = state.miningProgress;
            if (item.category === ItemCategory.TOOL && item.id.includes('Pickaxe') && item.tier > state.highestPickaxeTier) {
                newHighestPickaxeTier = item.tier;
                // Reset all mining progress as difficulty has changed
                newMiningProgress = Object.values(OreType).reduce((acc, ore) => ({...acc, [ore]: 0}), {} as Record<OreType, number>);
            }

            return {
                ...state,
                ores: newOres,
                inventory: newInventory,
                stats: newStats,
                highestPickaxeTier: newHighestPickaxeTier,
                miningProgress: newMiningProgress,
            };
        }
        case GameActionType.SELL_ITEM: {
            const { itemId } = action.payload;
            const item = ITEMS[itemId];
            if (!item || !state.inventory[itemId] || state.inventory[itemId] < 1) {
                return state;
            }

            const newInventory = { ...state.inventory };
            newInventory[itemId] -= 1;
            if (newInventory[itemId] === 0) {
                delete newInventory[itemId];
            }

            const goldEarned = Math.round(item.sellPrice * state.sellPriceMultiplier);
            const newStats = {
                ...state.stats,
                totalGoldEarned: state.stats.totalGoldEarned + goldEarned,
                itemsSold: { ...state.stats.itemsSold, [itemId]: (state.stats.itemsSold[itemId] || 0) + 1 },
                goldFromItems: { ...state.stats.goldFromItems, [itemId]: (state.stats.goldFromItems[itemId] || 0) + goldEarned },
            };

            return {
                ...state,
                inventory: newInventory,
                gold: state.gold + goldEarned,
                stats: newStats,
            };
        }
        case GameActionType.SELL_ALL_ITEMS: {
            const { itemId } = action.payload;
            const item = ITEMS[itemId];
            const quantity = state.inventory[itemId];

            if (!item || !quantity || quantity < 1) {
                return state;
            }

            const newInventory = { ...state.inventory };
            delete newInventory[itemId];

            const goldEarned = Math.round(item.sellPrice * state.sellPriceMultiplier * quantity);
            const newStats = {
                ...state.stats,
                totalGoldEarned: state.stats.totalGoldEarned + goldEarned,
                itemsSold: { ...state.stats.itemsSold, [itemId]: (state.stats.itemsSold[itemId] || 0) + quantity },
                goldFromItems: { ...state.stats.goldFromItems, [itemId]: (state.stats.goldFromItems[itemId] || 0) + goldEarned },
            };

            return {
                ...state,
                inventory: newInventory,
                gold: state.gold + goldEarned,
                stats: newStats,
            };
        }
        case GameActionType.SWITCH_ORE_TIER: {
            const { direction } = action.payload;
            let newTier = state.currentOreTier;
            if (direction === 'up' && state.currentOreTier > 0) {
                newTier--;
            }
            if (direction === 'down' && state.currentOreTier < state.maxOreTier) {
                newTier++;
            }
            return { ...state, currentOreTier: newTier };
        }
        case GameActionType.APPLY_OFFLINE_PROGRESS: {
            const newOres = { ...state.ores };
            for (const ore in action.payload.oresGained) {
                newOres[ore as OreType] = (newOres[ore as OreType] || 0) + action.payload.oresGained[ore];
            }
            return { ...state, ores: newOres };
        }
        case GameActionType.RESET_GAME:
            localStorage.removeItem('blacksmithGameState');
            return getInitialState();

        default:
            return state;
    }
};

export const useGameState = () => {
    return useReducer(gameStateReducer, getInitialState());
};
