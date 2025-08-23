import React from 'react';
import { GameState } from '../types';
import { GameAction } from '../hooks/useGameState';
import { ITEMS } from '../constants';
import { GiCoins } from 'react-icons/gi';

interface MarketScreenProps {
    gameState: GameState;
    dispatch: React.Dispatch<GameAction>;
    onSell: (itemId: string) => void;
    onSellAll: (itemId: string) => void;
}

const MarketScreen: React.FC<MarketScreenProps> = ({ gameState, onSell, onSellAll }) => {
    const inventoryItems = Object.keys(gameState.inventory).filter(itemId => {
        const item = ITEMS[itemId];
        return item && item.sellPrice > 0;
    });

    return (
        <div className="text-center">
            <h2 className="text-3xl font-medieval text-orange-300 mb-2">The Market</h2>
            <p className="text-gray-400 mb-6">Sell your crafted goods for gold.</p>

            {inventoryItems.length === 0 ? (
                <div className="p-10 bg-gray-900/50 rounded-lg border border-gray-700">
                    <p className="text-gray-400">Your inventory is empty. Forge some items to sell!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventoryItems.map(itemId => {
                        const item = ITEMS[itemId];
                        const quantity = gameState.inventory[itemId];
                        if (!item || quantity <= 0) return null;

                        const sellPrice = Math.round(item.sellPrice * gameState.sellPriceMultiplier);

                        return (
                            <div key={item.id} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-4xl">{item.icon}</span>
                                        <h3 className="text-xl font-bold text-white">{item.name}</h3>
                                    </div>
                                    <p className="text-lg text-gray-300">Owned: <span className="font-bold text-white">{quantity}</span></p>
                                    <div className="flex items-center justify-center gap-2 text-yellow-400 font-semibold text-lg my-2">
                                        <GiCoins />
                                        <span>{sellPrice} Gold</span>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => onSell(item.id)}
                                        className="w-full py-2 px-4 font-bold rounded-md transition-all duration-200 bg-green-600 text-white hover:bg-green-500 active:scale-95"
                                    >
                                        Sell One
                                    </button>
                                     <button
                                        onClick={() => onSellAll(item.id)}
                                        className="w-full py-2 px-4 font-bold rounded-md transition-all duration-200 bg-green-700 text-white hover:bg-green-600 active:scale-95"
                                    >
                                        Sell All ({quantity})
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MarketScreen;
