export enum ViewMode {
  WRITE = 'WRITE',
  SPLIT = 'SPLIT',
  PREVIEW = 'PREVIEW'
}

export enum Theme {
  ATOM_ONE_DARK = 'ATOM_ONE_DARK',
  VOID = 'VOID',
  TERMINAL = 'TERMINAL',
  MIDNIGHT = 'MIDNIGHT',
  DRACULA = 'DRACULA',
  GITHUB_DARK = 'GITHUB_DARK',
  GITHUB_LIGHT = 'GITHUB_LIGHT',
  NORD_LIGHT = 'NORD_LIGHT'
}

export enum FontFamily {
  JETBRAINS = 'var(--font-jetbrains)',
  FIRA = 'var(--font-fira)',
  IBM = 'var(--font-ibm)',
  INTER = 'var(--font-inter)',
  MANROPE = 'var(--font-manrope)'
}

export interface AppState {
  markdown: string;
  viewMode: ViewMode;
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: number;
  showLineNumbers: boolean;
  syncScroll: boolean;
  borderRadius: number;
}

export type EditorStats = {
  chars: number;
  words: number;
  lines: number;
};

export interface ThemeColors {
  name: string;
  bg: string;
  ui: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  hover: string;
  active: string;
  codeBg: string;
  codeText: string;
  lineNum: string;
  scrollTrack: string;
  scrollThumb: string;
  tooltipBg: string;
  tooltipText: string;
}