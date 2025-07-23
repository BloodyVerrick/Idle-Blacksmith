import React from 'react';
import { GameState, OreType } from '../types';
import { GameAction } from '../hooks/useGameState';
import { UPGRADES, ORE_TIERS } from '../constants';
import { GiCoins } from 'react-icons/gi';

interface UpgradesScreenProps {
    gameState: GameState;
    dispatch: React.Dispatch<GameAction>;
    onUpgrade: (upgradeId: string) => void;
}

const UpgradesScreen: React.FC<UpgradesScreenProps> = ({ gameState, onUpgrade }) => {
    return (
        <div className="text-center">
            <h2 className="text-3xl font-medieval text-orange-300 mb-2">The Workshop</h2>
            <p className="text-gray-400 mb-6">Invest your gold in powerful upgrades.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(UPGRADES).map(upgrade => {
                    const currentLevel = gameState.upgrades[upgrade.id] || 0;
                    const isPurchased = currentLevel > 0;

                    // Special condition for Armorer's Table
                    if (upgrade.id === 'armorersTable') {
                        const copperSwordsForged = gameState.forgedItemsCount?.['copperSword'] || 0;
                        if (copperSwordsForged < 100) {
                            return null; // Don't show the upgrade until the requirement is met
                        }
                    }

                    // Special condition for Furnace upgrades
                    if (upgrade.id === 'furnace' || upgrade.id === 'furnaceMKII') {
                        const copperTierIndex = ORE_TIERS.indexOf(OreType.COPPER);
                        if (gameState.maxOreTier < copperTierIndex) {
                            return null;
                        }
                    }

                    let cost = upgrade.cost;
                    if (upgrade.repeatable) {
                        if (upgrade.id === 'reinforcedPicks') {
                            cost = upgrade.cost * Math.pow(2, currentLevel);
                        } else {
                            cost = Math.floor(upgrade.cost * Math.pow(1.15, currentLevel));
                        }
                    }

                    const canAfford = gameState.gold >= cost;
                    const prereqMet = !upgrade.prereq || (gameState.upgrades[upgrade.prereq] || 0) > 0;
                    
                    if (!prereqMet) return null;
                    
                    const isMaxLevel = upgrade.id === 'reinforcedPicks' && currentLevel >= 3;
                    const isDisabled = (!upgrade.repeatable && isPurchased) || !canAfford || isMaxLevel;
                    
                    let buttonText = 'Buy';
                    if (isMaxLevel) {
                        buttonText = 'Max Level';
                    } else if (!canAfford) {
                        buttonText = 'Not enough gold';
                    } else if (!upgrade.repeatable && isPurchased) {
                        buttonText = 'Purchased';
                    }


                    return (
                        <div key={upgrade.id} className={`bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex flex-col justify-between transition-opacity duration-300 ${isMaxLevel || (!upgrade.repeatable && isPurchased) ? 'opacity-50' : 'opacity-100'}`}>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-4xl text-orange-400">{upgrade.icon}</span>
                                    <h3 className="text-xl font-bold text-white">{upgrade.name}</h3>
                                </div>
                                <p className="text-sm text-gray-400 mb-1 h-10">{upgrade.description}</p>
                                {upgrade.repeatable && upgrade.id !== 'reinforcedPicks' && (
                                    <p className="text-sm text-gray-300 mb-2">Owned: <span className="font-bold text-white">{currentLevel}</span></p>
                                )}
                                {upgrade.id === 'reinforcedPicks' && (
                                     <p className="text-sm text-gray-300 mb-2">Level: <span className="font-bold text-white">{currentLevel} / 3</span></p>
                                )}
                                <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold text-lg my-2">
                                    <GiCoins />
                                    <span>{cost} Gold</span>
                                </div>
                            </div>
                            <button
                                onClick={() => onUpgrade(upgrade.id)}
                                disabled={isDisabled}
                                className="mt-4 w-full py-2 px-4 font-bold rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-500 active:scale-95"
                            >
                                {buttonText}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpgradesScreen;