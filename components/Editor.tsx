import React, { useRef, useMemo } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import { FontFamily } from '@/lib/types';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  fontFamily: FontFamily;
  fontSize: number;
  showLineNumbers: boolean;
  scrollRef: React.RefObject<HTMLTextAreaElement>;
}

export const Editor: React.FC<EditorProps> = ({
  value,
  onChange,
  fontFamily,
  fontSize,
  showLineNumbers,
  scrollRef,
}) => {
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => value.split('\n'), [value]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  };

  const highlightedCode = useMemo(() => {
    return Prism.highlight(value, Prism.languages.markdown, 'markdown');
  }, [value]);

  return (
    <div className="relative w-full h-full flex overflow-hidden bg-transparent">
      {/* Line Numbers */}
      {showLineNumbers && (
        <div 
          ref={lineNumbersRef}
          className="flex-shrink-0 flex flex-col items-end pr-3 pl-2 pt-[1.5rem] text-right select-none border-r border-dashed opacity-70 z-20 transition-colors duration-200 overflow-hidden"
          style={{ 
            fontFamily, 
            fontSize: `${fontSize}px`, 
            lineHeight: 1.6,
            minWidth: '3.5em',
            height: '100%',
            borderColor: 'var(--color-border)',
            color: 'var(--color-line-num)',
            paddingBottom: '2rem' // Match editor padding
          }}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      )}

      {/* Editor Area */}
      <div className="relative flex-grow h-full overflow-hidden">
        {/* Highlight Layer (Behind) */}
        <pre
          ref={highlightRef}
          className="editor-layer editor-highlight pointer-events-none"
          style={{ 
            fontFamily, 
            fontSize: `${fontSize}px`, 
            padding: '1.5rem 2rem 2rem 2rem', // Top 1.5rem matches Preview py-6, sides matches px-8
            color: 'var(--color-text-active)'
          }}
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedCode + '<br />' }} 
        />

        {/* Input Layer (Top) */}
        <textarea
          ref={scrollRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className="editor-layer editor-textarea w-full h-full resize-none bg-transparent text-transparent focus:outline-none"
          style={{ 
            fontFamily, 
            fontSize: `${fontSize}px`, 
            padding: '1.5rem 2rem 2rem 2rem'
          }}
        />
      </div>
    </div>
  );
};
