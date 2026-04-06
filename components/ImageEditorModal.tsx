import React, { useEffect, useRef, useState } from 'react';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
  caption: string;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, image, caption }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  
  // Local image state (for when user adds background to text post)
  const [localImage, setLocalImage] = useState<string | null>(null);
  
  // Determine which image to use (prop image takes precedence, though they shouldn't coexist in this flow)
  const activeImage = image || localImage;

  // Content State
  const [text, setText] = useState(caption);
  const [verticalPos, setVerticalPos] = useState(50);
  
  // Style State
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(5); // 5% of width
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  
  // Background State (Only for text images)
  const [bgColor, setBgColor] = useState('#1e40af');
  const [isGradient, setIsGradient] = useState(true);

  // Image Adjustments State
  const [imgOpacity, setImgOpacity] = useState(100);
  const [imgBrightness, setImgBrightness] = useState(100);
  const [imgContrast, setImgContrast] = useState(100);

  // Track initialization to prevent infinite state loops
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isOpen) {
        if (!hasInitialized.current) {
            setText(caption);
            setLocalImage(null); // Reset local image on open
            
            // Default to 80% (bottom) for provided images, 50% (center) for text-only
            setVerticalPos(image ? 80 : 50);
            
            // Reset styles on open
            setTextColor('#ffffff');
            setTextSize(5);
            setFontFamily('Arial, sans-serif');
            setTextAlign('center');
            setBgColor('#1e40af');
            setIsGradient(true);
            
            // Reset Image Adjustments
            setImgOpacity(100);
            setImgBrightness(100);
            setImgContrast(100);

            hasInitialized.current = true;
        }
    } else {
        hasInitialized.current = false;
    }
  }, [caption, image, isOpen]);

  // Helper to determine optimal shadow color based on text brightness
  const getShadowColor = (hex: string) => {
    // Ensure we have a standard 6-digit hex
    if (!hex || hex.length < 7) return 'rgba(0,0,0,0.8)';
    
    try {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        
        // Calculate luminance
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        // Return dark shadow for light text, light shadow for dark text
        return luma < 128 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    } catch (e) {
        return 'rgba(0,0,0,0.8)';
    }
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalImage(reader.result as string);
        // Reset controls for the new image
        setImgOpacity(100);
        setImgBrightness(100);
        setImgContrast(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const drawContent = (img?: HTMLImageElement) => {
        // Set canvas dimensions
        let width, height;
        if (img) {
            // Constrain max width to 1080px for performance/consistency
            const maxWidth = 1080;
            const scale = Math.min(1, maxWidth / img.width);
            width = img.width * scale;
            height = img.height * scale;
        } else {
            width = 1080;
            height = 1080; // Square for text-only posts
        }

        canvas.width = width;
        canvas.height = height;

        // Draw Background
        if (img) {
          // Fill black background first so opacity fades to black
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, width, height);

          ctx.save();
          // Apply Filters
          ctx.filter = `brightness(${imgBrightness}%) contrast(${imgContrast}%)`;
          ctx.globalAlpha = imgOpacity / 100;
          
          ctx.drawImage(img, 0, 0, width, height);
          ctx.restore();
          
          // Scrim for readability if text is at bottom (and image is fully visible)
          // We reduce the scrim intensity if the user has already darkened the image manually
          if (verticalPos > 50 && imgOpacity > 80 && imgBrightness > 50) {
              const gradient = ctx.createLinearGradient(0, height * 0.5, 0, height);
              gradient.addColorStop(0, 'rgba(0,0,0,0)');
              gradient.addColorStop(0.8, 'rgba(0,0,0,0.7)');
              gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
              ctx.fillStyle = gradient;
              ctx.fillRect(0, height * 0.4, width, height * 0.6);
          }
        } else {
          if (isGradient) {
            // Default Gradient
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#1e40af'); // primary
            gradient.addColorStop(0.5, '#3b82f6'); // secondary
            gradient.addColorStop(1, '#f97316'); // accent
            ctx.fillStyle = gradient;
          } else {
            // Solid Color
            ctx.fillStyle = bgColor;
          }
          ctx.fillRect(0, 0, width, height);
        }

        // Configure Text
        const fontSizePx = width * (textSize / 100); 
        ctx.font = `bold ${fontSizePx}px ${fontFamily}`;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';
        
        // Text Wrapping Logic
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        const maxWidth = width * 0.85; // 85% of canvas width

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const widthMeasure = ctx.measureText(currentLine + " " + word).width;
          if (widthMeasure < maxWidth) {
            currentLine += " " + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);

        // Draw Text
        const lineHeight = fontSizePx * 1.3;
        
        // Calculate starting Y to center the block of text at verticalPos
        const centerY = height * (verticalPos / 100);
        const startY = centerY - ((lines.length - 1) * lineHeight / 2);

        ctx.fillStyle = textColor;
        ctx.shadowColor = getShadowColor(textColor);
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Determine X position based on alignment
        const padding = width * 0.075;
        let xPos = width / 2;
        if (textAlign === 'left') xPos = padding;
        if (textAlign === 'right') xPos = width - padding;

        lines.forEach((line, i) => {
          ctx.fillText(line, xPos, startY + (i * lineHeight));
        });

        // Set download URL (check if changed to prevent infinite loop)
        const newUrl = canvas.toDataURL('image/png');
        setDownloadUrl(prev => (prev === newUrl ? prev : newUrl));
      };

      if (activeImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = activeImage;
        img.onload = () => drawContent(img);
        img.onerror = () => drawContent(); // Fallback if image fails
      } else {
        drawContent();
      }
    }
  }, [isOpen, activeImage, text, verticalPos, textColor, textSize, fontFamily, textAlign, bgColor, isGradient, imgOpacity, imgBrightness, imgContrast]);

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.download = 'captioned-image.png';
      link.href = downloadUrl;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
          <h3 className="text-lg font-bold text-dark">Preview & Edit Image</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 bg-gray-50 flex-grow overflow-y-auto flex flex-col space-y-5">
           <div className="flex-shrink-0 flex items-center justify-center">
              <canvas ref={canvasRef} className="max-w-full h-auto shadow-lg rounded-md border border-gray-200" style={{maxHeight: '35vh'}} />
           </div>

           {/* Controls Section */}
           <div className="w-full space-y-5">
              
              {/* Message Input */}
              <div>
                  <label htmlFor="caption-text" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                      Message
                  </label>
                  <textarea
                      id="caption-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none resize-none bg-white"
                      rows={2}
                      placeholder="Enter your caption here..."
                  />
              </div>

              {/* Text Styles */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                      Text Style
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">Font Family</span>
                        <select 
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-secondary outline-none bg-white font-medium"
                        >
                            <optgroup label="Sans Serif">
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="Verdana, Geneva, sans-serif">Verdana</option>
                                <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
                                <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
                                <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
                            </optgroup>
                            <optgroup label="Serif">
                                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                                <option value="Georgia, serif">Georgia</option>
                                <option value="Garamond, serif">Garamond</option>
                            </optgroup>
                            <optgroup label="Monospace">
                                <option value="'Courier New', Courier, monospace">Courier New</option>
                                <option value="'Lucida Console', Monaco, monospace">Lucida Console</option>
                            </optgroup>
                            <optgroup label="Display & Script">
                                <option value="Impact, Charcoal, sans-serif">Impact</option>
                                <option value="'Brush Script MT', cursive">Brush Script</option>
                                <option value="'Comic Sans MS', 'Comic Sans', cursive">Comic Sans</option>
                                <option value="fantasy">Fantasy</option>
                            </optgroup>
                        </select>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">Color</span>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="color" 
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="h-9 w-full cursor-pointer rounded-md border border-gray-300 p-1"
                            />
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex items-end gap-3">
                    <div className="flex-grow">
                        <div className="flex justify-between mb-1">
                            <span className="block text-xs text-gray-400">Size</span>
                            <span className="text-xs text-gray-500">{textSize}</span>
                        </div>
                        <input
                            type="range"
                            min="2"
                            max="10"
                            step="0.5"
                            value={textSize}
                            onChange={(e) => setTextSize(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                        />
                    </div>
                    <div className="flex-shrink-0">
                        <span className="block text-xs text-gray-400 mb-1">Align</span>
                        <div className="flex bg-gray-200 rounded-md p-0.5 border border-gray-300 h-9">
                            <button 
                                onClick={() => setTextAlign('left')}
                                className={`w-9 flex items-center justify-center rounded transition-all ${textAlign === 'left' ? 'bg-white shadow text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                                aria-label="Align Left"
                                title="Align Left"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setTextAlign('center')}
                                className={`w-9 flex items-center justify-center rounded transition-all ${textAlign === 'center' ? 'bg-white shadow text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                                aria-label="Align Center"
                                title="Align Center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <button 
                                onClick={() => setTextAlign('right')}
                                className={`w-9 flex items-center justify-center rounded transition-all ${textAlign === 'right' ? 'bg-white shadow text-secondary' : 'text-gray-500 hover:text-gray-700'}`}
                                aria-label="Align Right"
                                title="Align Right"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                  </div>
              </div>

              {/* Position */}
              <div>
                <div className="flex justify-between mb-1">
                    <label htmlFor="vertical-pos" className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Vertical Position
                    </label>
                    <span className="text-xs text-gray-500">{verticalPos}%</span>
                </div>
                <input
                    id="vertical-pos"
                    type="range"
                    min="10"
                    max="90"
                    value={verticalPos}
                    onChange={(e) => setVerticalPos(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                />
              </div>

               {/* Image Adjustments (If any image is present) */}
               {activeImage && (
                  <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Image Adjustments
                        </label>
                        {/* Option to remove locally uploaded image */}
                        {!image && (
                            <button 
                                onClick={() => setLocalImage(null)}
                                className="text-xs text-red-500 hover:text-red-700 font-semibold"
                            >
                                Remove Image
                            </button>
                        )}
                      </div>
                      <div className="space-y-3">
                          {/* Opacity */}
                          <div>
                              <div className="flex justify-between mb-1">
                                  <span className="text-xs text-gray-400">Opacity</span>
                                  <span className="text-xs text-gray-500">{imgOpacity}%</span>
                              </div>
                              <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={imgOpacity}
                                  onChange={(e) => setImgOpacity(Number(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                              />
                          </div>
                           {/* Brightness */}
                           <div>
                              <div className="flex justify-between mb-1">
                                  <span className="text-xs text-gray-400">Brightness</span>
                                  <span className="text-xs text-gray-500">{imgBrightness}%</span>
                              </div>
                              <input
                                  type="range"
                                  min="0"
                                  max="200"
                                  value={imgBrightness}
                                  onChange={(e) => setImgBrightness(Number(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                              />
                          </div>
                           {/* Contrast */}
                           <div>
                              <div className="flex justify-between mb-1">
                                  <span className="text-xs text-gray-400">Contrast</span>
                                  <span className="text-xs text-gray-500">{imgContrast}%</span>
                              </div>
                              <input
                                  type="range"
                                  min="0"
                                  max="200"
                                  value={imgContrast}
                                  onChange={(e) => setImgContrast(Number(e.target.value))}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                              />
                          </div>
                      </div>
                  </div>
              )}

              {/* Background (Only if NO image is present) */}
              {!activeImage && (
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                        Background
                    </label>
                    
                    {/* Image Upload Option */}
                    <div className="mb-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLocalImageUpload}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                        <button
                            onClick={triggerFileUpload}
                            className="w-full py-2 px-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50 hover:border-secondary transition-colors flex items-center justify-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Upload Background Image</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={isGradient}
                                onChange={(e) => setIsGradient(e.target.checked)}
                                className="form-checkbox h-4 w-4 text-secondary rounded focus:ring-secondary"
                            />
                            <span className="text-sm text-gray-700">Use Gradient</span>
                        </label>
                        
                        {!isGradient && (
                            <div className="flex items-center space-x-2 animate-fade-in">
                                <span className="text-xs text-gray-400">Color</span>
                                <input 
                                    type="color" 
                                    value={bgColor}
                                    onChange={(e) => setBgColor(e.target.value)}
                                    className="h-8 w-12 cursor-pointer rounded border border-gray-300 p-0.5"
                                />
                            </div>
                        )}
                    </div>
                  </div>
              )}
           </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white z-10">
          <button
            onClick={handleDownload}
            disabled={!downloadUrl}
            className="w-full bg-secondary text-white font-bold py-3 px-4 rounded-lg shadow hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Download Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;