import React, { useRef, useEffect } from 'react';
import {
    playSound,
    createMineSound,
    createForgeSound,
    createSellSound,
    createUpgradeSound,
    createBaggingSound,
    createCanningSound
} from '@/lib/sounds';

interface SoundManagerProps {
    lastSound: { name: string; time: number } | null;
}


const SoundManager: React.FC<SoundManagerProps> = ({ lastSound }) => {
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize AudioContext once.
    useEffect(() => {
        if (!audioContextRef.current) {
            try {
                // The `any` cast is for Safari compatibility
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } catch (e) {
                console.error("Web Audio API is not supported in this browser");
            }
        }
    }, []);

    useEffect(() => {
        if (!lastSound || !audioContextRef.current) {
            return;
        }

        const context = audioContextRef.current;
        let soundGenerator;

        switch (lastSound.name) {
            case 'mine':
                soundGenerator = createMineSound(context);
                break;
            case 'forge':
                soundGenerator = createForgeSound(context);
                break;
            case 'sell':
                soundGenerator = createSellSound(context);
                break;
            case 'upgrade':
                soundGenerator = createUpgradeSound(context);
                break;
            case 'bagging':
                soundGenerator = createBaggingSound(context);
                break;
            case 'canning':
                soundGenerator = createCanningSound(context);
                break;
            default:
                return; // Do nothing for unknown sounds
        }

        playSound(context, soundGenerator);

    }, [lastSound]);

    return null; // This component does not render anything
};

export default SoundManager;
