import { useState, useEffect, useCallback, useRef } from 'react';
import { db, type FileParams, type FolderParams } from '@/lib/indexeddb';
import { getFilesMetadata, getFileContent, getFolders, saveFile, saveFolder, deleteFile as deleteFilePg, deleteFolder as deleteFolderPg } from '@/app/actions';
import { v4 as uuidv4 } from 'uuid';

export type FileSystemItem = 
  | (Omit<FileParams, 'content'> & { content?: string; isFolder: false }) 
  | (FolderParams & { isFolder: true; content?: undefined });

export function useFileSystem() {
  const [files, setFiles] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState<'indexeddb' | 'postgres'>('indexeddb');
  const [pgUri, setPgUri] = useState('');

  // Load settings
  useEffect(() => {
    const storedType = localStorage.getItem('storageType') as 'indexeddb' | 'postgres';
    const storedUri = localStorage.getItem('postgresUri');
    if (storedType) setStorageType(storedType);
    if (storedUri) setPgUri(storedUri);
  }, []);

  // Fetch files
  const refreshFiles = useCallback(async () => {
    setLoading(true);
    try {
      if (storageType === 'postgres' && pgUri) {
        const [fileRows, folderRows] = await Promise.all([
          getFilesMetadata(pgUri),
          getFolders(pgUri)
        ]);
        
        const mappedFiles = fileRows.map((row: any) => ({
          ...row,
          isFolder: false,
          createdAt: Number(row.createdAt),
          updatedAt: Number(row.updatedAt)
          // content is undefined initially
        }));

        const mappedFolders = folderRows.map((row: any) => ({
          ...row,
          isFolder: true,
          createdAt: Number(row.createdAt),
          updatedAt: Number(row.updatedAt)
        }));

        setFiles([...mappedFiles, ...mappedFolders]);
      } else {
        const [fileItems, folderItems] = await Promise.all([
            // For indexedDB, we still load everything but we can strip content to simulate metadata only load if needed
            // But usually indexedDB is local and fast enough. However, to be consistent with the requested behavior:
            db.files.toArray(),
            db.folders.toArray()
        ]);
  
        // We strip content from initial state to save memory/processing for large files
        const mappedFiles = fileItems.map(f => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { content, ...rest } = f;
            return { ...rest, isFolder: false } as FileSystemItem;
        });
        const mappedFolders = folderItems.map(f => ({ ...f, isFolder: true } as FileSystemItem));

        setFiles([...mappedFiles, ...mappedFolders]);
      }
    } catch (error) {
      console.error("Failed to load files", error);
    } finally {
      setLoading(false);
    }
  }, [storageType, pgUri]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const loadFileContent = useCallback(async (id: string) => {
      // Check if we already have content
      setFiles(prev => {
          const file = prev.find(f => f.id === id);
          if (file && !file.isFolder && file.content !== undefined) {
              return prev; // No change needed
          }
          return prev;
      });
      
      let content = '';
      try {
        if (storageType === 'postgres' && pgUri) {
            content = await getFileContent(pgUri, id);
        } else {
            const file = await db.files.get(id);
            if (file) content = file.content;
        }
        
        // Update state with loaded content
        setFiles(prev => prev.map(f => {
            if (f.id === id && !f.isFolder) {
                return { ...f, content };
            }
            return f;
        }));
        
        return content;
      } catch (e) {
          console.error(`Failed to load content for file ${id}`, e);
          return '';
      }
  }, [storageType, pgUri]);

  const persistItem = useCallback(async (item: FileSystemItem) => {
    if (storageType === 'postgres' && pgUri) {
      if (item.isFolder) {
        const { isFolder, ...folderData } = item;
        await saveFolder(pgUri, folderData);
      } else {
        const { isFolder, ...fileData } = item;
        // Ensure content is string before saving
        const dataToSave = { ...fileData, content: fileData.content || '' };
        await saveFile(pgUri, dataToSave);
      }
    } else {
      if (item.isFolder) {
        const { isFolder, ...folderData } = item;
        await db.folders.put(folderData);
      } else {
        const { isFolder, ...fileData } = item;
        const dataToSave = { ...fileData, content: fileData.content || '' };
        await db.files.put(dataToSave);
      }
    }
  }, [storageType, pgUri]);

  const updateFileState = useCallback((id: string, updates: Partial<FileSystemItem>) => {
    setFiles(prev => prev.map(f => {
        if (f.id === id) {
            return { ...f, ...updates, updatedAt: Date.now() } as FileSystemItem;
        }
        return f;
    }) as FileSystemItem[]);
  }, []);

  const createItem = async (name: string, isFolder: boolean, parentId: string | null = null) => {
    const baseItem = {
      id: uuidv4(),
      name,
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    let newItem: FileSystemItem;

    if (isFolder) {
      newItem = { ...baseItem, isFolder: true };
    } else {
      newItem = { ...baseItem, isFolder: false, content: '' };
    }
    
    // Optimistic update
    setFiles(prev => [...prev, newItem]);
    
    await persistItem(newItem);
    return newItem;
  };

  const deleteItem = deleteFilePg ? async (id: string, cascade = true) => {
    // Helper to find all descendants
    const findDescendants = (parentId: string, allFiles: FileSystemItem[]): FileSystemItem[] => {
        let descendants: FileSystemItem[] = [];
        const children = allFiles.filter(f => f.parentId === parentId);
        children.forEach(child => {
            descendants.push(child);
            if (child.isFolder) {
                descendants = [...descendants, ...findDescendants(child.id, allFiles)];
            }
        });
        return descendants;
    };

    let itemsToDelete: FileSystemItem[] = [];
    const itemToDelete = files.find(f => f.id === id);
    if (itemToDelete) itemsToDelete.push(itemToDelete);

    if (cascade && itemToDelete?.isFolder) {
        const descendants = findDescendants(id, files);
        itemsToDelete = [...itemsToDelete, ...descendants];
    }
    
    const idsToDelete = itemsToDelete.map(i => i.id);

    // Optimistic update
    setFiles(prev => prev.filter(f => !idsToDelete.includes(f.id)));

    if (storageType === 'postgres' && pgUri) {
      for (const item of itemsToDelete) {
          if (item.isFolder) {
             await deleteFolderPg(pgUri, item.id);
          } else {
             await deleteFilePg(pgUri, item.id);
          }
      }
    } else {
      const fileIds = itemsToDelete.filter(i => !i.isFolder).map(i => i.id);
      const folderIds = itemsToDelete.filter(i => i.isFolder).map(i => i.id);
      
      if (fileIds.length) await db.files.bulkDelete(fileIds);
      if (folderIds.length) await db.folders.bulkDelete(folderIds);
    }
  } : async () => {};

  // Debounced update for content
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // This is a stub for potential debounced updates which are handled in FileContext usually
  // But we kept the hook exposure.
  
  return {
    files,
    loading,
    refreshFiles,
    createItem,
    deleteItem,
    persistItem,
    updateFileState,
    loadFileContent,
    filesError: null
  };
}
