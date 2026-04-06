import React, { useState } from 'react';
import { ReplyStance, Tone } from '../types';
import LanguageSelector from './LanguageSelector';
import ImageUploader from './ImageUploader';
import ToneSelector from './ToneSelector';
import { generateReplies } from '../services/geminiService';

interface ReplyGeneratorViewProps {
  onPickReply: (reply: string) => void;
  onGenerateImage: (prompt: string) => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ReplyGeneratorView: React.FC<ReplyGeneratorViewProps> = ({ onPickReply, onGenerateImage, isLoading, setIsLoading }) => {
  const [statement, setStatement] = useState('');
  const [image, setImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [stance, setStance] = useState<ReplyStance>(ReplyStance.Agree);
  const [tone, setTone] = useState<Tone>(Tone.Friendly);
  const [language, setLanguage] = useState('en-US');
  const [maxWords, setMaxWords] = useState(50);
  const [maxChars, setMaxChars] = useState(280);
  const [replies, setReplies] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!statement.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateReplies(statement, stance, tone, language, image, maxWords, maxChars);
      setReplies(result);
    } catch (e) {
      setError("Failed to generate replies. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetImage = (img: { data: string, mimeType: string } | null) => {
      setImage(img);
  };

  const stances = [
    { value: ReplyStance.Agree, label: 'Agree', icon: '✅' },
    { value: ReplyStance.Disagree, label: 'Disagree', icon: '❌' },
    { value: ReplyStance.AgreeAppreciate, label: 'Agree & Appreciate', icon: '🌟' },
    { value: ReplyStance.DisagreeSarcastic, label: 'Disagree & Sarcastic', icon: '😏' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 space-y-6 overflow-y-auto">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            1. Statement & Context
          </label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Paste the statement you want to reply to..."
            className="w-full p-4 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all min-h-[100px] mb-4"
          />
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="block text-xs font-bold text-gray-400 uppercase mb-3">Optional Image Context</span>
            <div className="scale-90 origin-top">
                <ImageUploader 
                    image={image?.data || null} 
                    setImage={handleSetImage} 
                    disabled={isLoading}
                    onGenerateImage={onGenerateImage}
                />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            2. Delivery Style
          </label>
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Stance</span>
              <div className="grid grid-cols-2 gap-2">
                {stances.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStance(s.value)}
                    className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      stance === s.value 
                        ? 'border-secondary bg-blue-50 text-secondary font-bold' 
                        : 'border-gray-100 hover:border-gray-200 text-gray-600'
                    }`}
                  >
                    <span className="mr-2">{s.icon}</span>
                    <span className="text-xs sm:text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <ToneSelector selectedTone={tone} onSelectTone={setTone} disabled={isLoading} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Word Limit
              </label>
              <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{maxWords} words</span>
            </div>
            <input 
              type="range"
              min="5"
              max="200"
              step="5"
              value={maxWords}
              onChange={(e) => setMaxWords(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Character Limit
              </label>
              <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">{maxChars} chars</span>
            </div>
            <input 
              type="range"
              min="50"
              max="1000"
              step="10"
              value={maxChars}
              onChange={(e) => setMaxChars(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        <div>
          <LanguageSelector selectedLanguage={language} onSelectLanguage={setLanguage} disabled={isLoading} />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !statement.trim()}
          className="w-full bg-accent text-white font-bold py-4 rounded-xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center space-x-2 disabled:bg-gray-300"
        >
          {isLoading ? 'Thinking...' : 'Generate Replies'}
        </button>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200 min-h-[400px]">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 text-center">Suggested Replies</h3>
        
        {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg text-sm text-center mb-4">{error}</div>
        )}

        {replies ? (
          <div className="space-y-4 animate-slide-in-up">
            {replies.map((reply, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 group">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                    {reply.split(' ').length} words | {reply.length} chars
                   </span>
                </div>
                <p className="text-dark font-medium italic mb-4">"{reply}"</p>
                <button
                  onClick={() => onPickReply(reply)}
                  className="w-full py-2 bg-secondary/10 text-secondary font-bold rounded-lg hover:bg-secondary hover:text-white transition-all flex items-center justify-center space-x-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span>Visualize & Download</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
             {isLoading ? (
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mb-4"></div>
             ) : (
                <>
                    <svg className="h-16 w-16 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    <p>Enter a statement to see reply suggestions.</p>
                </>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplyGeneratorView;