
import React, { useEffect, useState } from 'react';

interface ClickNumberProps {
    x: number;
    y: number;
    value: string;
    onAnimationEnd: () => void;
}

const FADE_DELAY_MS = 50;
const ANIMATION_DURATION_MS = 700;
const TRANSFORM_DURATION_S = 0.7;
const OPACITY_DURATION_S = 0.6;

const ClickNumber: React.FC<ClickNumberProps> = ({ x, y, value, onAnimationEnd }) => {
    const [fade, setFade] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFade(true);
        }, FADE_DELAY_MS); // Start fading almost immediately

        const endTimer = setTimeout(onAnimationEnd, ANIMATION_DURATION_MS); // End animation faster

        return () => {
            clearTimeout(timer);
            clearTimeout(endTimer);
        };
    }, [onAnimationEnd]);

    const style: React.CSSProperties = {
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -100%) scale(1)`,
        opacity: 1,
        transition: `transform ${TRANSFORM_DURATION_S}s cubic-bezier(0.25, 1, 0.5, 1), opacity ${OPACITY_DURATION_S}s ease-in`,
    };

    if (fade) {
        style.transform = `translate(-50%, -200%) scale(1.2)`;
        style.opacity = 0;
    }

    return (
        <div 
            className="absolute font-bold text-2xl text-orange-300 pointer-events-none drop-shadow-lg"
            style={style}
        >
            {value}
        </div>
    );
};

export default ClickNumber;
