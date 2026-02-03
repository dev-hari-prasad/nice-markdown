"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type SidebarContextType = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  isChatOpen: boolean
  setChatOpen: (isOpen: boolean) => void
  toggleChat: () => void
}

const SidebarContext = createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within SidebarProvider")
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isChatOpen, setChatOpen] = useState(false)

  // Persist sidebar state
  useEffect(() => {
     const saved = localStorage.getItem('sidebar_collapsed');
     if (saved) {
         setCollapsed(saved === 'true');
     }
     const savedChat = localStorage.getItem('chat_open');
     if (savedChat) {
         setChatOpen(savedChat === 'true');
     }
  }, []);

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('sidebar_collapsed', String(val))
  }

  const toggleSidebar = () => handleSetCollapsed(!collapsed)

  const handleSetChatOpen = (val: boolean) => {
    setChatOpen(val)
    localStorage.setItem('chat_open', String(val))
  }

  const toggleChat = () => handleSetChatOpen(!isChatOpen)

  return (
    <SidebarContext.Provider value={{ 
        collapsed, 
        setCollapsed: handleSetCollapsed, 
        toggleSidebar,
        isChatOpen,
        setChatOpen: handleSetChatOpen,
        toggleChat
    }}>
      {children}
    </SidebarContext.Provider>
  )
}
