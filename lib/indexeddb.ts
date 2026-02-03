import Dexie, { type EntityTable } from 'dexie';

interface FileParams {
  id: string;
  name: string;
  content: string;
  parentId: string | null; // null for root, points to a folder id
  createdAt: number;
  updatedAt: number;
}

interface FolderParams {
  id: string;
  name: string;
  parentId: string | null; // null for root, points to another folder id
  createdAt: number;
  updatedAt: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
}

interface AppSettings {
  id: string;
  apiKey?: string;
  baseUrl?: string;
  availableModels?: string[];
  starredModel?: string | null;
  systemPrompt?: string;
  updatedAt: number;
}

const db = new Dexie('MarkdownDB') as Dexie & {
  files: EntityTable<
    FileParams,
    'id' 
  >;
  folders: EntityTable<
    FolderParams,
    'id'
  >;
  chats: EntityTable<
    ChatSession,
    'id'
  >;
  settings: EntityTable<
    AppSettings,
    'id'
  >;
};

// Schema declaration:
db.version(1).stores({
  files: 'id, parentId, isFolder, name, updatedAt' 
});

db.version(2).stores({
  files: 'id, parentId, isFolder, name, updatedAt',
  chats: 'id, title, updatedAt'
});

db.version(3).stores({
  files: 'id, parentId, name, updatedAt', // removed isFolder from index
  folders: 'id, parentId, name, updatedAt',
  chats: 'id, title, updatedAt'
}).upgrade(async tx => {
  // Migrate folders from files to folders table
  const files = await tx.table('files').toArray();
  const folders = files.filter(f => f.isFolder);
  
  if (folders.length > 0) {
    await tx.table('folders').bulkAdd(folders.map(f => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt
    })));
  }

  // Remove folders from files table
  const folderIds = folders.map(f => f.id);
  // Dexie bulkDelete is supported on Table
  if (folderIds.length > 0) {
      await tx.table('files').bulkDelete(folderIds);
  }
  
  // Clean up isFolder property from remaining files
  await tx.table('files').toCollection().modify(f => {
    delete (f as any).isFolder;
  });
});

db.version(4).stores({
  files: 'id, parentId, name, updatedAt',
  folders: 'id, parentId, name, updatedAt',
  chats: 'id, title, updatedAt',
  settings: 'id'
});

export { db };
export type { FileParams, FolderParams, ChatSession, AppSettings };
