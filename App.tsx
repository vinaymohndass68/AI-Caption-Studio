import React, { useState, useCallback, useEffect } from 'react';
import { ImageStyle, Tone } from './types';
import { generateImageFromPrompt, generateCaptions, editImageWithPrompt } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import ToneSelector from './components/ToneSelector';
import LanguageSelector from './components/LanguageSelector';
import CaptionDisplay from './components/CaptionDisplay';
import ReplyGeneratorView from './components/ReplyGeneratorView';
import CreatorView from './components/CreatorView';
import ImageEditorModal from './components/ImageEditorModal';

type AppTab = 'captions' | 'replies' | 'creator';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('captions');
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);
  
  // Caption State
  const [image, setImage] = useState<{ data: string, mimeType: string } | null>(null);
  const [imageHistory, setImageHistory] = useState<{ data: string, mimeType: string }[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [tone, setTone] = useState<Tone>(Tone.Friendly);
  const [language, setLanguage] = useState<string>('en-US');
  const [captions, setCaptions] = useState<string[] | null>(null);
  
  // Shared UI State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [editorCaption, setEditorCaption] = useState('');

  // Background Generator State (for "Visualize")
  const [generatedBg, setGeneratedBg] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setIsKeySelected(selected);
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setIsKeySelected(true); // Assume success per race condition rules
    setError(null);
  };

  const updateImageWithHistory = useCallback((newImage: { data: string, mimeType: string } | null) => {
    if (image) {
        setImageHistory(prev => [...prev, image]);
    }
    setImage(newImage);
  }, [image]);

  const handleRestoreImage = useCallback(() => {
    if (imageHistory.length > 0) {
        const previous = imageHistory[imageHistory.length - 1];
        setImage(previous);
        setImageHistory(prev => prev.slice(0, -1));
    }
  }, [imageHistory]);

  const handleGenerateCaptions = async (isMore = false) => {
    if (!prompt.trim() && !image) return setError("Please provide text or an image context.");
    setIsLoading(true);
    setError(null);
    try {
      const existing = isMore ? (captions || []) : [];
      const result = await generateCaptions(image, prompt, tone, language, existing);
      setCaptions(isMore ? [...existing, ...result] : result);
    } catch (e) {
      setError("Failed to generate captions.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiError = async (e: any) => {
      const msg = e.message || "";
      const errorStr = typeof e === 'object' ? JSON.stringify(e) : String(e);
      
      // If permission is denied, it likely means the selected project doesn't have billing or the model is restricted.
      if (msg === "PERMISSION_DENIED" || errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED") || errorStr.includes("permission")) {
          setError("API permission denied. This generation feature may require an API key from a project with billing enabled.");
          setIsKeySelected(false); // Reset key selection state to force onboarding/re-selection
          // @ts-ignore
          await window.aistudio.openSelectKey();
      } else if (msg === "KEY_MISSING" || errorStr.includes("entity was not found")) {
          setError("No valid API key found. Please select one.");
          setIsKeySelected(false);
          // @ts-ignore
          await window.aistudio.openSelectKey();
      } else {
          setError(msg || "An unexpected error occurred during generation.");
      }
  };

  const handleGenerateImage = useCallback(async (imagePrompt: string, style: ImageStyle) => {
    setIsLoading(true);
    setError(null);
    try {
        const generatedImage = await generateImageFromPrompt(imagePrompt, style);
        updateImageWithHistory(generatedImage);
    } catch (e: any) {
        await handleApiError(e);
    } finally {
        setIsLoading(false);
    }
  }, [updateImageWithHistory]);

  const handleEditImage = useCallback(async (editPrompt: string) => {
    if (!image) return;
    setIsLoading(true);
    setError(null);
    try {
        const editedImage = await editImageWithPrompt(image, editPrompt);
        updateImageWithHistory(editedImage);
    } catch (e) {
        setError("Image edit failed.");
    } finally {
        setIsLoading(false);
    }
  }, [image, updateImageWithHistory]);

  const handleVisualize = async (caption: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await generateImageFromPrompt(caption, ImageStyle.Vibrant);
      setEditorImage(res.data);
      setEditorCaption(caption);
      setIsEditorOpen(true);
    } catch (e: any) {
      await handleApiError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditor = (caption: string, sourceImg?: string | null) => {
    setEditorImage(sourceImg !== undefined ? sourceImg : (image?.data || null));
    setEditorCaption(caption);
    setIsEditorOpen(true);
  };

  const handleBgGenerate = async (prompt: string) => {
      setIsLoading(true);
      setError(null);
      try {
          const res = await generateImageFromPrompt(prompt, ImageStyle.Realistic);
          setGeneratedBg(res.data);
      } catch (e: any) {
          await handleApiError(e);
      } finally {
          setIsLoading(false);
      }
  };

  if (isKeySelected === null) return null; // Wait for initial check

  if (!isKeySelected) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-slate-200 text-center space-y-6">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-primary">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900">API Key Required</h1>
                <p className="text-slate-600">
                    To use image generation and high-quality AI features, you must select an API key. <strong>Paid projects</strong> are recommended for full feature access.
                </p>
                <div className="space-y-4">
                    <button 
                        onClick={handleOpenKeySelector}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all"
                    >
                        Select API Key
                    </button>
                    <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block text-sm text-primary hover:underline font-medium"
                    >
                        Learn about billing & project setup
                    </a>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-dark font-sans pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('captions')}>
            <div className="bg-primary text-white p-2 rounded-lg">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">AI Caption <span className="text-secondary">Studio</span></h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button 
                onClick={() => setActiveTab('captions')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'captions' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Captions
            </button>
            <button 
                onClick={() => setActiveTab('replies')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'replies' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Replies
            </button>
            <button 
                onClick={() => setActiveTab('creator')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'creator' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Creator
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'captions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">Caption Generator</h2>
                        <p className="text-slate-500 text-sm">Create viral captions with context-aware AI.</p>
                    </div>
                    
                    <ImageUploader 
                        image={image?.data || null} 
                        setImage={setImage} 
                        disabled={isLoading} 
                        onGenerateImage={handleGenerateImage}
                        onEditImage={handleEditImage}
                        onRestoreImage={handleRestoreImage}
                        hasHistory={imageHistory.length > 0} 
                    />
                    
                    <div className="space-y-4">
                        <label className="block text-sm font-bold uppercase tracking-widest text-slate-400">Context / Topic</label>
                        <textarea 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your post or topic..."
                            className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-secondary transition-all"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ToneSelector selectedTone={tone} onSelectTone={setTone} disabled={isLoading} />
                            <LanguageSelector selectedLanguage={language} onSelectLanguage={setLanguage} disabled={isLoading} />
                        </div>
                        <button 
                            onClick={() => handleGenerateCaptions()}
                            disabled={isLoading}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:scale-[1.01] transition-all disabled:bg-slate-300"
                        >
                            {isLoading ? "Generating..." : "Generate Captions"}
                        </button>
                    </div>
                </div>
                
                <div className="h-full min-h-[400px]">
                    <CaptionDisplay 
                        captions={captions} 
                        isLoading={isLoading} 
                        error={error}
                        onGenerateMore={() => handleGenerateCaptions(true)}
                        onVisualize={handleVisualize}
                        onCreateImage={openEditor}
                    />
                </div>
            </div>
        )}

        {activeTab === 'replies' && (
            <ReplyGeneratorView 
                onPickReply={openEditor} 
                onGenerateImage={async (p) => {
                    try {
                        const res = await generateImageFromPrompt(p, ImageStyle.Realistic);
                        setEditorImage(res.data);
                    } catch (e) {
                        handleApiError(e);
                    }
                }}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
            />
        )}

        {activeTab === 'creator' && (
            <CreatorView 
                onCreateImage={openEditor}
                onGenerateBackground={handleBgGenerate}
                isLoading={isLoading}
                generatedImage={generatedBg}
            />
        )}

        {error && (
            <div className="mt-8 bg-red-50 text-red-600 p-6 rounded-xl text-center border border-red-100 font-bold space-y-2">
                <p>{error}</p>
                {(error.toLowerCase().includes("permission") || error.toLowerCase().includes("billing")) && (
                    <div className="flex flex-col items-center gap-2 mt-4">
                         <button 
                            onClick={handleOpenKeySelector}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-red-700 transition-colors"
                        >
                            Select Valid API Key
                        </button>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-xs font-normal underline text-red-700">
                            Check Billing Requirements
                        </a>
                    </div>
                )}
            </div>
        )}
      </main>

      <ImageEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        image={editorImage}
        caption={editorCaption}
      />
    </div>
  );
};

export default App;