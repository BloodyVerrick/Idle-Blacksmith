
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameState, GameActionType } from './hooks/useGameState';
import { Screen, GameState } from './types';
import NavBar from './components/NavBar';
import MiningScreen from './components/MiningScreen';
import ForgeScreen from './components/ForgeScreen';
import MarketScreen from './components/ShopScreen';
import UpgradesScreen from './components/UpgradesScreen';
import SoundManager from './components/SoundManager';
import { UPGRADES } from './constants';

const App: React.FC = () => {
  const [gameState, dispatch] = useGameState();
  const [activeScreen, setActiveScreen] = useState<Screen>(Screen.MINING);
  const [lastSound, setLastSound] = useState<{name: string, time: number} | null>(null);

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
        return <UpgradesScreen {...screenProps} onUpgrade={handleUpgrade} />;
      default:
        return <MiningScreen {...screenProps} onMine={handleMine} onSwitchTier={handleSwitchTier} />;
    }
  }, [activeScreen, gameState, handleMine, handleForge, handleSell, handleUpgrade, dispatch, handleForgeAll, handleSellAll, handleSwitchTier]);
  
  const autoSave = useCallback((state: GameState) => {
     try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('blacksmithGameState', serializedState);
     } catch (err) {
        console.error("Could not save game state", err);
     }
  }, []);

  useEffect(() => {
      autoSave(gameState);
  }, [gameState, autoSave]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 selection:bg-orange-500/30">
        <SoundManager lastSound={lastSound} />
        <div className="w-full max-w-4xl mx-auto bg-gray-800/50 border border-gray-700 rounded-xl shadow-2xl shadow-black/30 overflow-hidden">
            <header className="p-4 border-b border-gray-700 bg-gray-800">
                <h1 className="text-3xl sm:text-4xl text-center font-medieval text-orange-400 tracking-wider">Blacksmith's Forge</h1>
                <p className="text-center text-gray-400">An Idle Empire</p>
            </header>
            <NavBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} gameState={gameState} />
            <main className="p-4 sm:p-6 min-h-[60vh] bg-gray-800/30">
                <div className="animate-fadeIn">
                    {screenComponent}
                </div>
            </main>
        </div>
        <footer className="text-center mt-4 text-gray-500 text-sm">
            <p>Built with React & Tailwind CSS.</p>
        </footer>
    </div>
  );
};

export default App;
