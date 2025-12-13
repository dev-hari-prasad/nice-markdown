import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import { FontFamily, ThemeColors } from '../types';

interface PreviewProps {
  content: string;
  fontFamily: FontFamily;
  fontSize: number;
  scrollRef: React.RefObject<HTMLDivElement>;
  theme: ThemeColors;
}

// Helper for Mermaid
const MermaidDiagram = ({ chart, theme }: { chart: string, theme: ThemeColors }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = React.useState('');

  useEffect(() => {
    mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'base',
        themeVariables: {
           background: 'transparent',
           primaryColor: theme.bg,
           primaryTextColor: theme.text,
           secondaryColor: theme.ui,
           tertiaryColor: theme.codeBg,
           edgeLabelBackground: theme.bg,
           nodeBorder: theme.border,
           mainBkg: theme.codeBg,
           lineColor: theme.textMuted
        },
        fontFamily: 'JetBrains Mono',
        securityLevel: 'loose'
    });
    
    const renderChart = async () => {
        if (!ref.current) return;
        try {
            const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart);
            setSvg(svg);
        } catch (e) {
            console.error('Mermaid render error:', e);
            // Fallback for invalid syntax
            setSvg(`<pre style="color: var(--color-text); font-size: 0.75rem; padding: 0.5rem; border: 1px solid var(--color-border); background: var(--color-code-bg); border-radius: 6px;">${(e as Error).message}</pre>`);
        }
    };
    renderChart();
  }, [chart, theme]);

  return <div className="mermaid" ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />;
};

export const Preview: React.FC<PreviewProps> = ({ content, fontFamily, fontSize, scrollRef, theme }) => {
  
  return (
    <div 
        ref={scrollRef}
        className="h-full w-full overflow-y-auto px-8 py-6 markdown-body transition-colors duration-200"
        style={{ 
            fontFamily, 
            fontSize: `${fontSize}px`,
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)'
        }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isMermaid = match && match[1] === 'mermaid';
            
            if (!inline && isMermaid) {
              return <MermaidDiagram chart={String(children).replace(/\n$/, '')} theme={theme} />;
            }
            
            return !inline && match ? (
              <div className="relative group my-4 rounded-md overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                <div className="absolute top-0 right-0 px-2 py-1 text-[10px] uppercase tracking-wider opacity-50 font-bold z-10 select-none" style={{ backgroundColor: 'var(--color-ui)', color: 'var(--color-text-muted)' }}>
                    {match[1]}
                </div>
                <pre className={className} style={{ margin: 0, border: 'none' }}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom renderers
          table: ({ children }) => <div className="overflow-x-auto my-6"><table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table></div>,
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Footer spacer */}
      <div className="h-32"></div> 
    </div>
  );
};
