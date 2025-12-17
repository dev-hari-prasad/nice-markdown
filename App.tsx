import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Toolbar } from './components/Toolbar';
import { ViewMode, Theme, FontFamily, EditorStats } from './types';
import { THEME_CONFIG, DEFAULT_MARKDOWN } from './constants';
import { useScrollSync } from './hooks/useScrollSync';
import { X } from 'lucide-react';

const App: React.FC = () => {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [theme, setTheme] = useState<Theme>(Theme.ATOM_ONE_DARK);
  const [fontFamily, setFontFamily] = useState<FontFamily>(FontFamily.JETBRAINS);
  const [fontSize, setFontSize] = useState(14);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [syncScroll, setSyncScroll] = useState(true);
  const [borderRadius, setBorderRadius] = useState(0);
  const [isCentered, setIsCentered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);
  
  // Promotion state
  const [showStarPrompt, setShowStarPrompt] = useState(false);
  const [promoCountdown, setPromoCountdown] = useState(5);

  // Split pane resizing state
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll Sync Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Enable sync hook
  useScrollSync(editorRef, previewRef, syncScroll, viewMode);

  // Check local storage for star prompt
  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('devmark_star_prompt_seen');
    if (!hasSeenPrompt) {
        // Small delay to avoid jarring pop-in
        const timer = setTimeout(() => setShowStarPrompt(true), 1500);
        return () => clearTimeout(timer);
    }
  }, []);

  const dismissStarPrompt = () => {
    setShowStarPrompt(false);
    localStorage.setItem('devmark_star_prompt_seen', 'true');
  };

  // Countdown timer for prompt
  useEffect(() => {
    if (showStarPrompt && promoCountdown > 0) {
        const timer = setTimeout(() => {
            setPromoCountdown(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    } else if (showStarPrompt && promoCountdown === 0) {
        dismissStarPrompt();
    }
  }, [showStarPrompt, promoCountdown]);

  // Stats calculation
  const stats: EditorStats = useMemo(() => ({
    chars: markdown.length,
    words: markdown.trim().split(/\s+/).filter(w => w.length > 0).length,
    lines: markdown.split('\n').length
  }), [markdown]);

  const searchResults = useMemo(
    () => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return [];

      return markdown
        .split('\n')
        .map((text, idx) => ({ line: idx + 1, text }))
        .filter(r => r.text.toLowerCase().includes(q))
        .slice(0, 8);
    },
    [markdown, searchQuery]
  );

  const handleJumpToLine = (line: number) => {
    if (!editorRef.current) return;

    const totalLines = stats.lines || 1;
    const ratio = totalLines > 1 ? (line - 1) / (totalLines - 1) : 0;

    const editorEl = editorRef.current;
    const editorTarget =
      ratio * (editorEl.scrollHeight - editorEl.clientHeight);
    editorEl.scrollTop = editorTarget;

    if (previewRef.current && syncScroll) {
      const previewEl = previewRef.current;
      const previewTarget =
        ratio * (previewEl.scrollHeight - previewEl.clientHeight);
      previewEl.scrollTop = previewTarget;
    }
  };

  const currentTheme = THEME_CONFIG[theme];

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCodeCopied = () => {
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 1500);
  };

  // Dragging logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const newPercentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        
        setSplitPercentage(Math.min(Math.max(newPercentage, 20), 80));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    } else {
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }

    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    };
  }, [isDragging]);

  return (
    <div 
        className="app-container h-screen w-screen flex flex-col overflow-hidden transition-colors duration-200"
        style={{
            // Inject CSS Variables for Global Theming
            '--color-bg': currentTheme.bg,
            '--color-ui': currentTheme.ui,
            '--color-border': currentTheme.border,
            '--color-text': currentTheme.text,
            '--color-text-muted': currentTheme.textMuted,
            '--color-accent': currentTheme.accent,
            '--color-hover': currentTheme.hover,
            '--color-active': currentTheme.active,
            '--color-code-bg': currentTheme.codeBg,
            '--color-code-text': currentTheme.codeText,
            '--color-line-num': currentTheme.lineNum,
            '--color-scroll-track': currentTheme.scrollTrack,
            '--color-scroll-thumb': currentTheme.scrollThumb,
            '--color-tooltip-bg': currentTheme.tooltipBg,
            '--color-tooltip-text': currentTheme.tooltipText,
            
            // Dynamic Border Radius
            '--radius': `${borderRadius}px`,
            
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)'
        } as React.CSSProperties}
    >
      <Toolbar 
        viewMode={viewMode}
        setViewMode={setViewMode}
        theme={theme}
        setTheme={setTheme}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        fontSize={fontSize}
        setFontSize={setFontSize}
        showLineNumbers={showLineNumbers}
        setShowLineNumbers={setShowLineNumbers}
        syncScroll={syncScroll}
        setSyncScroll={setSyncScroll}
        borderRadius={borderRadius}
        setBorderRadius={setBorderRadius}
        onDownloadMd={handleDownloadMd}
        onPrint={handlePrint}
        isCentered={isCentered}
        setIsCentered={setIsCentered}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        onSelectSearchResult={handleJumpToLine}
      />

      <div 
        ref={containerRef} 
        className={`
            main-area flex-grow flex relative overflow-hidden w-full 
            ${isCentered && viewMode !== ViewMode.SPLIT ? 'justify-center' : ''}
        `}
      >
        
        {/* Editor Pane */}
        <div 
            className={`
                editor-pane h-full overflow-hidden transition-all duration-0
                ${viewMode === ViewMode.WRITE ? 'block' : ''}
                ${viewMode === ViewMode.PREVIEW ? 'hidden' : ''}
                ${viewMode === ViewMode.SPLIT ? 'block' : ''}
                ${isCentered && viewMode === ViewMode.WRITE ? 'w-[70%]' : 'w-full'}
            `}
            style={{ 
                width: viewMode === ViewMode.SPLIT ? `${splitPercentage}%` : undefined,
                borderRight: viewMode === ViewMode.SPLIT ? '1px solid var(--color-border)' : 'none',
                maxWidth: isCentered && viewMode === ViewMode.WRITE ? '70%' : '100%',
            }}
        >
            <Editor 
                value={markdown}
                onChange={setMarkdown}
                fontFamily={fontFamily}
                fontSize={fontSize}
                showLineNumbers={showLineNumbers}
                scrollRef={editorRef}
            />
        </div>

        {/* Resizer Handle */}
        {viewMode === ViewMode.SPLIT && (
            <div 
                className="resizer w-1 -ml-0.5 hover:w-1.5 transition-all cursor-col-resize z-30 flex-shrink-0"
                style={{ backgroundColor: 'transparent' }}
                onMouseDown={() => setIsDragging(true)}
            />
        )}

        {/* Preview Pane */}
        <div 
            className={`
                preview-pane h-full overflow-hidden
                ${viewMode === ViewMode.PREVIEW ? 'block' : ''}
                ${viewMode === ViewMode.WRITE ? 'hidden' : ''}
                ${viewMode === ViewMode.SPLIT ? 'block' : ''}
                ${isCentered && viewMode === ViewMode.PREVIEW ? 'w-[70%]' : 'w-full'}
            `}
            style={{ 
                width: viewMode === ViewMode.SPLIT ? `${100 - splitPercentage}%` : undefined,
                maxWidth: isCentered && viewMode === ViewMode.PREVIEW ? '70%' : '100%',
            }}
        >
        <Preview 
                content={markdown}
                fontFamily={fontFamily}
                fontSize={fontSize}
                scrollRef={previewRef}
                theme={currentTheme}
                onCodeCopy={handleCodeCopied}
                searchQuery={searchQuery}
            />
        </div>

      </div>

      {/* Footer / Status Bar */}
      <div 
        className="footer-statusbar h-8 border-t flex items-center justify-between px-4 text-[10px] uppercase tracking-wider font-mono select-none shrink-0 transition-colors duration-200" 
        style={{ 
            borderColor: 'var(--color-border)', 
            backgroundColor: 'var(--color-ui)',
            color: 'var(--color-text-muted)'
        }}
      >
         {/* Left: Credits */}
         <div className="flex items-center gap-2 relative">
            <div className="flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity">
                <span>Built by{' '}
                      <a href="https://github.com/dev-hari-prasad"  target="_blank" rel="noopener noreferrer"
                        style={{
                          color: 'var(--color-text)',
                          fontWeight: 'bold' }}>Hari Prasad 
                      </a>
                </span>
              <span className="mx-1">•</span>
            </div>
            
            <div className="relative group">
                <a 
                    href="https://github.com/dev-hari-prasad/nice-markdown" 
                    target="_blank" 
                    onClick={dismissStarPrompt}
                    className="hover:underline flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity" 
                    style={{ color: 'var(--color-accent)' }}
                >
                    Star on GitHub ★
                </a>

                {/* Star Promotion Tooltip */}
                {showStarPrompt && (
                    <div 
                        className="absolute bottom-full left-1/2 mb-4 w-64 p-3 border shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ 
                            backgroundColor: 'var(--color-tooltip-bg)', 
                            color: 'var(--color-tooltip-text)',
                            borderColor: 'var(--color-accent)', 
                            borderRadius: 'var(--radius)',
                            transform: 'translateX(-15%)',
                            opacity: 1 // Force opacity
                        }}
                    >
                         {/* Arrow */}
                        <div 
                            className="absolute top-full left-[15%] w-2 h-2 -mt-1 border-b border-r transform rotate-45"
                            style={{ 
                                backgroundColor: 'var(--color-tooltip-bg)', 
                                borderColor: 'var(--color-accent)' 
                            }}
                        ></div>

                        <div className="flex items-start gap-3">
                             <div className="flex-1 text-[11px] leading-relaxed normal-case tracking-normal">
                                <p className="mb-1 font-bold" style={{ color: 'var(--color-accent)' }}>Enjoying Nice Markdown?</p>
                                <p className="mb-1">Please take a moment to <strong>Star the repo</strong> on GitHub!</p>
                                <p className="text-[10px] opacity-60">Auto-closing in {promoCountdown}s...</p>
                             </div>
                             <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissStarPrompt(); }}
                                className="opacity-50 hover:opacity-100 transition-opacity p-0.5"
                                style={{ color: 'var(--color-tooltip-text)' }}
                             >
                                <X size={14} />
                             </button>
                        </div>
                    </div>
                )}
            </div>
         </div>

         {/* Right: Stats */}
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span>Lines:</span>
                <span style={{ color: 'var(--color-text)' }}>{stats.lines}</span>
            </div>
            <div className="flex items-center gap-2">
                <span>Words:</span>
                <span style={{ color: 'var(--color-text)' }}>{stats.words}</span>
            </div>
            <div className="flex items-center gap-2">
                <span>Chars:</span>
                <span style={{ color: 'var(--color-text)' }}>{stats.chars}</span>
            </div>
            <div className="w-px h-3 mx-2" style={{ backgroundColor: 'var(--color-border)' }}></div>
            <div className="font-bold" style={{ color: 'var(--color-accent)' }}>UTF-8</div>
         </div>
      </div>

      {showCopyToast && (
        <div
          className="fixed bottom-6 right-6 px-3 py-2 text-xs border shadow-lg"
          style={{
            backgroundColor: 'var(--color-ui)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius)'
          }}
        >
          Copied to clipboard
        </div>
      )}
    </div>
  );
};

export default App;
