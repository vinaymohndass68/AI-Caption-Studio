import React from 'react';

export const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'hi-IN', name: 'Hindi (हिन्दी)' },
  { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
  { code: 'te-IN', name: 'Telugu (తెలుగు)' },
  { code: 'sa-IN', name: 'Sanskrit (संस्कृतम्)' },
  { code: 'mai-IN', name: 'Maithili (मैथिली)' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
  disabled: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onSelectLanguage, disabled }) => {
  return (
    <div>
      <label htmlFor="language-select" className="block text-sm font-medium text-dark mb-2">
        Output Language
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onSelectLanguage(e.target.value)}
        disabled={disabled}
        className="w-full p-2.5 text-sm font-semibold text-dark bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;