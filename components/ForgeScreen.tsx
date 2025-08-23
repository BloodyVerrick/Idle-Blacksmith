import React from 'react';
import { GameState, OreType, Item, ItemCategory } from '@/types';
import { GameAction } from '@/hooks/useGameState';
import { ITEMS } from '@/constants';

interface ForgeScreenProps {
    gameState: GameState;
    dispatch: React.Dispatch<GameAction>;
    onForge: (itemId: string) => void;
    onForgeAll: (itemId: string) => void;
}

const getEffectiveRecipe = (item: Item, gameState: GameState): Record<string, number> => {
    const hasFurnaceMKII = (gameState.upgrades['furnaceMKII'] || 0) > 0;
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

const ItemCard: React.FC<{
    item: Item,
    gameState: GameState,
    onForge: (itemId: string) => void,
    onForgeAll: (itemId: string) => void
}> = ({ item, gameState, onForge, onForgeAll }) => {
    const recipe = getEffectiveRecipe(item, gameState);
    
    const forgeableAmount = Math.min(
        ...Object.entries(recipe).map(([resourceId, required]) => {
            const isOre = Object.values(OreType).includes(resourceId as OreType);
            const available = isOre
                ? (gameState.ores[resourceId as OreType] || 0)
                : (gameState.inventory[resourceId] || 0);
            return Math.floor(available / (required as number));
        })
    );

    const canForge = forgeableAmount > 0;

    return (
        <div key={item.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex flex-col justify-between text-left">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{item.icon}</span>
                    <h3 className="text-xl font-bold text-white">{item.name}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3 h-10">{item.description}</p>
                <div>
                    <h4 className="font-semibold text-gray-300 mb-1">Recipe:</h4>
                    <ul className="text-sm">
                        {Object.entries(recipe).map(([resourceId, required]) => {
                            const isOre = Object.values(OreType).includes(resourceId as OreType);
                            const hasEnough = isOre
                                ? (gameState.ores[resourceId as OreType] || 0) >= required
                                : (gameState.inventory[resourceId] || 0) >= required;

                            const name = isOre ? resourceId : (ITEMS[resourceId]?.name || resourceId);
                            
                            return (
                                <li key={resourceId} className={`ml-4 list-disc ${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                                    {required} {name}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                    onClick={() => onForge(item.id)}
                    disabled={!canForge}
                    className="w-full py-2 px-2 font-bold rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed bg-orange-600 text-white hover:bg-orange-500 active:scale-95 text-sm"
                >
                    Forge
                </button>
                <button
                    onClick={() => onForgeAll(item.id)}
                    disabled={!canForge}
                    className="w-full py-2 px-2 font-bold rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed bg-orange-700 text-white hover:bg-orange-600 active:scale-95 text-sm"
                >
                    Forge All ({forgeableAmount})
                </button>
            </div>
        </div>
    );
}

const ForgeScreen: React.FC<ForgeScreenProps> = ({ gameState, onForge, onForgeAll }) => {
    const { maxOreTier } = gameState;
    const hasFurnace = (gameState.upgrades['furnace'] || 0) > 0;

    // Filter items based on the highest unlocked tier
    const availableItems = Object.values(ITEMS).filter(item => {
        // Special case for Bag of Coal to be always available
        if (item.id === 'bagOfCoal') return true;
        
        // Hide ingots if furnace is not unlocked
        if (item.id.endsWith('Ingot') && !hasFurnace) {
            return false;
        }

        // Show all items for unlocked tiers
        return item.tier !== -1 && item.tier <= maxOreTier;
    });

    const weapons = availableItems.filter(i => i.category === ItemCategory.WEAPON);
    const armors = availableItems.filter(i => i.category === ItemCategory.ARMOR);
    const tools = availableItems.filter(i => i.category === ItemCategory.TOOL);
    const materials = availableItems.filter(i => i.category === ItemCategory.MATERIAL);
    
    const hasToolsUnlocked = (gameState.upgrades['toolForge'] || 0) > 0;
    const hasArmorUnlocked = (gameState.upgrades['armorersTable'] || 0) > 0;

    return (
        <div className="text-center">
            <h2 className="text-3xl font-medieval text-orange-300 mb-2">The Forge</h2>
            <p className="text-gray-400 mb-6">Use your ore to craft valuable items.</p>
            
            <div className="space-y-8">
                {/* Weapons Section */}
                {weapons.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-medieval text-left text-orange-200 mb-4 border-b-2 border-gray-700 pb-2">Weapons</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {weapons.map(item => <ItemCard key={item.id} item={item} gameState={gameState} onForge={onForge} onForgeAll={onForgeAll} />)}
                        </div>
                    </div>
                )}

                {/* Armor Section */}
                {hasArmorUnlocked && armors.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-medieval text-left text-orange-200 mb-4 border-b-2 border-gray-700 pb-2">Armor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {armors.map(item => <ItemCard key={item.id} item={item} gameState={gameState} onForge={onForge} onForgeAll={onForgeAll} />)}
                        </div>
                    </div>
                )}


                {/* Tools Section */}
                {hasToolsUnlocked && tools.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-medieval text-left text-orange-200 mb-4 border-b-2 border-gray-700 pb-2">Tools</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tools.map(item => <ItemCard key={item.id} item={item} gameState={gameState} onForge={onForge} onForgeAll={onForgeAll} />)}
                        </div>
                    </div>
                )}
                
                {/* Materials Section */}
                {materials.length > 0 && (
                     <div>
                        <h3 className="text-2xl font-medieval text-left text-orange-200 mb-4 border-b-2 border-gray-700 pb-2">Materials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {materials.map(item => <ItemCard key={item.id} item={item} gameState={gameState} onForge={onForge} onForgeAll={onForgeAll} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgeScreen;