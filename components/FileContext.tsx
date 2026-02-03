"use client"

import React, { createContext, useContext, useState, useMemo, useEffect } from "react"
import { useFileSystem, FileSystemItem } from "@/hooks/useFileSystem"
import { TreeViewElement } from "@/components/ui/file-tree"

type FileContextType = {
  files: FileSystemItem[]
  fileTree: TreeViewElement[]
  activeFileId: string | null
  setActiveFileId: (id: string | null) => void
  activeFile: FileSystemItem | undefined
  createFile: (name: string, parentId?: string | null) => Promise<void>
  createFolder: (name: string, parentId?: string | null) => Promise<void>
  deleteFile: (id: string) => Promise<void>
  renameFile: (id: string, newName: string) => Promise<void>
  moveItem: (id: string, newParentId: string | null) => Promise<void>
  updateFileContent: (id: string, content: string) => void
  loadFileContent: (id: string) => Promise<string>
  loading: boolean
}

const FileContext = createContext<FileContextType | null>(null)

export function useFileContext() {
  const context = useContext(FileContext)
  if (!context) throw new Error("useFileContext must be used within FileProvider")
  return context
}

export function FileProvider({ children }: { children: React.ReactNode }) {
  const { files, loading, createItem, deleteItem, persistItem, updateFileState, loadFileContent } = useFileSystem()
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [hasRestoredSet, setHasRestoredSet] = useState(false)
  
  const saveTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({})

  // Store active file ID in local storage
  useEffect(() => {
    if (activeFileId) {
      localStorage.setItem('last_active_file_id', activeFileId);
    }
  }, [activeFileId]);

  // Load content when active file changes
  useEffect(() => {
    if (activeFileId) {
      const file = files.find(f => f.id === activeFileId);
      // If we have the file object, but content is undefined, fetch it
      if (file && !file.isFolder && file.content === undefined) {
          loadFileContent(activeFileId);
      }
    }
  }, [activeFileId, files, loadFileContent]);

  // Restore active file ID once files are loaded
  useEffect(() => {
    if (!loading && files.length > 0 && !hasRestoredSet) {
      const storedId = localStorage.getItem('last_active_file_id');
      if (storedId && files.some(f => f.id === storedId && !f.isFolder)) {
        setActiveFileId(storedId);
        // Also trigger load for it right away if needed
        loadFileContent(storedId);
      } else {
        // Fallback to first file if nothing stored or file deleted
        const firstFile = files.find(f => !f.isFolder);
        if (firstFile) {
            setActiveFileId(firstFile.id);
            loadFileContent(firstFile.id);
        }
      }
      setHasRestoredSet(true);
    }
  }, [loading, files, hasRestoredSet, loadFileContent]);


  const updateFileContent = (id: string, content: string) => {
    // Update local state immediately so UI is responsive and switching files works
    updateFileState(id, { content });

    const file = files.find(f => f.id === id);
    if (!file || file.isFolder) return; 

    const newFile = { ...file, content, updatedAt: Date.now() };

    if (saveTimeouts.current[id]) clearTimeout(saveTimeouts.current[id]);
    
    saveTimeouts.current[id] = setTimeout(() => {
        persistItem(newFile);
    }, 1000); 
  }

  const fileTree = useMemo(() => {
    const buildTree = (parentId: string | null): TreeViewElement[] => {
      return files
        .filter(f => f.parentId === parentId) // Note: parentId null vs undefined check
        .map(f => ({
          id: f.id,
          name: f.name,
          parentId: f.parentId,
          isSelectable: !f.isFolder,
          children: f.isFolder ? buildTree(f.id) : undefined
        }))
    }
    return buildTree(null)
  }, [files])

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId])

  return (
    <FileContext.Provider value={{
      files,
      fileTree,
      activeFileId,
      setActiveFileId,
      activeFile,
      createFile: async (name, pid) => { 
        const newItem = await createItem(name, false, pid); 
        if (newItem) setActiveFileId(newItem.id);
      },
      createFolder: async (name, pid) => { await createItem(name, true, pid) },
      deleteFile: async (id) => { 
        if (activeFileId === id) setActiveFileId(null)
        await deleteItem(id) 
      },
      renameFile: async (id, newName) => {
        const file = files.find(f => f.id === id);
        if (!file) return;
        updateFileState(id, { name: newName });
        await persistItem({ ...file, name: newName, updatedAt: Date.now() });
      },
      moveItem: async (id, newParentId) => {
        const file = files.find(f => f.id === id);
        if (!file) return;
        updateFileState(id, { parentId: newParentId });
        await persistItem({ ...file, parentId: newParentId, updatedAt: Date.now() });
      },
      updateFileContent,
      loadFileContent,
      loading
    }}>
      {children}
    </FileContext.Provider>
  )
}
