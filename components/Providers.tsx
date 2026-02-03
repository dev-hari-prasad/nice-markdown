"use client"
import React from "react";
import { FileProvider } from "@/components/FileContext";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeProvider, useTheme } from "@/components/ThemeContext";
import { SidebarProvider } from "@/components/SidebarContext";

function AppLayout({ children }: { children: React.ReactNode }) {
    const { currentTheme } = useTheme();

    return (
        <div 
            className="flex h-screen w-full overflow-hidden transition-colors duration-200"
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
                
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-text)'
            } as React.CSSProperties}
        >
            <AppSidebar />
            <ChatInterface />
            <main className="flex-1 overflow-hidden h-full relative">
                {children}
            </main>
        </div>
    )
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <FileProvider>
                <SidebarProvider>
                     <AppLayout>{children}</AppLayout>
                </SidebarProvider>
            </FileProvider>
        </ThemeProvider>
    )
}
