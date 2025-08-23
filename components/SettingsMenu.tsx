import React, { useState } from 'react';

interface SettingsMenuProps {
    onClose: () => void;
    onReset: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ onClose, onReset }) => {
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleResetClick = () => {
        setShowConfirmation(true);
    };

    const handleConfirmReset = () => {
        onReset();
        setShowConfirmation(false);
        onClose();
    };

    const handleCancelReset = () => {
        setShowConfirmation(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-medieval text-orange-400">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                {!showConfirmation ? (
                    <div className="space-y-4">
                        <p className="text-gray-300">Manage your game settings here.</p>
                        <button 
                            onClick={handleResetClick}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        >
                            Reset Game Progress
                        </button>
                    </div>
                ) : (
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">Are you sure?</h3>
                        <p className="text-gray-300 mb-4">This will permanently erase all your progress. This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={handleCancelReset}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmReset}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                            >
                                Confirm Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsMenu;
