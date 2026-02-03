"use client"

import * as React from "react"
import { Settings, Database } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/ThemeContext"
import { db } from "@/lib/indexeddb"
import { saveFile, saveChat, testConnection } from "@/app/actions"

export function SettingsDialog() {
  const [storageType, setStorageType] = React.useState("indexeddb")
  const [postgresUri, setPostgresUri] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [hasBrowserData, setHasBrowserData] = React.useState(false)
  const [shouldMigrate, setShouldMigrate] = React.useState(false)
  const [isMigrating, setIsMigrating] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [testStatus, setTestStatus] = React.useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = React.useState('');
  
  const { currentTheme, borderRadius, fontFamily } = useTheme()

  React.useEffect(() => {
    const storedType = localStorage.getItem("storageType") || "indexeddb"
    const storedUri = localStorage.getItem("postgresUri") || ""
    setStorageType(storedType)
    setPostgresUri(storedUri)
    setTestStatus('idle');
    setTestMessage('');
    setIsSaving(false);
    
    const checkData = async () => {
      const count = await db.files.count()
      setHasBrowserData(count > 0)
    }
    checkData()
  }, [isOpen])

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      if (storageType === "postgres") {
        if (!postgresUri) {
            alert("Please enter a Postgres URI");
            setIsSaving(false);
            return;
        }

        setTestStatus('testing');
        const result = await testConnection(postgresUri);
        if (!result.success) {
            setTestStatus('error');
            setTestMessage(result.error);
            setIsSaving(false); // Enable retry
            return;
        }
        setTestStatus('success');

        if (shouldMigrate) {
          setIsMigrating(true)
          try {
              const files = await db.files.toArray()
              for (const file of files) {
                 await saveFile(postgresUri, file)
              }
              
              const chats = await db.chats.toArray()
              for (const chat of chats) {
                 await saveChat(postgresUri, chat)
              }
          } catch (error: any) {
              console.error("Migration failed:", error)
              alert("Migration failed: " + error.message)
              setIsMigrating(false)
              setIsSaving(false);
              return
          }
        }
      }

      localStorage.setItem("storageType", storageType)
      localStorage.setItem("postgresUri", postgresUri)
      setIsOpen(false)
      window.location.reload()
    } catch (e: any) {
       console.error("Save settings error", e);
       alert("Error saving settings: " + e.message);
       setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
            className="flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors w-full border rounded-sm mt-2 hover:opacity-80"
            style={{ 
                borderColor: 'var(--color-border)', 
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-bg)'
            }}
        >
          <Database size={14} />
          <span>Storage & Database</span>
        </button>
      </DialogTrigger>
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
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription className="!text-current opacity-70">
            Configure your storage preferences here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="storage-type" className="text-left font-semibold opacity-70">
              Storage Location
            </Label>
            <Select value={storageType} onValueChange={setStorageType}>
              <SelectTrigger 
                className="w-full"
                style={{
                  borderRadius: `${borderRadius}px`,
                  backgroundColor: currentTheme.bg,
                  borderColor: currentTheme.border,
                  color: currentTheme.text
                }}
              >
                <SelectValue placeholder="Select storage" />
              </SelectTrigger>
              <SelectContent 
                style={{
                    borderRadius: `${borderRadius}px`,
                    backgroundColor: currentTheme.bg,
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                }}
              >
                <SelectItem value="indexeddb" className="hover:!bg-accent hover:!text-accent-foreground">Store in Browser</SelectItem>
                <SelectItem value="postgres" className="hover:!bg-accent hover:!text-accent-foreground">PostgreSQL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {storageType === "postgres" && (
            <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="pg-uri" className="text-left font-semibold opacity-70">
                Postgres URI
              </Label>
              <Input
                id="pg-uri"
                value={postgresUri}
                onChange={(e) => setPostgresUri(e.target.value)}
                className="w-full"
                type="password"
                placeholder="postgresql://username:password@host:port/database"
                style={{
                    borderRadius: `${borderRadius}px`,
                    backgroundColor: currentTheme.bg,
                    borderColor: currentTheme.border,
                    color: currentTheme.text
                }}
              />
              {testStatus === 'error' && (
                <div className="text-destructive text-sm mt-1">
                   Connection failed: {testMessage}
                </div>
              )}
              {hasBrowserData && (
                <div className="flex items-center space-x-2 mt-2 p-3 border rounded-md" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                   <Switch 
                     id="migrate" 
                     checked={shouldMigrate} 
                     onCheckedChange={setShouldMigrate} 
                   />
                   <Label htmlFor="migrate" className="text-sm cursor-pointer">
                      Migrate existing browser data to my DB
                   </Label>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-start">
          <Button 
            onClick={handleSave}
            disabled={isMigrating || testStatus === 'testing' || isSaving}
            style={{
                borderRadius: `${borderRadius}px`,
                backgroundColor: currentTheme.accent,
                color: '#fff',
                opacity: (isMigrating || testStatus === 'testing' || isSaving) ? 0.7 : 1
            }}
          >
            {isMigrating ? "Migrating..." : (testStatus === 'testing' ? "Connecting..." : (isSaving ? "Saving..." : "Save changes"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
