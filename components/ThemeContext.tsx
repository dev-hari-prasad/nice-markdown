"use client"

import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import { Theme, FontFamily } from "@/lib/types"
import { THEME_CONFIG } from "@/lib/constants"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  currentTheme: typeof THEME_CONFIG[Theme]
  fontFamily: FontFamily
  setFontFamily: (font: FontFamily) => void
  borderRadius: number
  setBorderRadius: (radius: number) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(Theme.ATOM_ONE_DARK)
  const [fontFamily, setFontFamily] = useState<FontFamily>(FontFamily.JETBRAINS)
  const [borderRadius, setBorderRadius] = useState(0)

  const currentTheme = useMemo(() => THEME_CONFIG[theme], [theme])

  // Helper to convert hex to HSL for Tailwind classes
  const hexToHSL = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt("0x" + hex[1] + hex[1]);
      g = parseInt("0x" + hex[2] + hex[2]);
      b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
      r = parseInt("0x" + hex[1] + hex[2]);
      g = parseInt("0x" + hex[3] + hex[4]);
      b = parseInt("0x" + hex[5] + hex[6]);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const cmin = Math.min(r, g, b),
      cmax = Math.max(r, g, b),
      delta = cmax - cmin;
    let h = 0,
      s = 0,
      l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return `${h} ${s}% ${l}%`;
  }

  useEffect(() => {
    const root = document.documentElement;

    // Set Custom Variables (Hex)
    root.style.setProperty('--color-bg', currentTheme.bg);
    root.style.setProperty('--color-ui', currentTheme.ui);
    root.style.setProperty('--color-border', currentTheme.border);
    root.style.setProperty('--color-text', currentTheme.text);
    root.style.setProperty('--color-text-muted', currentTheme.textMuted);
    root.style.setProperty('--color-accent', currentTheme.accent);
    root.style.setProperty('--color-hover', currentTheme.hover);
    root.style.setProperty('--color-active', currentTheme.active);
    root.style.setProperty('--color-code-bg', currentTheme.codeBg);
    root.style.setProperty('--color-code-text', currentTheme.codeText);
    root.style.setProperty('--radius', `${borderRadius}px`);

    // Set Shadcn Variables (HSL)
    root.style.setProperty('--background', hexToHSL(currentTheme.bg));
    root.style.setProperty('--foreground', hexToHSL(currentTheme.text));
    root.style.setProperty('--card', hexToHSL(currentTheme.ui));
    root.style.setProperty('--card-foreground', hexToHSL(currentTheme.text));
    root.style.setProperty('--popover', hexToHSL(currentTheme.ui));
    root.style.setProperty('--popover-foreground', hexToHSL(currentTheme.text));
    root.style.setProperty('--primary', hexToHSL(currentTheme.accent));
    root.style.setProperty('--primary-foreground', '0 0% 100%'); // White text on primary
    root.style.setProperty('--secondary', hexToHSL(currentTheme.hover));
    root.style.setProperty('--secondary-foreground', hexToHSL(currentTheme.text));
    root.style.setProperty('--muted', hexToHSL(currentTheme.ui));
    root.style.setProperty('--muted-foreground', hexToHSL(currentTheme.textMuted));
    root.style.setProperty('--accent', hexToHSL(currentTheme.hover)); // Hover state color
    root.style.setProperty('--accent-foreground', hexToHSL(currentTheme.text));
    root.style.setProperty('--destructive', '0 84.2% 60.2%'); // Red
    root.style.setProperty('--destructive-foreground', '0 0% 98%'); // White
    root.style.setProperty('--border', hexToHSL(currentTheme.border));
    root.style.setProperty('--input', hexToHSL(currentTheme.border));
    root.style.setProperty('--ring', hexToHSL(currentTheme.accent));

  }, [currentTheme, borderRadius]);

  return (
    <ThemeContext.Provider value={{ 
        theme, setTheme, currentTheme,
        fontFamily, setFontFamily,
        borderRadius, setBorderRadius
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
