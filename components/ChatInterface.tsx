'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings, 
  Plus, 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  X,
  Sparkles,
  MessageSquare,
  History,
  Trash2,
  Clock,
  Star,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFileContext } from '@/components/FileContext';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from '@/components/ThemeContext';
import { useSidebar } from '@/components/SidebarContext';
import { Theme } from '@/lib/types';
import { db, type ChatSession, type AppSettings } from '@/lib/indexeddb';
import { saveChat, getChats, deleteChat, getSettings, saveSettings as saveSettingsAction } from '@/app/actions';
import { v4 as uuidv4 } from 'uuid';
import { Textarea } from './ui/textarea';

const getMessageText = (message: any) => {
  let text = '';
  
  // Handle string content directly
  if (typeof message.content === 'string') {
    text = message.content;
  }
  // Handle parts array (AI SDK v4+ format)
  else if (Array.isArray(message.parts)) {
    text = message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  }
  // Handle content as array of parts (another possible format)
  else if (Array.isArray(message.content)) {
    text = message.content
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  }
  // Handle text property directly (streamProtocol: 'text' format)
  else if (typeof message.text === 'string') {
    text = message.text;
  }
  
  return text;
};

// Strip file context from user messages for display
const getDisplayText = (message: any) => {
  const text = getMessageText(message);
  
  // Only strip for user messages
  if (message.role !== 'user') return text;
  
  // Check if message starts with file context pattern
  // Pattern: File: filename\n```\n...\n```\n\n
  const fileContextPattern = /^(File: .+?\n```[\s\S]*?```\n\n)+/;
  return text.replace(fileContextPattern, '').trim();
};

const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant specialized in markdown editing and content creation. Your goal is to provide accurate, well-formatted markdown content to the user.";

