
import React, { useEffect, useState } from 'react';

interface ClickNumberProps {
    x: number;
    y: number;
    value: string;
    onAnimationEnd: () => void;
}

const ClickNumber: React.FC<ClickNumberProps> = ({ x, y, value, onAnimationEnd }) => {
    const [fade, setFade] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFade(true);
        }, 500);

        const endTimer = setTimeout(onAnimationEnd, 1000);

        return () => {
            clearTimeout(timer);
            clearTimeout(endTimer);
        };
    }, [onAnimationEnd]);

    const style: React.CSSProperties = {
        left: `${x}px`,
        top: `${y}px`,
        transform: `translate(-50%, -100%)`,
        opacity: fade ? 0 : 1,
        transition: 'transform 1s ease-out, opacity 0.5s ease-out 0.5s',
    };
    
    if(!fade) {
        style.transform = `translate(-50%, -200%)`;
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
