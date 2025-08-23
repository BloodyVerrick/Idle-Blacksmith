import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameState, ClickData, OreType } from '@/types';
import { ORE_TIERS, ORE_ICONS } from '@/constants';
import ClickNumber from '@/components/ClickNumber';
import { GiStoneAxe, GiLightningFrequency } from 'react-icons/gi';
import TierSwitchButton from './TierSwitchButton';

interface MiningScreenProps {
    gameState: GameState;
    onMine: () => void;
    onSwitchTier: (direction: 'up' | 'down') => void;
}

interface ParticleData {
  id: number;
  x: number;
  y: number;
}

const MAX_CLICK_ANIMATIONS = 15;
const MAX_PARTICLES = 50;
const ANIMATION_THROTTLE_MS = 100;
const SHAKE_DURATION_MS = 200;

const MiningScreen: React.FC<MiningScreenProps> = ({ gameState, onMine, onSwitchTier }) => {
    const [clicks, setClicks] = useState<ClickData[]>([]);
    const [nextClickId, setNextClickId] = useState(0);
    const [shake, setShake] = useState(false);
    const [particles, setParticles] = useState<ParticleData[]>([]);
    const [nextParticleId, setNextParticleId] = useState(0);
    const playerClickTimestampsRef = useRef<number[]>([]);
    const [totalCps, setTotalCps] = useState('0.0');
    const lastAnimationTimeRef = useRef(0);

    const currentOreType = ORE_TIERS[gameState.currentOreTier];
    const prevOresRef = useRef(gameState.ores);
    const lastClickCoordsRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            playerClickTimestampsRef.current = playerClickTimestampsRef.current.filter(ts => now - ts < 2000);
            const playerCps = playerClickTimestampsRef.current.length / 2;
            const newTotalCps = (playerCps + gameState.autoMinerRate).toFixed(1);
            setTotalCps(newTotalCps);
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState.autoMinerRate]);
    
    useEffect(() => {
        const oreGained = Math.floor(gameState.ores[currentOreType]) - Math.floor(prevOresRef.current[currentOreType] || 0);
        const coalGained = Math.floor(gameState.ores[OreType.COAL]) - Math.floor(prevOresRef.current[OreType.COAL] || 0);

        const now = Date.now();
        if (now - lastAnimationTimeRef.current < ANIMATION_THROTTLE_MS) { // Throttle animations
            prevOresRef.current = gameState.ores;
            return;
        }

        if ((oreGained > 0 || coalGained > 0) && lastClickCoordsRef.current) {
            lastAnimationTimeRef.current = now;
            if (oreGained > 0) {
                const newClick: ClickData = { id: nextClickId, x: lastClickCoordsRef.current.x, y: lastClickCoordsRef.current.y, value: `+${oreGained}` };
                setClicks(currentClicks => [...currentClicks, newClick].slice(-MAX_CLICK_ANIMATIONS));
                setNextClickId(prev => prev + 1);
            }
             if (coalGained > 0) {
                // Offset coal to not overlap
                const newClick: ClickData = { id: nextClickId + 10000, x: lastClickCoordsRef.current.x + 15, y: lastClickCoordsRef.current.y + 15, value: `+${coalGained} Coal` };
                 setClicks(currentClicks => [...currentClicks, newClick].slice(-MAX_CLICK_ANIMATIONS));
                setNextClickId(prev => prev + 1);
            }
            
            // Particle effect
            const newParticles: ParticleData[] = Array.from({ length: 8 }).map((_, i) => ({
                id: nextParticleId + i,
                x: lastClickCoordsRef.current!.x,
                y: lastClickCoordsRef.current!.y,
            }));
            setNextParticleId(prev => prev + newParticles.length);
            setParticles(current => [...current, ...newParticles].slice(-MAX_PARTICLES));
        }

        prevOresRef.current = gameState.ores;
    }, [gameState.ores, currentOreType]);

    const handleOreClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        onMine();
        
        const rect = e.currentTarget.getBoundingClientRect();
        lastClickCoordsRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        
        // CPS tracking for player
        playerClickTimestampsRef.current.push(Date.now());
        
        // Shake effect
        if (!shake) {
          setShake(true);
          setTimeout(() => setShake(false), SHAKE_DURATION_MS);
        }
    };

    const handleAnimationEnd = (id: number) => {
        setClicks(currentClicks => currentClicks.filter(click => click.id !== id));
    };
    
    const handleParticleAnimationEnd = (id: number) => {
        setParticles(current => current.filter(p => p.id !== id));
    };

    const autominerPickaxes = useMemo(() => {
        const count = Math.min(Math.floor(gameState.autoMinerRate), 8); // Cap at 8 for visuals
        if (count === 0) return [];
        const radius = 90; 
        return Array.from({ length: count }).map((_, i) => {
            const angle = (i / count) * (2 * Math.PI) - Math.PI / 2;
            return {
                style: {
                    transform: `translate(-50%, -50%) translate(${radius * Math.cos(angle)}px, ${radius * Math.sin(angle)}px)`,
                    animationDelay: `${(i / count) * 1000}ms`
                }
            };
        });
    }, [gameState.autoMinerRate]);

    const clicksRequired = Math.max(1, 2 ** (gameState.currentOreTier - gameState.highestPickaxeTier));
    const progress = gameState.miningProgress[currentOreType] || 0;
    const progressPercent = clicksRequired > 1 ? (progress / clicksRequired) * 100 : 0;
    
    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    
    const autoMinerOrePerSec = (gameState.autoMinerRate / clicksRequired) * gameState.orePerClick;

    return (
        <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-3xl font-medieval text-orange-300 mb-2">The Mines</h2>
            <p className="text-gray-400 mb-6">Click the ore to gather resources! Use the ladders to change depths.</p>

            <div 
                className={`relative w-48 h-48 sm:w-64 sm:h-64 cursor-pointer select-none group animate-bob ${shake ? 'animate-shake' : ''}`}
                onClick={handleOreClick}
            >
                 {/* Go Up button */}
                {gameState.currentOreTier > 0 && (
                    <TierSwitchButton 
                        direction="up" 
                        onClick={() => onSwitchTier('up')} 
                        oreName={ORE_TIERS[gameState.currentOreTier - 1]} 
                    />
                )}

                {/* Go Down button */}
                {gameState.currentOreTier < gameState.maxOreTier && (
                    <TierSwitchButton 
                        direction="down" 
                        onClick={() => onSwitchTier('down')} 
                        oreName={ORE_TIERS[gameState.currentOreTier + 1]} 
                    />
                )}

                {/* Progress Bar */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 220" style={{ transform: 'scale(1.2)'}}>
                    <circle className="text-gray-700/50" stroke="currentColor" strokeWidth="8" fill="transparent" r={radius} cx="110" cy="110" />
                    <circle
                        className="text-green-500"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeLinecap="round"
                        r={radius}
                        cx="110"
                        cy="110"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                            transition: 'stroke-dashoffset 0.1s linear',
                            filter: 'drop-shadow(0 0 3px #4ade80)',
                        }}
                    />
                </svg>

                {/* Ore Pulsing Glow */}
                <div className="absolute inset-0 bg-orange-400/50 rounded-full blur-2xl group-hover:bg-orange-400/70 transition-all duration-500"></div>
                
                {/* The Ore Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-8xl sm:text-9xl text-white transition-transform duration-200 ease-out group-active:scale-90">
                     {ORE_ICONS[currentOreType]}
                </div>
                
                {/* Auto Miner Pickaxes */}
                {autominerPickaxes.map((pick, i) => (
                    <div key={i} className="absolute top-1/2 left-1/2" style={pick.style}>
                         <GiStoneAxe className="text-4xl text-gray-400 animate-swing" />
                    </div>
                ))}
                
                {clicks.map(click => (
                    <ClickNumber
                        key={click.id}
                        x={click.x}
                        y={click.y}
                        value={click.value}
                        onAnimationEnd={() => handleAnimationEnd(click.id)}
                    />
                ))}

                {/* Particles */}
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="particle absolute w-1.5 h-1.5 bg-yellow-300 rounded-full pointer-events-none"
                        style={{
                            left: p.x,
                            top: p.y,
                            '--vx': `${(Math.random() - 0.5) * 120}px`,
                            '--vy': `${(Math.random() - 0.5) * 120}px`,
                        } as React.CSSProperties}
                        onAnimationEnd={() => handleParticleAnimationEnd(p.id)}
                    />
                ))}
            </div>

            <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg w-full max-w-sm text-left space-y-2">
                <p className="text-lg font-bold text-white">Ore: <span className="text-orange-400">{currentOreType}</span></p>
                <p className="text-md text-gray-300">Ore per click: <span className="font-bold text-green-400">{gameState.orePerClick}</span></p>
                {clicksRequired > 1 && (
                    <>
                        <p className="text-md text-gray-300">Clicks to Mine: <span className="font-bold text-white">{clicksRequired}</span></p>
                        <p className="text-md text-gray-300">Mining Progress: <span className="font-bold text-white">{progress} / {clicksRequired}</span></p>
                    </>
                )}
                {gameState.autoMinerRate > 0 && (
                     <p className="text-md text-gray-300">Auto-miner ore/sec: <span className="font-bold text-cyan-400">{autoMinerOrePerSec.toFixed(2)}</span></p>
                )}
                <div className="flex items-center gap-2 text-md text-gray-300 pt-2 mt-2 border-t border-gray-700/50">
                    <GiLightningFrequency className="text-yellow-400 h-5 w-5" />
                    <p>Total Clicks/sec: <span className="font-bold text-white">{totalCps}</span></p>
                </div>
            </div>
        </div>
    );
};

export default MiningScreen;