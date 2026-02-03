"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeContext"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FileOperationsDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, parentId: string | null) => Promise<void>
  title: string
  description?: string
  placeholder?: string
  confirmText?: string
  initialValue?: string
  folders?: { id: string; name: string }[]
  initialParentId?: string | null
  showFolderSelect?: boolean
}

export function FileOperationsDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  placeholder = "Name...",
  confirmText = "Create",
  initialValue = "",
  folders = [],
  initialParentId = null,
  showFolderSelect = false
}: FileOperationsDialogProps) {
  const [name, setName] = useState(initialValue)
  const [parentId, setParentId] = useState<string | null>(initialParentId)
  const [isLoading, setIsLoading] = useState(false)
  const { currentTheme, borderRadius, fontFamily } = useTheme()

  React.useEffect(() => {
    if (isOpen) {
      setName(initialValue)
      setParentId(initialParentId)
      setIsLoading(false)
    }
  }, [isOpen, initialValue, initialParentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isLoading) return
    setIsLoading(true)
    try {
      await onConfirm(name.trim(), parentId)
      setName("")
      onClose()
    } catch(err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Adjust Dialog Content to be slightly higher than center
  // Default shadcn dialog helper `top-[50%]`. We can override it in style or className.
  // We'll use inline style to ensure we can customize based on theme safely if needed,
  // but className is better. `top-[40%]` or `top-[35%]`.

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[425px] top-[40%] translate-y-[-40%]" 
        style={{
            fontFamily,
            borderRadius: `${borderRadius}px`,
            backgroundColor: currentTheme.ui,
            borderColor: currentTheme.border,
            color: currentTheme.text
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription className="!text-current opacity-70">{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="name" style={{ color: currentTheme.text }}>Name</Label>
            <Input
                autoFocus
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder={placeholder}
                style={{
                    fontFamily,
                    borderRadius: `${borderRadius}px`,
                    backgroundColor: currentTheme.bg,
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                }}
            />
          </div>

          {showFolderSelect && (
            <div className="grid gap-2">
               <Label htmlFor="parent" className="pt-1" style={{ color: currentTheme.text }}>Location</Label>
               <Select 
                  value={parentId || "root"} 
                  onValueChange={(val) => setParentId(val === "root" ? null : val)}
               >
                 <SelectTrigger 
                    id="parent"
                    style={{
                        fontFamily,
                        borderRadius: `${borderRadius}px`,
                        backgroundColor: currentTheme.bg,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                    }}
                 >
                   <SelectValue placeholder="Select folder" />
                 </SelectTrigger>
                 <SelectContent 
                    style={{
                        backgroundColor: currentTheme.ui,
                        borderColor: currentTheme.border,
                        color: currentTheme.text
                    }}
                 >
                   <SelectItem value="root">Root</SelectItem>
                   {folders.map(f => (
                       <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
          )}

          <DialogFooter className="sm:justify-start gap-2 pt-4">
            <Button 
                type="submit"
                disabled={isLoading}
                style={{
                    fontFamily,
                    borderRadius: `${borderRadius}px`,
                    backgroundColor: currentTheme.accent,
                    color: '#fff',
                    opacity: isLoading ? 0.7 : 1
                }}
            >
                {isLoading ? "Processing..." : confirmText}
            </Button>
             <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="hover:bg-accent/10"
                style={{
                    fontFamily,
                    borderRadius: `${borderRadius}px`,
                    color: currentTheme.text
                }}
             >
                Cancel
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
