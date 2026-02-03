import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import { Copy } from 'lucide-react';
import { FontFamily, ThemeColors } from '@/lib/types';

interface PreviewProps {
  content: string;
  fontFamily: FontFamily;
  fontSize: number;
  scrollRef: React.RefObject<HTMLDivElement>;
  theme: ThemeColors;
  onCodeCopy?: () => void;
  searchQuery?: string;
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

interface CodeBlockProps {
  lang: string;
  className?: string;
  children: React.ReactNode;
  codeProps: any;
}

const CodeBlock: React.FC<
  CodeBlockProps & { onCodeCopy?: () => void; searchQuery?: string }
> = ({
  lang,
  className,
  children,
  codeProps,
  onCodeCopy,
  searchQuery,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCodeCopy?.();
  };

  return (
    <div
      className="relative group my-4"
      style={{
        backgroundColor: 'var(--color-code-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        overflowX: 'auto',
      }}
    >
      <div className="absolute top-2 right-2 flex items-center gap-2 text-[10px] uppercase tracking-wide">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="px-1.5 py-0.5 border flex items-center justify-center"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: copied ? 'var(--color-accent)' : 'var(--color-ui)',
            borderColor: 'var(--color-border)',
            color: copied ? 'var(--color-text)' : 'var(--color-text-muted)'
          }}
        >
          <Copy size={12} />
        </button>
        <span
          className="px-2 py-0.5 border"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--color-ui)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)'
          }}
        >
          {lang}
        </span>
      </div>
      <pre className={className} style={{ margin: 0, border: 'none' }}>
        <code
          className={className}
          {...codeProps}
          dangerouslySetInnerHTML={{
            __html: highlightSearchInHtml(
              Prism.highlight(
                String(children).replace(/\n$/, ''),
                // @ts-expect-error dynamic language lookup
                Prism.languages[lang] || Prism.languages.markdown,
                lang
              ),
              searchQuery
            ),
          }}
        />
      </pre>
    </div>
  );
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const highlightSearchInHtml = (html: string, query?: string) => {
  const q = query?.trim();
  if (!q) return html;

  const qLower = q.toLowerCase();
  const qLen = q.length;
  let result = '';
  let i = 0;
  let insideTag = false;

  while (i < html.length) {
    const ch = html[i];

    if (ch === '<') {
      insideTag = true;
      result += ch;
      i++;
      continue;
    }

    if (ch === '>' && insideTag) {
      insideTag = false;
      result += ch;
      i++;
      continue;
    }

    if (!insideTag) {
      const remaining = html.slice(i);
      const idx = remaining.toLowerCase().indexOf(qLower);
      if (idx === -1) {
        result += remaining;
        break;
      }
      result += remaining.slice(0, idx);
      result += `<span class="search-hit">${remaining.slice(
        idx,
        idx + qLen
      )}</span>`;
      i += idx + qLen;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
};

const highlightNodeText = (
  children: React.ReactNode,
  query?: string
): React.ReactNode => {
  const q = query?.trim();
  if (!q) return children;

  const regex = new RegExp(`(${escapeRegExp(q)})`, 'gi');

  return React.Children.map(children, (child) => {
    if (typeof child !== 'string') return child;
    const parts = child.split(regex);
    if (parts.length === 1) return child;
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <span key={index} className="search-hit">
          {part}
        </span>
      ) : (
        part
      )
    );
  });
};

export const Preview: React.FC<PreviewProps> = ({
  content,
  fontFamily,
  fontSize,
  scrollRef,
  theme,
  onCodeCopy,
  searchQuery,
}) => {
  
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
              <CodeBlock
                lang={match[1]}
                className={className}
                codeProps={props}
                onCodeCopy={onCodeCopy}
                searchQuery={searchQuery}
              >
                {children}
              </CodeBlock>
            ) : (
              <code className={className} {...props}>
                {highlightNodeText(children, searchQuery)}
              </code>
            );
          },
          p({ node, children, ...props }: any) {
            return (
              <p {...props}>{highlightNodeText(children, searchQuery)}</p>
            );
          },
          li({ node, children, ...props }: any) {
            return (
              <li {...props}>{highlightNodeText(children, searchQuery)}</li>
            );
          },
          h1({ node, children, ...props }: any) {
            return (
              <h1 {...props}>{highlightNodeText(children, searchQuery)}</h1>
            );
          },
          h2({ node, children, ...props }: any) {
            return (
              <h2 {...props}>{highlightNodeText(children, searchQuery)}</h2>
            );
          },
          h3({ node, children, ...props }: any) {
            return (
              <h3 {...props}>{highlightNodeText(children, searchQuery)}</h3>
            );
          },
          h4({ node, children, ...props }: any) {
            return (
              <h4 {...props}>{highlightNodeText(children, searchQuery)}</h4>
            );
          },
          // Custom renderers
          table: ({ node, children, ...props }: any) => <div className="overflow-x-auto my-6"><table style={{ width: '100%', borderCollapse: 'collapse' }} {...props}>{children}</table></div>,
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Footer spacer */}
      <div className="h-12"></div> 
    </div>
  );
};
