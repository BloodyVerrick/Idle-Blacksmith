import React from 'react';
import { GameState, Upgrade } from '@/types';
import { UPGRADES } from '@/constants';
import { formatNumber } from '@/utils';

interface UpgradesScreenProps {
    gameState: GameState;
    onBuyUpgrade: (upgradeId: string) => void;
}

const UpgradesScreen: React.FC<UpgradesScreenProps> = ({ gameState, onBuyUpgrade }) => {

    const getUpgradeCost = (upgrade: Upgrade, currentTier: number) => {
        return typeof upgrade.cost === 'function' ? upgrade.cost(currentTier) : upgrade.cost;
    };

    const isMaxLevel = (upgrade: Upgrade, currentTier: number) => {
        if (upgrade.id === 'reinforcedPicks') return currentTier >= 3;
        if (upgrade.id === 'offlineMining') return currentTier >= 5;
        return !upgrade.repeatable && currentTier > 0;
    };

    return (
        <div className="text-center">
            <h2 className="text-3xl font-medieval text-orange-300 mb-2">Upgrades</h2>
            <p className="text-gray-400 mb-6">Invest your gold to improve your efficiency.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(UPGRADES)
                    .filter(upgrade => {
                        const currentTier = gameState.upgrades[upgrade.id] || 0;
                        return !isMaxLevel(upgrade, currentTier);
                    })
                    .map(upgrade => {
                    const currentTier = gameState.upgrades[upgrade.id] || 0;
                    const cost = getUpgradeCost(upgrade, currentTier);
                    const canAfford = gameState.gold >= cost;
                    const isLocked = upgrade.prereq && !(gameState.upgrades[upgrade.prereq] > 0);
                    const maxed = isMaxLevel(upgrade, currentTier);

                    if (isLocked) return null;

                    let description = upgrade.description;
                    if (upgrade.id === 'offlineMining') {
                        const percentage = Math.min((currentTier + 1) * 10, 50);
                        description = `Earn ${percentage}% of ores from auto-miners while offline. Max 5 tiers.`
                    }

                    return (
                        <div key={upgrade.id} className={`bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex flex-col justify-between text-left ${!canAfford && !maxed ? 'opacity-50' : ''} ${maxed ? 'border-green-500/50' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-4xl text-orange-400">{upgrade.icon}</span>
                                        <h3 className="text-xl font-bold text-white">
                                            {upgrade.name} 
                                            {upgrade.repeatable && currentTier > 0 && <span className="text-lg text-gray-400 font-normal">- Tier {currentTier}</span>}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-3 h-12">{description}</p>
                                </div>
                                <button 
                                    onClick={() => onBuyUpgrade(upgrade.id)} 
                                    disabled={!canAfford || maxed}
                                    className="w-full mt-4 py-2 px-4 font-bold rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed bg-orange-600 text-white hover:bg-orange-500 active:scale-95"
                                >
                                    {maxed ? 'Max Tier' : `Cost: ${formatNumber(cost)} G`}
                                </button>
                            </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpgradesScreen;