"use client"

import React, { useState, useEffect } from "react"
import { FilePlus, FolderPlus, SidebarOpen, SidebarClose, Trash2, Pencil } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tree, Folder, File, TreeViewElement } from "@/components/ui/file-tree"
import { FileOperationsDialog } from "@/components/FileOperationsDialog"
import { useTheme } from "@/components/ThemeContext"
import { useFileContext } from "@/components/FileContext"
import { useSidebar } from "@/components/SidebarContext"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AppSidebar() {
  const { files, fileTree, setActiveFileId, createFile, createFolder, deleteFile, renameFile, moveItem, activeFileId } = useFileContext()
  const { collapsed, setCollapsed, toggleSidebar } = useSidebar()
  const { fontFamily, borderRadius } = useTheme()
  const [expandedIds, setExpandedIds] = useState<string[] | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('expandedFolders');
    if (saved) {
        try {
            setExpandedIds(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to parse expandedFolders", e);
        }
    }
    setIsLoaded(true);
  }, []);

  const handleExpandChange = (expanded: string[]) => {
      setExpandedIds(expanded);
      localStorage.setItem('expandedFolders', JSON.stringify(expanded));
  }
  
  // Dialog State
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  
  const [fileToDelete, setFileToDelete] = useState<{id: string, name: string} | null>(null)
  const [fileToRename, setFileToRename] = useState<{id: string, name: string, parentId: string | null} | null>(null)

  const sidebarStyle = {
      backgroundColor: 'var(--color-ui)', // Use UI color from theme
      borderColor: 'var(--color-border)',
      color: 'var(--color-text)',
      fontFamily: fontFamily,
      borderRadius: `${borderRadius}px`
  };
  
  const buttonHoverStyle = {
     // We can't easily inline hover styles, but CSS vars handle standard colors.
     // Shadcn button variants use 'hover:bg-accent' etc. 
     // We might need to override --accent or similar if shadcn uses them differently.
  };

  const handleSelect = (id: string) => {
     setActiveFileId(id)
  }

  const renderTree = (elements: TreeViewElement[]) => {
    return elements.map((element) => {
      // Context menu or delete button?
      // Let's add a delete button visible on hover or similar.
      // Since File/Folder are custom components, passing children is possible.
      // But displaying actions inside the tree item is tricky without modifying the component.
      // The File component accepts children.
      
      const Content = (
         <div className="flex items-center justify-between flex-1 group w-full pr-1 overflow-hidden">
            <span className="truncate">{element.name}</span>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-transparent flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFileToRename({ id: element.id, name: element.name, parentId: element.parentId ?? null });
                    }}
                >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Rename</span>
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFileToDelete({ id: element.id, name: element.name });
                    }}
                >
                    <Trash2 className="h-3 w-3" />
                    <span className="sr-only">Delete</span>
                </Button>
            </div>
         </div>
      );

      if (element.children) {
        return (
          <Folder key={element.id} element={Content} value={element.id}>
            {renderTree(element.children)}
          </Folder>
        )
      }
      return (
        <File key={element.id} value={element.id}>
             {Content}
        </File>
      )
    })
  }



  return (
    <div 
        className={cn("border-r h-full flex flex-col transition-all duration-300 overflow-hidden", collapsed ? "w-0 border-r-0" : "w-64")}
        style={sidebarStyle}
    >
      <div 
         className={cn("p-2.5 border-b flex items-center", collapsed ? "justify-center" : "justify-between")}
         style={{ borderColor: 'var(--color-border)' }}
      >
         {!collapsed && (
         <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap" style={{ color: 'var(--color-text)' }}>
            <svg 
              viewBox="-10 -5 1034 1034" 
              className="w-5 h-5 flex-shrink-0 mb-1.5" 
              fill="currentColor" 
              style={{ color: 'var(--color-text)' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M922 319q-1 0 -2 1h-11v0h-836q-18 0 -33.5 8.5t-25.5 22.5q-17 26 -13 57v461q1 18 11 32.5t24 22.5q25 14 55 10v1l843 -1q18 -1 32.5 -11t22.5 -24q14 -24 10 -55h1l-1 -459q-1 -17 -11 -31.5t-24 -23.5q-19 -10 -42 -11zM918 367h2q12 0 20 5q6 3 8.5 6.5t2.5 9.5 l1 456v3q2 16 -5 29q-3 5 -6.5 7.5t-9.5 2.5l-840 1h-3q-16 2 -28 -5q-6 -3 -8.5 -6.5t-2.5 -9.5v-458l-1 -4q-2 -14 5.5 -25t18.5 -11h837zM145 464v327h96v-188l96 120l96 -120v188h96v-327h-96l-96 120l-96 -120h-96zM697 464v168h-96l144 159l144 -159h-96v-168h-96z" />
            </svg>
            <span className="font-bold text-sm tracking-tight">NICE MARKDOWN</span>
         </div>
         )}
         <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
                 {collapsed ? <SidebarOpen className="h-4 w-4" /> : <SidebarClose className="h-4 w-4" />}
             </Button>
         </div>
      </div>
      
      {!collapsed && (
      <div 
        className="p-2 gap-1 flex items-center border-b animate-in fade-in zoom-in duration-300"
        style={{ borderColor: 'var(--color-border)' }}
      >
         <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={() => setIsFileDialogOpen(true)}>
            <FilePlus className="mr-2 h-4 w-4" /> File
         </Button>
         
         <div className="h-4 w-px mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

         <Button variant="ghost" size="sm" className="flex-1 justify-center" onClick={() => setIsFolderDialogOpen(true)}>
             <FolderPlus className="mr-2 h-4 w-4" /> Folder
         </Button>
      </div>
      )}

      <div className={cn("flex-1 overflow-hidden transition-opacity duration-200", collapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
          <Tree 
            key={isLoaded ? 'loaded' : 'loading'}
            className="h-full" 
            elements={fileTree} 
            onSelectChange={handleSelect}
            initialSelectedId={activeFileId || undefined}
            initialExpandedItems={expandedIds}
            onExpandChange={handleExpandChange}
           >
              {renderTree(fileTree)}
          </Tree>
      </div>
      
      <FileOperationsDialog 
         isOpen={isFileDialogOpen}
         onClose={() => setIsFileDialogOpen(false)}
         onConfirm={async (name, parentId) => { await createFile(name.endsWith('.md') ? name : `${name}.md`, parentId) }}
         title="New File"
         description="Enter the name for the new markdown file."
         placeholder="e.g. notes.md"
         confirmText="Create File"
         folders={files.filter(f => f.isFolder)}
         showFolderSelect={true}
      />
      
      <FileOperationsDialog 
         isOpen={isFolderDialogOpen}
         onClose={() => setIsFolderDialogOpen(false)}
         onConfirm={async (name, parentId) => { await createFolder(name, parentId) }}
         title="New Folder"
         description="Enter the name for the new folder."
         placeholder="e.g. Projects"
         confirmText="Create Folder"
         folders={files.filter(f => f.isFolder)}
         showFolderSelect={true}
      />

      <FileOperationsDialog 
         isOpen={!!fileToRename}
         onClose={() => setFileToRename(null)}
         onConfirm={async (newName, newParentId) => {
             if (fileToRename) {
                if (newName !== fileToRename.name) {
                    await renameFile(fileToRename.id, newName);
                }
                if (newParentId !== fileToRename.parentId) {
                    await moveItem(fileToRename.id, newParentId);
                }
                setFileToRename(null);
             }
         }}
         title="Edit"
         description="Update name or move to another folder."
         placeholder="e.g. notes.md"
         confirmText="Save Changes"
         initialValue={fileToRename?.name}
         initialParentId={fileToRename?.parentId}
         folders={files.filter(f => f.isFolder && f.id !== fileToRename?.id)}
         showFolderSelect={true}
      />

      <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
        <DialogContent 
          className="sm:max-w-[425px] top-[40%] translate-y-[-40%]"
          style={{ backgroundColor: 'var(--color-ui)', borderColor: 'var(--color-border)', color: 'var(--color-text)', borderRadius: 'var(--radius)' }}
        >
            <DialogHeader>
            <DialogTitle>Delete {fileToDelete?.name}?</DialogTitle>
            <DialogDescription style={{ color: 'var(--color-text-muted)' }}>
                This action cannot be undone. This will permanently delete the file/folder.
            </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-start gap-1 mt-4">
           <Button 
                variant="destructive" 
                onClick={async () => {
                    if (fileToDelete) {
                        await deleteFile(fileToDelete.id);
                        setFileToDelete(null);
                    }
                }}
            >
                Delete
            </Button>

            <Button variant="outline" onClick={() => setFileToDelete(null)} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>Cancel</Button>
            
           
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
