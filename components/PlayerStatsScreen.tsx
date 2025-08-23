import { GameState } from '@/types';
import { ITEMS, UPGRADES } from '@/constants';

interface PlayerStatsScreenProps {
    gameState: GameState;
    onClose: () => void;
}

const PlayerStatsScreen: React.FC<PlayerStatsScreenProps> = ({ gameState, onClose }) => {
    const { stats, upgrades } = gameState;

    const getFavoriteItem = (record: Record<string, number>): [string, number] | null => {
        const entries = Object.entries(record);
        if (entries.length === 0) return null;
        return entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    };

    const favoriteCraftedItem = getFavoriteItem(stats.itemsCrafted);
    const mostSoldItem = getFavoriteItem(stats.itemsSold);
    const mostProfitableItem = getFavoriteItem(stats.goldFromItems);

    const acquiredUpgrades = Object.entries(upgrades).filter(([, tier]) => tier > 0);
    const maxedUpgrades = acquiredUpgrades.filter(([id, tier]) => {
        const upgrade = UPGRADES[id];
        if (!upgrade) return false;
        if (upgrade.repeatable && upgrade.maxTiers) {
            return tier >= upgrade.maxTiers;
        }
        return !upgrade.repeatable && tier > 0;
    });

    const StatCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">{title}</h3>
            <div className="text-gray-300">{children}</div>
        </div>
    );

    const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
        <p><span className="font-semibold text-gray-400">{label}:</span> {value}</p>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-900 text-white p-6 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative border-2 border-yellow-500">
                <h2 className="text-3xl font-bold mb-6 text-center text-yellow-500">Player Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Core Stats">
                        <StatItem label="Total Clicks" value={stats.totalClicks.toLocaleString()} />
                        <StatItem label="Gold Earned" value={stats.totalGoldEarned.toLocaleString()} />
                        <StatItem label="Gold Spent" value={stats.totalGoldSpent.toLocaleString()} />
                    </StatCard>

                    <StatCard title="Crafting">
                        <StatItem label="Total Items Crafted" value={Object.values(stats.itemsCrafted).reduce((a, b) => a + b, 0).toLocaleString()} />
                        {favoriteCraftedItem && <StatItem label="Favorite Item" value={`${ITEMS[favoriteCraftedItem[0]]?.name} (${favoriteCraftedItem[1].toLocaleString()})`} />}
                    </StatCard>

                    <StatCard title="Sales">
                        <StatItem label="Total Items Sold" value={Object.values(stats.itemsSold).reduce((a, b) => a + b, 0).toLocaleString()} />
                        {mostSoldItem && <StatItem label="Most Sold Item" value={`${ITEMS[mostSoldItem[0]]?.name} (${mostSoldItem[1].toLocaleString()})`} />}
                        {mostProfitableItem && <StatItem label="Most Profitable Item" value={`${ITEMS[mostProfitableItem[0]]?.name} (${mostProfitableItem[1].toLocaleString()} gold)`} />}
                    </StatCard>

                    <StatCard title="Upgrades">
                        <StatItem label="Acquired" value={`${acquiredUpgrades.length} / ${Object.keys(UPGRADES).length}`} />
                        <StatItem label="Maxed Out" value={`${maxedUpgrades.length}`} />
                    </StatCard>
                </div>

                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full transition duration-300"
                >
                    X
                </button>
            </div>
        </div>
    );
};

export default PlayerStatsScreen;
