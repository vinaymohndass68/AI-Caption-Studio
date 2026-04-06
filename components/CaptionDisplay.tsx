
import React, { useState } from 'react';

interface CaptionDisplayProps {
  captions: string[] | null;
  isLoading: boolean;
  error: string | null;
  onGenerateMore: () => void;
  onCreateImage: (caption: string, img?: string | null) => void;
  onVisualize: (caption: string) => void;
}

const Loader: React.FC = () => (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-secondary"></div>
    </div>
);

const ClipboardIcon: React.FC<{ copied: boolean }> = ({ copied }) => (
    copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    )
);

const ImageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const MagicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const CaptionDisplay: React.FC<CaptionDisplayProps> = ({ captions, isLoading, error, onGenerateMore, onCreateImage, onVisualize }) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = (text: string, index: number) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        }
    };
    
    const renderContent = () => {
        const hasCaptions = captions && captions.length > 0;

        if (isLoading && !hasCaptions) {
            return <Loader />;
        }
        if (error && !hasCaptions) {
            return (
                <div className="text-center text-red-500 animate-fade-in">
                    <p className="font-semibold">An error occurred:</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            );
        }
        if (hasCaptions) {
            return (
                <div className="w-full animate-slide-in-up self-start">
                    <h2 className="text-xl font-bold text-dark mb-4 text-center">Your Captions</h2>
                    <ul className="space-y-3">
                        {captions.map((caption, index) => (
                            <li key={index} className="relative bg-light p-4 rounded-lg shadow-inner group transition-shadow hover:shadow-md pr-32">
                                <p className="text-md text-dark font-serif italic">
                                    "{caption}"
                                </p>
                                <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex space-x-1">
                                    <button 
                                        onClick={() => onVisualize(caption)} 
                                        className="p-2 rounded-full hover:bg-gray-200 transition-colors" 
                                        title="Visualize with AI (New Tab)"
                                        aria-label={`Visualize caption ${index + 1} with AI`}
                                    >
                                        <MagicIcon />
                                    </button>
                                    <button 
                                        onClick={() => onCreateImage(caption)} 
                                        className="p-2 rounded-full hover:bg-gray-200 transition-colors" 
                                        title="Create Image with Caption Overlay"
                                        aria-label={`Create overlay for caption ${index + 1}`}
                                    >
                                        <ImageIcon />
                                    </button>
                                    <button 
                                        onClick={() => handleCopy(caption, index)} 
                                        className="p-2 rounded-full hover:bg-gray-200 transition-colors" 
                                        title="Copy to Clipboard"
                                        aria-label={`Copy caption ${index + 1}`}
                                    >
                                        <ClipboardIcon copied={copiedIndex === index} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                     {error && (
                        <div className="mt-4 text-center text-red-500 animate-fade-in">
                           <p className="font-semibold">An error occurred:</p>
                           <p className="text-sm mt-1">{error}</p>
                       </div>
                    )}
                    <div className="mt-6 text-center">
                        <button
                            onClick={onGenerateMore}
                            disabled={isLoading}
                            className="bg-secondary text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-blue-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center mx-auto"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generating...
                                </>
                            ) : (
                                'Generate 5 More'
                            )}
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <p className="text-center text-gray-400">
                Your generated captions will appear here...
            </p>
        );
    }

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg p-6 flex items-center justify-center min-h-[200px] lg:min-h-full">
        {renderContent()}
    </div>
  );
};

export default CaptionDisplay;