export function ChatInterface() {
  const { isChatOpen: isOpen, toggleChat: onClose } = useSidebar();
  const { activeFile, files, loadFileContent } = useFileContext();
  const { theme } = useTheme();
  
  // Track if component is mounted (for hydration safety)
  const [isMounted, setIsMounted] = useState(false);
  
  // Settings State - Initialize empty, then load from localStorage after mount
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-4o');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [newModelInput, setNewModelInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Load settings from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    setApiKey(localStorage.getItem('ai_api_key') || '');
    setBaseUrl(localStorage.getItem('ai_base_url') || 'https://api.openai.com/v1');
    setSystemPrompt(localStorage.getItem('ai_system_prompt') || DEFAULT_SYSTEM_PROMPT);
    
    // Load starred model first, fallback to saved model, then default
    const starred = localStorage.getItem('ai_starred_model');
    const savedModel = localStorage.getItem('ai_model');
    setStarredModel(starred);
    
    if (starred) {
      setModel(starred);
    } else if (savedModel) {
      setModel(savedModel);
    } else {
      setModel('gpt-4o');
    }
  }, []);
  
  // Chat History State
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [storageType, setStorageType] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('storageType') || 'indexeddb' : 'indexeddb'));
  const [deletingChatIds, setDeletingChatIds] = useState<Set<string>>(new Set());
  const [starredModel, setStarredModel] = useState<string | null>(null);
  
  const [attachedFileIds, setAttachedFileIds] = useState<Set<string>>(new Set());
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  
  // Model picker state (Ctrl + /)
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelPickerIndex, setModelPickerIndex] = useState(0);
  
  // @ mention state
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Filter files based on mention query
  const mentionFiles = useMemo(() => {
    const nonFolders = files.filter(f => !f.isFolder);
    if (!mentionQuery) return nonFolders;
    return nonFolders.filter(f => 
      f.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [files, mentionQuery]);

  // Global keyboard shortcut for model picker (Ctrl + /)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (availableModels.length > 0) {
          setShowModelPicker(prev => !prev);
          // Set initial index to current model
          const currentIndex = availableModels.indexOf(model);
          setModelPickerIndex(currentIndex >= 0 ? currentIndex : 0);
        }
      }
      
      // Handle model picker navigation
      if (showModelPicker && availableModels.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setModelPickerIndex(prev => (prev + 1) % availableModels.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setModelPickerIndex(prev => (prev - 1 + availableModels.length) % availableModels.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          setModel(availableModels[modelPickerIndex]);
          setShowModelPicker(false);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowModelPicker(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [showModelPicker, availableModels, modelPickerIndex, model]);

  // Load settings from DB (overwrites localStorage if found)
  useEffect(() => {
    const loadSettings = async () => {
        // We already have localStorage values from initial useState.
        // This effect will refine them with data from IndexedDB or Postgres if available.
        
        const storedModelsList = localStorage.getItem('ai_available_models');
        if (storedModelsList) {
            try {
                const parsedModels = JSON.parse(storedModelsList);
                setAvailableModels(parsedModels);
                // Already set initial model above, but refinement can happen here
            } catch (e) {
                console.error("Failed to parse stored models", e);
            }
        }

        // Try to load from DB (IndexedDB or Postgres) for specialized settings
        try {
            let dbSettings: any = null;
            const currentStorage = localStorage.getItem('storageType') || 'indexeddb';
            if (currentStorage === 'postgres') {
                const uri = localStorage.getItem('postgresUri');
                if (uri) dbSettings = await getSettings(uri);
            } else {
                dbSettings = await db.settings.get('current');
            }

            if (dbSettings) {
                if (dbSettings.apiKey) setApiKey(dbSettings.apiKey);
                if (dbSettings.baseUrl) setBaseUrl(dbSettings.baseUrl);
                if (dbSettings.systemPrompt) setSystemPrompt(dbSettings.systemPrompt);
                if (dbSettings.availableModels) {
                    const models = typeof dbSettings.availableModels === 'string' 
                        ? JSON.parse(dbSettings.availableModels) 
                        : dbSettings.availableModels;
                    setAvailableModels(models);
                }
                if (dbSettings.starredModel) setStarredModel(dbSettings.starredModel);
            }
        } catch (err) {
            console.error("Failed to load settings from DB", err);
        }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    // Trim values before saving
    const trimmedApiKey = apiKey.trim();
    const trimmedBaseUrl = baseUrl.trim();
    const trimmedModel = model.trim();

    // Save to LocalStorage
    localStorage.setItem('ai_api_key', trimmedApiKey);
    localStorage.setItem('ai_base_url', trimmedBaseUrl);
    localStorage.setItem('ai_model', trimmedModel);
    localStorage.setItem('ai_available_models', JSON.stringify(availableModels));
    localStorage.setItem('ai_system_prompt', systemPrompt);
    if (starredModel) localStorage.setItem('ai_starred_model', starredModel);
    else localStorage.removeItem('ai_starred_model');

    // Save to DB (IndexedDB and/or Postgres)
    const settingsData: AppSettings = {
        id: 'current',
        apiKey: trimmedApiKey,
        baseUrl: trimmedBaseUrl,
        availableModels,
        starredModel,
        systemPrompt,
        updatedAt: Date.now()
    };

    try {
        // Always save to IndexedDB as backup/local primary
        await db.settings.put(settingsData);
        
        // Save to Postgres if active
        if (storageType === 'postgres') {
            const uri = localStorage.getItem('postgresUri');
            if (uri) await saveSettingsAction(uri, settingsData);
        }
    } catch (err) {
        console.error("Failed to save settings to DB", err);
    }
    
    // Update state with trimmed values
    setApiKey(trimmedApiKey);
    setBaseUrl(trimmedBaseUrl);
    setModel(trimmedModel);
    
    setSettingsOpen(false);
  };

  const handleToggleStar = (e: React.MouseEvent | React.PointerEvent, m: string) => {
    e.stopPropagation();
    e.preventDefault();
    const newStarred = starredModel === m ? null : m;
    setStarredModel(newStarred);
    if (newStarred) {
        localStorage.setItem('ai_starred_model', newStarred);
    } else {
        localStorage.removeItem('ai_starred_model');
    }
  };

  const toggleAttachment = (fileId: string) => {
    // Load content if not available
    const file = files.find(f => f.id === fileId);
    if (file && !file.isFolder && file.content === undefined) {
        loadFileContent(fileId);
    }

    setAttachedFileIds(prev => {
        const next = new Set(prev);
        if (next.has(fileId)) next.delete(fileId);
        else next.add(fileId);
        return next;
    });
  };

  const getAttachedContext = () => {
    const selectedFiles = files.filter(f => attachedFileIds.has(f.id));
    if (selectedFiles.length === 0) return '';
    return selectedFiles.map(f => `File: ${f.name}\n\`\`\`\n${f.content || ''}\n\`\`\``).join('\n\n');
  };

  const handleAddModel = () => {
      if (newModelInput && !availableModels.includes(newModelInput)) {
          setAvailableModels([...availableModels, newModelInput]);
          setNewModelInput('');
          if (!model) setModel(newModelInput);
      }
  };

  const handleRemoveModel = (m: string) => {
      const newList = availableModels.filter(mod => mod !== m);
      setAvailableModels(newList);
      if (model === m && newList.length > 0) {
          setModel(newList[0]);
      } else if (newList.length === 0) {
          setModel('');
      }
  };

  const { messages, status, sendMessage: append, stop, regenerate: reload, setMessages } = useChat({
    api: '/api/chat',
    body: {
      apiKey,
      baseUrl,
      model,
      systemPrompt,
    },
    onFinish: (message: any) => {
        saveCurrentChat();
    },
    onError: (error: any) => {
        console.error("Chat error:", error);
        // If 400/401, probably API key issue
        if (error.message?.includes('400') || error.message?.includes('401')) {
            setSettingsOpen(true);
        }
    }
  } as any) as any;

  const sendMessage = ({ text }: { text: string }) => {
    append({ role: 'user', content: text }, { 
      body: { 
        apiKey, 
        baseUrl, 
        model, 
        systemPrompt 
      } 
    });
  };

  const regenerate = () => reload({
    body: { 
      apiKey, 
      baseUrl, 
      model, 
      systemPrompt 
    }
  });

  const [input, setInput] = useState('');
  const isLoading = status === 'streaming' || status === 'submitted';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setInput(value);
    
    // Check for @ mention
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Only show popup if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setShowMentionPopup(true);
        setMentionQuery(textAfterAt);
        setMentionStartPos(lastAtIndex);
        setMentionIndex(0);
        return;
      }
    }
    
    setShowMentionPopup(false);
    setMentionQuery('');
  };
  
  const handleSelectMention = (file: typeof files[0]) => {
    // Remove the @query and just attach the file
    const beforeMention = input.slice(0, mentionStartPos);
    const afterMention = input.slice(mentionStartPos + mentionQuery.length + 1); // +1 for @
    setInput(beforeMention + afterMention);
    
    // Attach the file
    if (!attachedFileIds.has(file.id)) {
      loadFileContent(file.id);
      setAttachedFileIds(prev => new Set(prev).add(file.id));
    }
    
    setShowMentionPopup(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };
  
  const handleMentionKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentionPopup || mentionFiles.length === 0) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex(prev => (prev + 1) % mentionFiles.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex(prev => (prev - 1 + mentionFiles.length) % mentionFiles.length);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSelectMention(mentionFiles[mentionIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentionPopup(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && attachedFileIds.size === 0) return;
    
    // Construct message with context (for API)
    const context = getAttachedContext();
    const fullText = context ? `${context}\n\n${input}` : input;
    
    sendMessage({ text: fullText });
    setInput('');
    setAttachedFileIds(new Set());
  };

  const handleAttachActive = () => {
    if (activeFile) {
        setAttachedFileIds(prev => new Set(prev).add(activeFile.id));
    }
  };

  // Re-save messages whenever they update (to capture user messages too)
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
        saveCurrentChat();
    }
  }, [messages, isLoading]);

  const saveCurrentChat = async () => {
      if (messages.length === 0) return;

      let chatId = currentChatId;
      if (!chatId) {
          chatId = uuidv4();
          setCurrentChatId(chatId);
      }

      // Determine Title
      let title = "New Chat";
      if (messages.length > 0) {
          const firstMsg = getMessageText(messages[0]);
          title = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? "..." : "");
      }

      const chatData: ChatSession = {
          id: chatId,
          title,
          messages: messages,
          createdAt: Date.now(),
          updatedAt: Date.now()
      };

      try {
          if (storageType === 'postgres') {
              const uri = localStorage.getItem('postgresUri');
              if (uri) await saveChat(uri, chatData);
          } else {
              await db.chats.put(chatData);
          }
          loadHistory(); 
      } catch (err) {
          console.error("Failed to save chat", err);
      }
  };

  const loadHistory = async () => {
      try {
          let chats: ChatSession[] = [];
          if (storageType === 'postgres') {
              const uri = localStorage.getItem('postgresUri');
              if (uri) {
                  const rows = await getChats(uri);
                  chats = rows.map((r: any) => ({
                      ...r,
                      messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : r.messages,
                      createdAt: Number(r.createdAt),
                      updatedAt: Number(r.updatedAt)
                  }));
              }
          } else {
              chats = await db.chats.orderBy('updatedAt').reverse().toArray();
          }
          setChatHistory(chats);
      } catch (err) {
          console.error("Failed to load history", err);
      }
  };

  useEffect(() => {
    if (isOpen) {
        loadHistory();
    }
  }, [isOpen, storageType]);

  const loadChat = (chat: ChatSession) => {
      setCurrentChatId(chat.id);
      setMessages(chat.messages || []);
      setShowHistory(false);
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (deletingChatIds.has(id)) return;

      setDeletingChatIds(prev => new Set(prev).add(id));
      try {
          if (storageType === 'postgres') {
              const uri = localStorage.getItem('postgresUri');
              if (uri) await deleteChat(uri, id);
          } else {
              await db.chats.delete(id);
          }
          
          if (currentChatId === id) {
              setMessages([]);
              setCurrentChatId(null);
          }
          loadHistory();
      } catch (err) {
          console.error("Failed to delete chat", err);
      } finally {
          setDeletingChatIds(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
          });
      }
  };

  const handleNewChat = () => {
      setMessages([]);
      setCurrentChatId(null);
      setShowHistory(false);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAttachContext = () => {
    if (!activeFile) return;
    const contextMsg = `\n\nContext from file '${activeFile.name}':\n\`\`\`markdown\n${activeFile.content}\n\`\`\``;
    setInput(input + contextMsg);
  };

  return (
    <div className={cn("flex flex-col h-full border-r bg-background transition-all duration-300 overflow-hidden", isOpen ? "w-full md:w-[450px]" : "w-0 border-r-0")}>
      {/* Header */}
      <div className="flex flex-col gap-2 p-2.5 border-b bg-muted/30">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setMessages([])} title="New Chat">
                    <Plus className="h-5 w-5" />
                </Button>
                <span className="font-semibold text-sm">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowHistory(!showHistory)} 
                    title="History" 
                    className={showHistory ? "bg-accent/50 text-accent-foreground" : ""}
                >
                    <History className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} title="Settings">
                    <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} title="Close">
                    <X className="h-5 w-5" />
                </Button>
            </div>
        </div>

        {/* Model Selector removed from here */}
      </div>


      {showHistory ? (
           <ScrollArea className="flex-1 p-4">
               {chatHistory.length === 0 ? (
                   <div className="flex flex-col items-center justify-center p-8 text-muted-foreground opacity-50 gap-2 mt-10">
                       <Clock className="h-10 w-10" />
                       <p className="text-sm">No chat history</p>
                   </div>
               ) : (
                   <div className="space-y-2">
                       {chatHistory.map(chat => (
                           <div 
                                key={chat.id} 
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors group relative flex flex-col gap-1",
                                    currentChatId === chat.id ? "bg-accent border-primary/50" : "bg-card"
                                )}
                                onClick={() => loadChat(chat)}
                           >
                               <div className="font-medium text-sm truncate pr-6">{chat.title || "Untitled Chat"}</div>
                               <div className="text-xs text-muted-foreground flex justify-between items-center">
                                   <span>{new Date(chat.updatedAt).toLocaleDateString()}</span>
                                   <span>{chat.messages.length} msgs</span>
                               </div>
                               <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => handleDeleteChat(e, chat.id)}
                                    disabled={deletingChatIds.has(chat.id)}
                                >
                                   <Trash2 className={cn("h-3 w-3 text-muted-foreground hover:text-destructive", deletingChatIds.has(chat.id) && "animate-pulse")} />
                               </Button>
                           </div>
                       ))}
                   </div>
               )}
           </ScrollArea>
      ) : (
      <>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 gap-2">
                <Sparkles className="h-10 w-10" />
                <p className="text-md text-center leading-tight">Hello, What will <br /> you achieve today?</p>
                {isMounted && !apiKey && (
                    <Button variant="default" size="sm" onClick={() => setSettingsOpen(true)}>
                        Configure API Key
                    </Button>
                )}
            </div>
        )}
        
        {messages.map((m: any) => {
          // Use display text (stripped of file context) for user messages
          const messageText = m.role === 'user' ? getDisplayText(m) : getMessageText(m);
          // Check if this user message had attached files
          const hadAttachments = m.role === 'user' && getMessageText(m) !== getDisplayText(m);
          
          return (
          <div key={m.id} className={cn("flex gap-3 text-sm", m.role === 'user' ? "justify-end" : "justify-start")}>
             {m.role !== 'user' && (
                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                     <Bot className="h-5 w-5 text-primary" />
                 </div>
             )}
             <div className={cn(
                 "rounded-lg p-3 max-w-[85%]",
                 m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
             )}>
                 {m.role === 'user' ? (
                     <div>
                         {hadAttachments && (
                             <div className="flex items-center gap-1 text-xs opacity-70 mb-1.5 pb-1.5 border-b border-primary-foreground/20">
                                 <Paperclip className="h-3 w-3" />
                                 <span>Files attached</span>
                             </div>
                         )}
                         <div className="whitespace-pre-wrap">{messageText}</div>
                     </div>
                 ) : (
                     <div className="prose prose-sm dark:prose-invert max-w-none">
                         <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const isDark = theme !== Theme.GITHUB_LIGHT && theme !== Theme.NORD_LIGHT;
                                    return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={isDark ? vscDarkPlus : vs}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                    ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                    )
                                }
                            }}
                         >
                            {messageText}
                         </ReactMarkdown>
                     </div>
                 )}
             </div>
             {m.role === 'user' && (
                 <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                     <User className="h-5 w-5" />
                 </div>
             )}
          </div>
        );
        })}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex gap-3">
                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                     <Bot className="h-5 w-5 text-primary" />
                 </div>
                 <div className="bg-muted rounded-lg p-3 flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                     <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                     <span className="w-1.5 h-1.5 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        {attachedFileIds.size > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
                {files.filter(f => attachedFileIds.has(f.id)).map(f => (
                    <div key={f.id} className="flex items-center gap-1 bg-accent px-2 py-1 rounded-md text-xs border border-border">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[100px] truncate">{f.name}</span>
                        <button onClick={() => toggleAttachment(f.id)} className="text-muted-foreground hover:text-destructive ml-1">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
           <div className="relative">
                {/* @ Mention Popup */}
                {showMentionPopup && mentionFiles.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-full max-w-[300px] bg-popover border rounded-md shadow-lg overflow-hidden z-50">
                        <div className="p-2 border-b bg-muted/50">
                            <span className="text-xs text-muted-foreground">Attach file</span>
                        </div>
                        <ScrollArea className="max-h-[200px]">
                            <div className="p-1">
                                {mentionFiles.map((f, idx) => (
                                    <div
                                        key={f.id}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm",
                                            idx === mentionIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                        )}
                                        onClick={() => handleSelectMention(f)}
                                        onMouseEnter={() => setMentionIndex(idx)}
                                    >
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="truncate">{f.name}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
                {showMentionPopup && mentionFiles.length === 0 && mentionQuery && (
                    <div className="absolute bottom-full left-0 mb-1 w-full max-w-[300px] bg-popover border rounded-md shadow-lg overflow-hidden z-50 p-3">
                        <span className="text-xs text-muted-foreground">No files matching "{mentionQuery}"</span>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={input} 
                    onChange={handleInputChange} 
                    placeholder={apiKey ? "Type @ to attach files..." : "Please configure API key first"}
                    disabled={!apiKey || isLoading}
                    className="flex min-h-[50px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    onKeyDown={(e) => {
                        // Handle mention navigation first
                        if (showMentionPopup) {
                            handleMentionKeyDown(e);
                            if (['ArrowUp', 'ArrowDown', 'Escape'].includes(e.key) || (e.key === 'Enter' && !e.shiftKey && mentionFiles.length > 0)) {
                                return;
                            }
                        }
                        
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (apiKey && !isLoading && (input.trim() || attachedFileIds.size > 0)) {
                                e.currentTarget.form?.requestSubmit();
                            }
                        }
                    }}
                />
           </div>
           
           <div className="flex items-center justify-between gap-2">
               <div className="flex-1 max-w-[180px]">
                   {availableModels.length > 0 ? (
                       <Select value={model} onValueChange={setModel}>
                           <SelectTrigger className="h-8 text-xs bg-background">
                               <SelectValue placeholder="Select Model" />
                           </SelectTrigger>
                           <SelectContent side="top" className="max-h-[200px]">
                               {availableModels.map(m => (
                                   <SelectItem key={m} value={m} className="text-xs">
                                       <div className="flex items-center justify-between w-full h-full gap-2 group min-w-[120px]">
                                           <span>{m}</span>
                                           <div 
                                                className={cn(
                                                    "cursor-pointer hover:text-yellow-500", 
                                                    starredModel === m ? "text-yellow-500" : "text-muted-foreground/30 opacity-0 group-hover:opacity-100"
                                                )}
                                                onPointerDown={(e) => handleToggleStar(e, m)}
                                                onClick={(e) => e.stopPropagation()}
                                                title={starredModel === m ? "Unstar" : "Set as default"}
                                           >
                                               <Star size={12} fill={starredModel === m ? "currentColor" : "none"} />
                                           </div>
                                       </div>
                                   </SelectItem>
                               ))}
                           </SelectContent>
                       </Select>
                   ) : (
                       <div className="text-xs text-muted-foreground px-2">Default Model</div>
                   )}
               </div>
               
               <div className="flex items-center gap-2">
                   <Popover open={isAttachOpen} onOpenChange={setIsAttachOpen}>
                       <PopoverTrigger asChild>
                           <Button 
                                type="button" 
                                size="icon" 
                                variant="ghost" 
                                className={cn("h-8 w-8 text-muted-foreground shrink-0", attachedFileIds.size > 0 && "text-primary")}
                                title="Attach files"
                                disabled={!apiKey}
                           >
                                <Paperclip className="h-4 w-4" />
                           </Button>
                       </PopoverTrigger>
                       <PopoverContent side="top" align="end" className="w-[300px] p-0 overflow-hidden border shadow-xl mb-2">
                           <div className="p-3 border-b bg-muted/50">
                               <h4 className="font-semibold text-sm">Attach Files</h4>
                               <p className="text-[10px] text-muted-foreground">Select files to include as context</p>
                           </div>
                           <ScrollArea className="h-[250px]">
                               <div className="p-2 space-y-1">
                                   {files.filter(f => !f.isFolder).length === 0 && (
                                       <div className="text-sm text-muted-foreground italic p-4 text-center">No files available</div>
                                   )}
                                   {files.filter(f => !f.isFolder).map(f => (
                                       <div 
                                           key={f.id} 
                                           className={cn(
                                               "flex items-center gap-2.5 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                                               attachedFileIds.has(f.id) ? "bg-accent/50" : ""
                                           )}
                                           onClick={() => toggleAttachment(f.id)}
                                       >
                                           <div className={cn(
                                               "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0",
                                               attachedFileIds.has(f.id) ? "bg-primary border-primary" : "border-muted-foreground"
                                           )}>
                                               {attachedFileIds.has(f.id) && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-sm" />}
                                           </div>
                                           <span className="text-xs truncate flex-1">{f.name}</span>
                                       </div>
                                   ))}
                               </div>
                           </ScrollArea>
                           <div className="p-2 border-t bg-muted/30 flex justify-between items-center px-3">
                               <div className="text-[10px] text-muted-foreground font-medium">
                                   {attachedFileIds.size} selected
                               </div>
                               <Button onClick={() => setIsAttachOpen(false)} size="sm" className="h-7 text-[10px] px-3">Done</Button>
                           </div>
                       </PopoverContent>
                   </Popover>

                   <Button 
                      type="submit" 
                      disabled={!apiKey || isLoading || (!input.trim() && attachedFileIds.size === 0)} 
                      size="icon"
                      variant="default"
                      className="h-8 w-8 shrink-0 flex items-center justify-center"
                   >
                      <Send className="h-4 w-4" style={{ transform: 'rotate(-45deg)' }} />
                   </Button>
               </div>
           </div>
        </form>
      </div>

      {/* Attachment Dialog removed */}
      </>
      )}
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[425px] top-[30%] translate-y-[-30%]">
          <DialogHeader>
            <DialogTitle>AI Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-left">
                API Key
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="col-span-3"
                type="password"
                placeholder="sk-..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseUrl" className="text-left">
                Base URL
              </Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="systemPrompt" className="text-left pt-2">
                System Prompt
              </Label>
              <Textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSystemPrompt(e.target.value)}
                className="col-span-3 min-h-[100px] text-xs"
                placeholder="You are a helpful assistant..."
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-left pt-2">
                Models
              </Label>
              <div className="col-span-3 flex flex-col gap-3">
                 {/* Model addition input */}
                 <div className="flex gap-2">
                     <Input 
                        placeholder="Add model name (e.g. gpt-4o)..." 
                        value={newModelInput}
                        onChange={(e) => setNewModelInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddModel();
                            }
                        }}
                     />
                     <Button size="icon" variant="outline" onClick={handleAddModel} disabled={!newModelInput.trim()}>
                         <Plus className="h-4 w-4" />
                     </Button>
                 </div>

                 {/* Available models list with delete option */}
                 <div className="flex flex-wrap gap-2 mt-1">
                    {availableModels.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">No models added yet. Add one above.</span>
                    )}
                    {availableModels.map(m => (
                        <div key={m} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs group border">
                            <span>{m}</span>
                            <button 
                                onClick={() => handleRemoveModel(m)}
                                className="opacity-50 hover:opacity-100 hover:text-destructive ml-1"
                                title="Remove model"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveSettings}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
