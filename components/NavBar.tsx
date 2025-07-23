
import React from 'react';
import { Screen, GameState, OreType } from '../types';
import { ORE_ICONS, ORE_TIERS } from '../constants';
import { GiCoins } from 'react-icons/gi';

interface NavBarProps {
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;
    gameState: GameState;
}

const NavButton: React.FC<{
    screen: Screen;
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;
    children: React.ReactNode;
}> = ({ screen, activeScreen, setActiveScreen, children }) => {
    const isActive = activeScreen === screen;
    const baseClasses = "px-4 py-3 text-sm sm:text-base font-bold transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50";
    const activeClasses = "bg-orange-500 text-white shadow-inner shadow-orange-900/50 scale-105";
    const inactiveClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white";

    return (
        <button
            onClick={() => setActiveScreen(screen)}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {children}
        </button>
    );
};

const NavBar: React.FC<NavBarProps> = ({ activeScreen, setActiveScreen, gameState }) => {
    const currentOreType = ORE_TIERS[gameState.currentOreTier];
    const currentOreCount = gameState.ores[currentOreType];
    const coalCount = gameState.ores[OreType.COAL] || 0;

    return (
        <nav className="bg-gray-900/50">
            <div className="grid grid-cols-2 sm:grid-cols-4">
                <NavButton screen={Screen.MINING} activeScreen={activeScreen} setActiveScreen={setActiveScreen}>Mining</NavButton>
                <NavButton screen={Screen.FORGE} activeScreen={activeScreen} setActiveScreen={setActiveScreen}>Forge</NavButton>
                <NavButton screen={Screen.MARKET} activeScreen={activeScreen} setActiveScreen={setActiveScreen}>Market</NavButton>
                <NavButton screen={Screen.UPGRADES} activeScreen={activeScreen} setActiveScreen={setActiveScreen}>Upgrades</NavButton>
            </div>
            <div className="flex justify-around items-center p-2 bg-gray-900 border-t border-b border-gray-700 text-sm sm:text-base">
                <div className="flex items-center gap-2 font-semibold text-yellow-400">
                    <GiCoins className="w-6 h-6" />
                    <span>{Math.floor(gameState.gold)}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-300">
                    <span className="text-2xl">{ORE_ICONS[currentOreType]}</span>
                    <span>{Math.floor(currentOreCount)} {currentOreType}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-300">
                    <span className="text-2xl">{ORE_ICONS[OreType.COAL]}</span>
                    <span>{Math.floor(coalCount)} {OreType.COAL}</span>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
