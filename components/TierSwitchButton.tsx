import React from 'react';
import { GiStairs } from 'react-icons/gi';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface TierSwitchButtonProps {
    direction: 'up' | 'down';
    onClick: () => void;
    oreName: string;
}

const TierSwitchButton: React.FC<TierSwitchButtonProps> = ({ direction, onClick, oreName }) => {
    const isUp = direction === 'up';
    const buttonClasses = `absolute z-10 ${isUp ? '-left-20 sm:-left-24' : '-right-20 sm:-right-24'} top-1/2 -translate-y-1/2 flex flex-col items-center p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all text-gray-300 hover:text-white transform hover:scale-105`;
    const arrowIcon = isUp ? <FaArrowUp className="text-2xl" /> : <FaArrowDown className="text-2xl" />;
    const oreNameElement = <span className="text-xs font-bold whitespace-nowrap">{oreName}</span>;

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={buttonClasses}
            aria-label={`Go to ${isUp ? 'previous' : 'next'} mine level`}
        >
            {isUp ? (
                <>
                    {arrowIcon}
                    <GiStairs className="text-4xl my-1" />
                    {oreNameElement}
                </>
            ) : (
                <>
                    {oreNameElement}
                    <GiStairs className="text-4xl my-1" />
                    {arrowIcon}
                </>
            )}
        </button>
    );
};

export default TierSwitchButton;
