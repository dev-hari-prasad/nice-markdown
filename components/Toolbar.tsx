import React, { useState } from 'react';
import { ViewMode, Theme, FontFamily } from '../types';
import { 
  LayoutTemplate, 
  Columns, 
  Eye, 
  AlignJustify,
  MoveVertical,
  Download,
  Settings,
  Palette,
  FileText,
  File,
  Minimize2
} from 'lucide-react';
import { THEME_CONFIG } from '../constants';
import { Tooltip } from './ui/Tooltip';

interface ToolbarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontFamily: FontFamily;
  setFontFamily: (f: FontFamily) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  showLineNumbers: boolean;
  setShowLineNumbers: (s: boolean) => void;
  syncScroll: boolean;
  setSyncScroll: (s: boolean) => void;
  borderRadius: number;
  setBorderRadius: (r: number) => void;
  onDownloadMd: () => void;
  onPrint: () => void;
  isCentered: boolean;
  setIsCentered: (c: boolean) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  setViewMode,
  theme,
  setTheme,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  showLineNumbers,
  setShowLineNumbers,
  syncScroll,
  setSyncScroll,
  borderRadius,
  setBorderRadius,
  onDownloadMd,
  onPrint,
  isCentered,
  setIsCentered
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  return (
    <div className="toolbar-container h-14 border-b flex items-center justify-between px-4 select-none shrink-0 relative transition-colors duration-200" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-ui)' }}>
      
      {/* Left: Branding & Mode Switch */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
            {/* Logo SVG */}
            <svg 
              viewBox="-10 -5 1034 1034" 
              className="w-5 h-5 -mt-0.5" 
              fill="currentColor" 
              style={{ color: 'var(--color-text)' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M922 319q-1 0 -2 1h-11v0h-836q-18 0 -33.5 8.5t-25.5 22.5q-17 26 -13 57v461q1 18 11 32.5t24 22.5q25 14 55 10v1l843 -1q18 -1 32.5 -11t22.5 -24q14 -24 10 -55h1l-1 -459q-1 -17 -11 -31.5t-24 -23.5q-19 -10 -42 -11zM918 367h2q12 0 20 5q6 3 8.5 6.5t2.5 9.5 l1 456v3q2 16 -5 29q-3 5 -6.5 7.5t-9.5 2.5l-840 1h-3q-16 2 -28 -5q-6 -3 -8.5 -6.5t-2.5 -9.5v-458l-1 -4q-2 -14 5.5 -25t18.5 -11h837zM145 464v327h96v-188l96 120l96 -120v188h96v-327h-96l-96 120l-96 -120h-96zM697 464v168h-96l144 159l144 -159h-96v-168h-96z" />
            </svg>
            <span className="font-bold tracking-tight text-sm font-mono" style={{ color: 'var(--color-text)' }}>NICE MARKDOWN</span>
        </div>

        {/* Separator */}
        <div className="w-px h-4 mx-2" style={{ backgroundColor: 'var(--color-border)' }}></div>

        {/* View Mode Switcher Group */}
        <div className="flex items-center gap-2">
            <div className="flex items-center p-[2px] border h-9 gap-1" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
            <Tooltip content="Write Mode">
                <button
                    onClick={() => setViewMode(ViewMode.WRITE)}
                    className={`flex items-center gap-2 px-3 py-1 h-full text-[10px] font-bold tracking-wide transition-all ${
                    viewMode === ViewMode.WRITE ? 'shadow-sm' : 'hover:opacity-80'
                    }`}
                    style={{ 
                        borderRadius: 'calc(var(--radius) - 2px)',
                        backgroundColor: viewMode === ViewMode.WRITE ? 'var(--color-active)' : 'transparent',
                        color: viewMode === ViewMode.WRITE ? 'var(--color-text)' : 'var(--color-text-muted)'
                    }}
                >
                    <LayoutTemplate size={12} />
                    WRITE
                </button>
            </Tooltip>
            <Tooltip content="Preview Mode">
                <button
                    onClick={() => setViewMode(ViewMode.PREVIEW)}
                    className={`flex items-center gap-2 px-3 py-1 h-full text-[10px] font-bold tracking-wide transition-all ${
                    viewMode === ViewMode.PREVIEW ? 'shadow-sm' : 'hover:opacity-80'
                    }`}
                    style={{ 
                        borderRadius: 'calc(var(--radius) - 2px)',
                        backgroundColor: viewMode === ViewMode.PREVIEW ? 'var(--color-active)' : 'transparent',
                        color: viewMode === ViewMode.PREVIEW ? 'var(--color-text)' : 'var(--color-text-muted)'
                    }}
                >
                    <Eye size={12} />
                    PREVIEW
                </button>
            </Tooltip>
            <Tooltip content="Split Mode">
                <button
                    onClick={() => setViewMode(ViewMode.SPLIT)}
                    className={`flex items-center gap-2 px-3 py-1 h-full text-[10px] font-bold tracking-wide transition-all ${
                    viewMode === ViewMode.SPLIT ? 'shadow-sm' : 'hover:opacity-80'
                    }`}
                    style={{ 
                        borderRadius: 'calc(var(--radius) - 2px)',
                        backgroundColor: viewMode === ViewMode.SPLIT ? 'var(--color-active)' : 'transparent',
                        color: viewMode === ViewMode.SPLIT ? 'var(--color-text)' : 'var(--color-text-muted)'
                    }}
                >
                    <Columns size={12} />
                    SPLIT
                </button>
            </Tooltip>
            </div>

            {/* Centered Mode Toggle (Hidden in Split View) */}
            {viewMode !== ViewMode.SPLIT && (
                <Tooltip content={isCentered ? "Expand Width" : "Focus Mode (70%)"}>
                    <button 
                        onClick={() => setIsCentered(!isCentered)}
                        className="h-9 w-9 flex items-center justify-center border transition-all"
                        style={{ 
                            borderRadius: 'var(--radius)',
                            backgroundColor: isCentered ? 'var(--color-active)' : 'var(--color-bg)',
                            borderColor: 'var(--color-border)',
                            color: isCentered ? 'var(--color-text)' : 'var(--color-text-muted)'
                        }}
                    >
                        <Minimize2 size={14} className={isCentered ? "text-blue-500" : ""} />
                    </button>
                </Tooltip>
            )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        
        {/* Toggles */}
        <div className="flex items-center gap-2 pr-3 border-r" style={{ borderColor: 'var(--color-border)' }}>
             <Tooltip content="Line Numbers">
                <button 
                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                    className="p-2 transition-colors"
                    style={{ 
                        borderRadius: 'var(--radius)',
                        backgroundColor: showLineNumbers ? 'var(--color-active)' : 'transparent',
                        color: showLineNumbers ? 'var(--color-text)' : 'var(--color-text-muted)'
                    }}
                >
                    <AlignJustify size={16} />
                </button>
             </Tooltip>
             <Tooltip content="Sync Scrolling">
                <button 
                    onClick={() => setSyncScroll(!syncScroll)}
                    className="p-2 transition-colors"
                    style={{ 
                        borderRadius: 'var(--radius)',
                        backgroundColor: syncScroll ? 'var(--color-active)' : 'transparent',
                        color: syncScroll ? 'var(--color-text)' : 'var(--color-text-muted)'
                    }}
                >
                    <MoveVertical size={16} />
                </button>
             </Tooltip>
        </div>

        {/* Theme Selector */}
         <div className="flex items-center gap-2">
            <Palette size={14} style={{ color: 'var(--color-text-muted)' }} />
             <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                className="h-8 px-2 py-1 text-xs border focus:outline-none cursor-pointer"
                style={{ 
                    backgroundColor: 'var(--color-bg)', 
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                    borderRadius: 'var(--radius)'
                }}
            >
                {Object.keys(THEME_CONFIG).map((k) => (
                    <option key={k} value={k}>{THEME_CONFIG[k as Theme].name}</option>
                ))}
            </select>
        </div>

        {/* Action Group: Settings & Download */}
        <div className="flex items-center gap-0.5">
            {/* Settings Button */}
            <div 
                className="relative z-50"
                onMouseEnter={() => setIsSettingsOpen(true)}
                onMouseLeave={() => setIsSettingsOpen(false)}
            >
                <button 
                    className={`p-2 transition-colors ${isSettingsOpen ? 'bg-[var(--color-active)]' : 'hover:bg-[var(--color-hover)]'}`}
                    style={{ color: 'var(--color-text-muted)', borderRadius: 'var(--radius)' }}
                >
                    <Settings size={16} />
                </button>

                {/* Settings Popover */}
                {isSettingsOpen && (
                    <div 
                        className="absolute top-full right-0 pt-2 w-64 animate-in fade-in slide-in-from-top-2 duration-100"
                    >
                        <div 
                            className="p-4 border shadow-2xl flex flex-col gap-4"
                            style={{ 
                                backgroundColor: 'var(--color-ui)', 
                                borderColor: 'var(--color-border)', 
                                borderRadius: 'var(--radius)' 
                            }}
                        >
                            {/* Header */}
                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-50 pb-2 border-b" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                Appearance
                            </div>

                            {/* Font Family */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Typeface</label>
                                <select 
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                                    className="h-8 px-2 text-xs border focus:outline-none cursor-pointer w-full"
                                    style={{ 
                                        backgroundColor: 'var(--color-bg)', 
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text)',
                                        borderRadius: 'var(--radius)'
                                    }}
                                >
                                    <option value={FontFamily.JETBRAINS}>JetBrains Mono</option>
                                    <option value={FontFamily.FIRA}>Fira Code</option>
                                    <option value={FontFamily.IBM}>IBM Plex Mono</option>
                                    <option value={FontFamily.INTER}>Inter</option>
                                    <option value={FontFamily.MANROPE}>Manrope</option>
                                </select>
                            </div>

                            {/* Font Size */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Font Size</label>
                                <div className="flex items-center border h-8 w-full" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                                    <button 
                                        className="px-3 h-full flex items-center justify-center hover:bg-[var(--color-hover)] transition-colors border-r"
                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                        onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                                    >-</button>
                                    <div className="flex-1 text-center text-xs" style={{ color: 'var(--color-text)' }}>
                                        {fontSize}px
                                    </div>
                                    <button 
                                        className="px-3 h-full flex items-center justify-center hover:bg-[var(--color-hover)] transition-colors border-l"
                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                        onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                                    >+</button>
                                </div>
                            </div>

                            {/* Border Radius */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Corner Radius</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 4, 8, 12].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setBorderRadius(r)}
                                            className={`h-8 border text-xs transition-all ${borderRadius === r ? 'ring-1 ring-offset-1 ring-blue-500' : 'hover:border-gray-400'}`}
                                            style={{ 
                                                borderRadius: `${r}px`,
                                                backgroundColor: 'var(--color-bg)',
                                                borderColor: borderRadius === r ? 'var(--color-accent)' : 'var(--color-border)',
                                                color: 'var(--color-text)'
                                            }}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Download Button */}
            <div 
                className="relative z-50"
                onMouseEnter={() => setIsDownloadOpen(true)}
                onMouseLeave={() => setIsDownloadOpen(false)}
            >
                <button 
                    className={`p-2 transition-colors ${isDownloadOpen ? 'bg-[var(--color-active)]' : 'hover:bg-[var(--color-hover)]'}`}
                    style={{ color: 'var(--color-text-muted)', borderRadius: 'var(--radius)' }}
                >
                    <Download size={16} />
                </button>

                {/* Download Popover */}
                {isDownloadOpen && (
                    <div 
                        className="absolute top-full right-0 pt-2 w-40 animate-in fade-in slide-in-from-top-2 duration-100"
                    >
                        <div 
                            className="p-1 border shadow-2xl flex flex-col"
                            style={{ 
                                backgroundColor: 'var(--color-ui)', 
                                borderColor: 'var(--color-border)', 
                                borderRadius: 'var(--radius)' 
                            }}
                        >
                            <button 
                                onClick={() => { onDownloadMd(); setIsDownloadOpen(false); }}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[var(--color-active)] rounded-sm"
                                style={{ color: 'var(--color-text)' }}
                            >
                                <FileText size={14} />
                                <span>Markdown (.md)</span>
                            </button>
                            <button 
                                onClick={() => { onPrint(); setIsDownloadOpen(false); }}
                                className="flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[var(--color-active)] rounded-sm"
                                style={{ color: 'var(--color-text)' }}
                            >
                                <File size={14} />
                                <span>PDF / Print</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};