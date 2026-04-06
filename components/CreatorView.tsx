
import React, { useState } from 'react';

interface CreatorViewProps {
  onCreateImage: (caption: string, img: string | null) => void;
  onGenerateBackground: (prompt: string) => Promise<void>;
  isLoading: boolean;
  generatedImage: string | null;
}

const CreatorView: React.FC<CreatorViewProps> = ({ onCreateImage, onGenerateBackground, isLoading, generatedImage }) => {
  const [customCaption, setCustomCaption] = useState('');

  const handleGenerate = () => {
    if (!customCaption.trim()) return;
    const prompt = `A high-quality, artistic background image for a social media post. 
      The post's caption is: "${customCaption}". 
      Ensure there is space for text overlay. Avoid any existing text in the image. Use a vibrant and professional aesthetic.`;
    onGenerateBackground(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            1. Write Your Custom Caption
          </label>
          <textarea
            value={customCaption}
            onChange={(e) => setCustomCaption(e.target.value)}
            placeholder="Type your amazing caption here..."
            className="w-full p-4 text-lg border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all min-h-[150px] font-serif"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !customCaption.trim()}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center space-x-2 disabled:bg-gray-300"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>Generate Background Image</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col min-h-[400px]">
        <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide text-center">
          2. Preview & Export
        </label>
        
        <div className="flex-grow flex items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 relative overflow-hidden group">
          {generatedImage ? (
            <>
              <img src={generatedImage} alt="AI Background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                  onClick={() => onCreateImage(customCaption, generatedImage)}
                  className="bg-white text-primary font-bold px-6 py-3 rounded-full shadow-xl flex items-center space-x-2 transform transition-transform hover:scale-110"
                 >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <span>Customize & Overlay</span>
                 </button>
              </div>
            </>
          ) : (
            <div className="text-center p-8">
              <div className="bg-gray-100 p-4 rounded-full inline-block mb-4">
                <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-gray-400 font-medium">Your generated background will appear here.</p>
            </div>
          )}
        </div>

        {generatedImage && (
            <div className="mt-6 flex justify-center">
                 <button 
                    onClick={() => onCreateImage(customCaption, generatedImage)}
                    className="bg-secondary text-white font-bold px-8 py-3 rounded-lg shadow-md hover:bg-blue-600 transition-all flex items-center space-x-2"
                 >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    <span>Add Text Overlay & Download</span>
                 </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CreatorView;
