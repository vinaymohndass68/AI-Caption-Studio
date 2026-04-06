import React from 'react';
import { Tone } from '../types';
import { TONES } from '../constants';

interface ToneSelectorProps {
  selectedTone: Tone;
  onSelectTone: (tone: Tone) => void;
  disabled: boolean;
}

const ToneSelector: React.FC<ToneSelectorProps> = ({ selectedTone, onSelectTone, disabled }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-dark mb-2">Choose a Tone</label>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-lg">
        {TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            onClick={() => onSelectTone(tone)}
            disabled={disabled}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed
              ${selectedTone === tone
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-dark hover:bg-gray-100 border border-gray-300'
              }`}
          >
            {tone}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ToneSelector;