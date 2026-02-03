import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Fira_Code, IBM_Plex_Mono, Manrope } from 'next/font/google';
import './globals.css';

import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nice Markdown | Technical Markdown Editor',
  description:
    'A precise, minimal, and serious markdown previewer designed for backend engineers and power users. Dark-mode first, keyboard-centric, and distraction-free.',
  keywords:
    'markdown, editor, previewer, developer tool, technical writing, syntax highlighting, mermaid diagrams, latex math, dark mode',
  authors: [{ name: 'GigaChad' }],
  openGraph: {
    type: 'website',
    url: 'https://nicemarkdown.com/',
    title: 'Nice Markdown | Technical Markdown Editor',
    description:
      'A precise, minimal, and serious markdown previewer designed for backend engineers and power users. Dark-mode first, keyboard-centric, and distraction-free.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nice Markdown | Technical Markdown Editor',
    description:
      'A precise, minimal, and serious markdown previewer designed for backend engineers and power users. Dark-mode first, keyboard-centric, and distraction-free.',
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-10 -5 1034 1034' fill='%233b82f6'%3E%3Cpath d='M922 319q-1 0 -2 1h-11v0h-836q-18 0 -33.5 8.5t-25.5 22.5q-17 26 -13 57v461q1 18 11 32.5t24 22.5q25 14 55 10v1l843 -1q18 -1 32.5 -11t22.5 -24q14 -24 10 -55h1l-1 -459q-1 -17 -11 -31.5t-24 -23.5q-19 -10 -42 -11zM918 367h2q12 0 20 5q6 3 8.5 6.5t2.5 9.5 l1 456v3q2 16 -5 29q-3 5 -6.5 7.5t-9.5 2.5l-840 1h-3q-16 2 -28 -5q-6 -3 -8.5 -6.5t-2.5 -9.5v-458l-1 -4q-2 -14 5.5 -25t18.5 -11h837zM145 464v327h96v-188l96 120l96 -120v188h96v-327h-96l-96 120l-96 -120h-96zM697 464v168h-96l144 159l144 -159h-96v-168h-96z'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${firaCode.variable} ${ibmPlexMono.variable} ${manrope.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css"
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
