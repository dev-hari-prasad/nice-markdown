import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Theme, FontFamily } from '@/lib/types';
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
  Minimize2,
  Search,
  SidebarOpen,
  MessageSquare,
} from 'lucide-react';
import { THEME_CONFIG } from '@/lib/constants';
import { Tooltip } from './ui/Tooltip';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useSidebar } from '@/components/SidebarContext';

type SearchResult = {
  line: number;
  text: string;
};

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
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];
  onSelectSearchResult: (line: number) => void;
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
  setIsCentered,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSelectSearchResult,
}) => {
  const { collapsed, toggleSidebar, isChatOpen, toggleChat } = useSidebar();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if the click is inside any Radix portal or a dialog
      // This covers Select dropdowns, Dialogs, etc.
      const isRadixNode = target.closest('[data-radix-portal]') || 
                         target.closest('[role="dialog"]') ||
                         target.closest('[role="listbox"]') ||
                         target.closest('[role="menu"]');
      
      if (isRadixNode) return;

      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
      if (downloadRef.current && !downloadRef.current.contains(target)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setActiveResultIndex(-1);
  }, [searchQuery, searchResults.length]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveResultIndex((prev) => {
        const next = prev + 1;
        return next >= searchResults.length ? 0 : next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveResultIndex((prev) => {
        if (prev === -1 || prev === 0) return searchResults.length - 1;
        return prev - 1;
      });
    } else if (e.key === 'Enter') {
      if (!searchResults.length) return;
      e.preventDefault();
      const index =
        activeResultIndex >= 0 && activeResultIndex < searchResults.length
          ? activeResultIndex
          : 0;
      const target = searchResults[index];
      onSelectSearchResult(target.line);
      setIsSearchActive(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="toolbar-container p-2.5 border-b flex items-center px-4 select-none shrink-0 relative transition-colors duration-200" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-ui)' }}>
      
      {collapsed && (
          <Tooltip content="Open Sidebar">
              <button 
                onClick={toggleSidebar} 
                className="mr-4 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-center" 
                style={{ color: 'var(--color-text)' }}
              >
                  <SidebarOpen size={18} />
              </button>
          </Tooltip>
      )}

      {/* Chat Button */}
      <Tooltip content="AI Chat">
          <button
              onClick={toggleChat}
              className={`p-2 mr-4 rounded-md transition-colors flex items-center justify-center ${isChatOpen ? 'bg-[var(--color-active)]' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
              style={{ color: isChatOpen ? 'var(--color-text)' : 'var(--color-text-muted)' }}
          >
              <MessageSquare size={18} />
          </button>
      </Tooltip>

      {/* Left: Mode Switch */}
      <div className="flex items-center gap-4">
        {/* View Mode Switcher Group */}
        <div className="flex items-center gap-2">
            <div className="flex items-center p-[2px] px-2 border h-9 gap-1" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
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

      {/* Center: Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-sm">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search text..."
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setIsSearchActive(true)}
            onBlur={() => setIsSearchActive(false)}
            className="h-9 pl-7 pr-16 text-xs border focus:outline-none w-full transition-all"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
              borderRadius: 'var(--radius)',
              fontFamily: fontFamily
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
            <kbd 
              className="px-1.5 py-0.5 rounded border border-current opacity-60 text-[9px] font-sans flex items-center bg-muted/50"
              style={{ 
                borderColor: 'var(--color-text-muted)', 
                color: 'var(--color-text-muted)',
                backgroundColor: 'rgba(128, 128, 128, 0.1)'
              }}
            >
              <span className="mr-0.5">Ctrl</span>
              <span>K</span>
            </kbd>
          </div>
          {searchQuery && isSearchActive && (
            <div
              className="absolute mt-1 w-full max-h-56 overflow-y-auto border shadow-lg text-xs z-50"
              style={{
                backgroundColor: 'var(--color-ui)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius)',
                fontFamily: fontFamily
              }}
            >
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={result.line}
                    className={`px-2 py-1 cursor-default transition-transform ${
                      index === activeResultIndex
                        ? 'scale-[0.98]'
                        : 'hover:bg-[var(--color-hover)]'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setActiveResultIndex(index);
                      onSelectSearchResult(result.line);
                      setIsSearchActive(false);
                      searchInputRef.current?.blur();
                    }}
                    title={result.text}
                    style={{ 
                      color: 'var(--color-text)',
                      borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                      backgroundColor:
                        index === activeResultIndex ? 'rgba(250, 204, 21, 0.2)' : 'transparent'
                    }}
                  >
                    <span className="mr-1 opacity-60">#{result.line}</span>
                    <span className="truncate inline-block max-w-[9rem] align-middle">
                      {result.text || '(blank line)'}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  className="px-2 py-1 opacity-60"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  No matches
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-1 ml-auto">
            {/* Settings Button */}
            <div 
                className="relative z-50"
                ref={settingsRef}
            >
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`p-2 transition-colors ${isSettingsOpen ? 'bg-[var(--color-active)]' : 'hover:bg-[var(--color-bg)]'}`}
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

                            {/* Line Numbers */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                    Line numbers
                                </span>
                                <button
                                    onClick={() => setShowLineNumbers(!showLineNumbers)}
                                    className="flex items-center gap-1 px-2 py-1 text-[11px] border transition-colors"
                                    style={{
                                        borderRadius: 'var(--radius)',
                                        backgroundColor: showLineNumbers ? 'var(--color-active)' : 'var(--color-bg)',
                                        borderColor: 'var(--color-border)',
                                        color: showLineNumbers ? 'var(--color-text)' : 'var(--color-text-muted)'
                                    }}
                                >
                                    <AlignJustify size={12} />
                                    {showLineNumbers ? 'On' : 'Off'}
                                </button>
                            </div>

                            {/* Sync Scrolling */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                                    Sync scrolling
                                </span>
                                <button
                                    onClick={() => setSyncScroll(!syncScroll)}
                                    className="flex items-center gap-1 px-2 py-1 text-[11px] border transition-colors"
                                    style={{
                                        borderRadius: 'var(--radius)',
                                        backgroundColor: syncScroll ? 'var(--color-active)' : 'var(--color-bg)',
                                        borderColor: 'var(--color-border)',
                                        color: syncScroll ? 'var(--color-text)' : 'var(--color-text-muted)'
                                    }}
                                >
                                    <MoveVertical size={12} />
                                    {syncScroll ? 'On' : 'Off'}
                                </button>
                            </div>

                            {/* Database Settings */}
                            <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <SettingsDialog />
                            </div>
                        </div>
                    </div>
                )}
            </div>


            {/* Download Button */}
            <div  
                className="relative z-50"
                ref={downloadRef}
            >
                <button 
                    onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                    className={`p-2 transition-colors ${isDownloadOpen ? 'bg-[var(--color-active)]' : 'hover:bg-[var(--color-bg)]'}`}
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