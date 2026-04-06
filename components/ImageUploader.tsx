
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ImageStyle } from '../types';
import { IMAGE_STYLES } from '../constants';

interface ImageUploaderProps {
  image: string | null;
  setImage: (image: { data: string, mimeType: string } | null) => void;
  disabled: boolean;
  onGenerateImage?: (prompt: string, style: ImageStyle) => Promise<void>;
  onEditImage?: (prompt: string) => Promise<void>;
  onRestoreImage?: () => void;
  hasHistory?: boolean;
}

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
    image, 
    setImage, 
    disabled, 
    onGenerateImage, 
    onEditImage,
    onRestoreImage,
    hasHistory 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(ImageStyle.Realistic);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ data: reader.result as string, mimeType: file.type });
        setIsAiMode(false);
        setIsEditMode(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGenerateImage && aiPrompt.trim()) {
        try {
            await onGenerateImage(aiPrompt, selectedStyle);
            setAiPrompt('');
            setIsAiMode(false);
        } catch (err) {
            console.error(err);
        }
    }
  };

  const handleAiEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditImage && aiPrompt.trim()) {
        try {
            await onEditImage(aiPrompt);
            setAiPrompt('');
            setIsEditMode(false);
        } catch (err) {
            console.error(err);
        }
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-bold text-dark uppercase tracking-wide">Image Attachment</label>
        {image && hasHistory && onRestoreImage && (
            <button 
                type="button"
                onClick={onRestoreImage}
                disabled={disabled}
                className="text-[10px] font-bold text-secondary flex items-center gap-1 hover:underline disabled:opacity-50"
            >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                Restore Last Change
            </button>
        )}
      </div>
      <div 
        className={`relative w-full min-h-[200px] border-2 border-dashed rounded-xl flex items-center justify-center text-center transition-all duration-200 
            ${disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'bg-white border-gray-300'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
        {image && !isEditMode ? (
          <div className="relative w-full h-full p-2">
            <img src={image} alt="Preview" className="max-h-64 mx-auto object-contain rounded-lg shadow-md" />
            <div className="absolute top-4 right-4 flex gap-2">
                <button
                type="button"
                onClick={() => setIsEditMode(true)}
                title="Edit with AI prompt"
                className="bg-secondary text-white rounded-full p-1.5 hover:bg-blue-600 shadow-lg transition-transform hover:scale-110"
                >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button
                type="button"
                onClick={() => setImage(null)}
                className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
                >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
          </div>
        ) : isAiMode || isEditMode ? (
           <div className="w-full p-4 flex flex-col gap-3 animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase">{isEditMode ? 'Edit Current Image' : 'Generate New Image'}</h3>
                <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder={isEditMode ? "How should AI change the image? (e.g., 'Make it sunset', 'Add a cat')" : "Describe the image..."}
                    className="w-full h-24 p-3 text-sm border border-gray-200 rounded-lg outline-none resize-none focus:ring-2 focus:ring-secondary/20 transition-all"
                    disabled={disabled}
                />
                {!isEditMode && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {IMAGE_STYLES.map(style => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setSelectedStyle(style)}
                        disabled={disabled}
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${selectedStyle === style ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-white text-gray-500 border-gray-200'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => { setIsAiMode(false); setIsEditMode(false); }} 
                      className="flex-1 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg"
                      disabled={disabled}
                    >
                      Cancel
                    </button>
                    <button 
                        type="button"
                        onClick={isEditMode ? handleAiEdit : handleAiGenerate} 
                        disabled={!aiPrompt.trim() || disabled} 
                        className="flex-1 py-2 text-sm text-white bg-secondary rounded-lg font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                        {disabled ? (
                             <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                             </svg>
                        ) : (
                          <><SparklesIcon /> {isEditMode ? 'Apply Changes' : 'Generate'}</>
                        )}
                    </button>
                </div>
           </div>
        ) : (
          <div className="flex flex-col items-center p-6 space-y-4 animate-fade-in">
            <div className="p-3 bg-blue-50 rounded-full text-secondary">
               <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <p className="text-sm text-gray-500">Upload a screenshot or use AI magic</p>
            <div className="flex gap-2">
               <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-lg hover:border-secondary transition-colors" disabled={disabled}>Upload Image</button>
               <button type="button" onClick={() => setIsAiMode(true)} className="px-4 py-2 text-xs font-bold bg-secondary text-white rounded-lg flex items-center gap-1.5 shadow-md hover:bg-blue-600 transition-all" disabled={disabled}><SparklesIcon /> AI Generate</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
