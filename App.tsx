import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameState, GameActionType } from './hooks/useGameState';
import { Screen } from './types';
import NavBar from './components/NavBar';
import MiningScreen from './components/MiningScreen';
import ForgeScreen from './components/ForgeScreen';
import MarketScreen from './components/MarketScreen';
import UpgradesScreen from './components/UpgradesScreen';
import PlayerStatsScreen from './components/PlayerStatsScreen';
import SoundManager from './components/SoundManager';
import SettingsMenu from './components/SettingsMenu';
import { FaCog } from 'react-icons/fa';
import { ORE_TIERS } from './constants';

const App: React.FC = () => {
  const [gameState, dispatch] = useGameState();
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.MINING);
  const [lastSound, setLastSound] = useState<{name: string, time: number} | null>(null);
  const [showStatsScreen, setShowStatsScreen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const playSound = useCallback((soundName: string) => {
    setLastSound({ name: soundName, time: Date.now() });
  }, []);

  const handleMine = useCallback(() => {
    dispatch({ type: GameActionType.MINE_ORE });
    playSound('mine');
  }, [dispatch, playSound]);

  const playForgeSound = useCallback((itemId: string) => {
    if (itemId === 'bagOfCoal') {
        playSound('bagging');
    } else if (itemId === 'tinCan') {
        playSound('canning');
    } else {
        playSound('forge');
    }
  }, [playSound]);

  const handleForge = useCallback((itemId: string) => {
    dispatch({ type: GameActionType.FORGE_ITEM, payload: { itemId } });
    playForgeSound(itemId);
  }, [dispatch, playForgeSound]);
  
  const handleForgeAll = useCallback((itemId: string) => {
    dispatch({ type: GameActionType.FORGE_ALL_ITEMS, payload: { itemId } });
    playForgeSound(itemId);
  }, [dispatch, playForgeSound]);

  const handleSell = useCallback((itemId: string) => {
    dispatch({ type: GameActionType.SELL_ITEM, payload: { itemId } });
    playSound('sell');
  }, [dispatch, playSound]);

  const handleSellAll = useCallback((itemId: string) => {
    dispatch({ type: GameActionType.SELL_ALL_ITEMS, payload: { itemId } });
    playSound('sell');
  }, [dispatch, playSound]);

  const handleUpgrade = useCallback((upgradeId: string) => {
    dispatch({ type: GameActionType.BUY_UPGRADE, payload: { upgradeId } });
    playSound('upgrade');
  }, [dispatch, playSound]);
  
  const handleSwitchTier = useCallback((direction: 'up' | 'down') => {
    dispatch({ type: GameActionType.SWITCH_ORE_TIER, payload: { direction } });
    playSound('mine'); // Re-use mine sound for tier switching
  }, [dispatch, playSound]);

  const handleResetGame = useCallback(() => {
    dispatch({ type: GameActionType.RESET_GAME });
    playSound('upgrade'); // Re-use upgrade sound for reset
  }, [dispatch, playSound]);

  // Offline progress calculation
  useEffect(() => {
    const offlineTimeInSeconds = (Date.now() - gameState.lastActiveTime) / 1000;

    if (offlineTimeInSeconds > 60 && gameState.autoMinerRate > 0 && (gameState.upgrades.offlineMining || 0) > 0) {
        const offlineMiningTier = gameState.upgrades.offlineMining || 0;
        const offlinePercentage = Math.min(0.5, offlineMiningTier * 0.1);

        const clicksRequired = Math.max(1, 2 ** (gameState.currentOreTier - gameState.highestPickaxeTier));
        const orePerSecond = (gameState.autoMinerRate / clicksRequired) * gameState.orePerClick;
        const potentialOres = orePerSecond * offlineTimeInSeconds;
        const earnedOres = Math.floor(potentialOres * offlinePercentage);

        if (earnedOres > 0) {
            const currentOreType = ORE_TIERS[gameState.currentOreTier];
            const oresGained = { [currentOreType]: earnedOres };
            dispatch({ type: GameActionType.APPLY_OFFLINE_PROGRESS, payload: { oresGained } });

            const timeAway = offlineTimeInSeconds > 3600
                ? `${(offlineTimeInSeconds / 3600).toFixed(1)} hours`
                : `${(offlineTimeInSeconds / 60).toFixed(1)} minutes`;
            
            alert(`Welcome back! While you were away for ${timeAway}, your miners gathered ${earnedOres} ${currentOreType}!`);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on initial load

  // Game loop for auto-miners
  useEffect(() => {
    if (gameState.autoMinerRate > 0) {
      const interval = setInterval(() => {
        dispatch({ type: GameActionType.AUTO_MINE });
      }, 1000 / gameState.autoMinerRate);

      return () => clearInterval(interval);
    }
  }, [gameState.autoMinerRate, dispatch]);

  const screenComponent = useMemo(() => {
    const screenProps = { gameState, dispatch };
    switch (activeScreen) {
      case Screen.MINING:
        return <MiningScreen {...screenProps} onMine={handleMine} onSwitchTier={handleSwitchTier} />;
      case Screen.FORGE:
        return <ForgeScreen {...screenProps} onForge={handleForge} onForgeAll={handleForgeAll} />;
      case Screen.MARKET:
        return <MarketScreen {...screenProps} onSell={handleSell} onSellAll={handleSellAll} />;
      case Screen.UPGRADES:
        return <UpgradesScreen gameState={gameState} onBuyUpgrade={handleUpgrade} />;
      default:
        return <MiningScreen {...screenProps} onMine={handleMine} onSwitchTier={handleSwitchTier} />;
    }
  }, [activeScreen, gameState, handleMine, handleForge, handleSell, handleUpgrade, dispatch, handleForgeAll, handleSellAll, handleSwitchTier]);
  
  // Auto-saving logic
  const saveGame = useCallback(() => {
    const stateToSave = { ...gameState, lastActiveTime: Date.now() };
    try {
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem('blacksmithGameState', serializedState);
    } catch (err) {
        console.error("Could not save game state", err);
    }
  }, [gameState]);

  useEffect(() => {
    // Debounced save during active play
    const handler = setTimeout(saveGame, 1000); // Save every second

    // Save immediately when the tab becomes hidden or is closed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveGame();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', saveGame); // More reliable for modern browsers

    return () => {
      clearTimeout(handler);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', saveGame);
    };
  }, [gameState, saveGame]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 selection:bg-orange-500/30">
        <SoundManager lastSound={lastSound} />
        <div className="w-full max-w-4xl mx-auto bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl shadow-black/30 overflow-hidden">
            {showSettingsMenu && <SettingsMenu onClose={() => setShowSettingsMenu(false)} onReset={handleResetGame} />}
            <header className="relative p-4 border-b border-gray-700 bg-gray-800">
                <h1 className="text-3xl sm:text-4xl text-center font-medieval text-orange-400 tracking-wider">Blacksmith's Forge</h1>
                <p className="text-center text-gray-400">An Idle Empire</p>
                <button 
                    onClick={() => setShowSettingsMenu(true)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-orange-400 transition-colors duration-200"
                    aria-label="Settings"
                >
                    <FaCog className="w-6 h-6" />
                </button>
            </header>
            <NavBar 
                activeScreen={activeScreen} 
                setActiveScreen={setActiveScreen} 
                gameState={gameState} 
                onShowStats={() => setShowStatsScreen(true)}
            />
            <main className="p-4 sm:p-6 min-h-[60vh] bg-gray-800/30">
                <div className="animate-fadeIn">
                    {screenComponent}
                </div>
            </main>
        </div>
        {showStatsScreen && <PlayerStatsScreen gameState={gameState} onClose={() => setShowStatsScreen(false)} />}
        <footer className="text-center mt-4 text-gray-500 text-sm">
            <p>Built with React & Tailwind CSS.</p>
        </footer>
    </div>
  );
};

export default App;
