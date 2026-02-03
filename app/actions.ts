'use server'

import { Client } from 'pg';

export async function executeQuery(uri: string, query: string, params: any[] = []) {
  if (!uri) throw new Error("Postgres URI is missing");
  
  const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

  const client = new Client({ 
    connectionString: uri,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(query, params);
    return result.rows;
  } catch (err: any) {
    console.error("DB Error", err);
    throw new Error(err.message);
  } finally {
    await client.end();
  }
}

export async function ensureFilesTable(uri: string) {
  const query = `
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      content TEXT,
      "parentId" TEXT,
      "isFolder" BOOLEAN DEFAULT FALSE,
      "createdAt" BIGINT,
      "updatedAt" BIGINT
    );
  `;
  await executeQuery(uri, query);
}

export async function ensureFoldersTable(uri: string) {
  const query = `
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "parentId" TEXT,
      "createdAt" BIGINT,
      "updatedAt" BIGINT
    );
  `;
  await executeQuery(uri, query);
  
  // Migration: Move folders from files table to folders table
  try {
    const migrateQuery = `
      INSERT INTO folders (id, name, "parentId", "createdAt", "updatedAt")
      SELECT id, name, "parentId", "createdAt", "updatedAt"
      FROM files
      WHERE "isFolder" = TRUE
      ON CONFLICT (id) DO NOTHING;
    `;
    await executeQuery(uri, migrateQuery);
    
    const deleteQuery = `DELETE FROM files WHERE "isFolder" = TRUE`;
    await executeQuery(uri, deleteQuery);
  } catch (e) {
    // Ignore error (e.g. if column isFolder doesn't exist anymore or something)
  }
}

export async function ensureChatTable(uri: string) {
  const query = `
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      messages JSONB,
      "createdAt" BIGINT,
      "updatedAt" BIGINT
    );
  `;
  await executeQuery(uri, query);
}

export async function ensureSettingsTable(uri: string) {
  const query = `
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      "apiKey" TEXT,
      "baseUrl" TEXT,
      "availableModels" JSONB,
      "starredModel" TEXT,
      "systemPrompt" TEXT,
      "updatedAt" BIGINT
    );
  `;
  await executeQuery(uri, query);
}

export async function getFiles(uri: string) {
  await ensureFilesTable(uri); 
  const query = `SELECT * FROM files`;
  return await executeQuery(uri, query);
}

export async function getFilesMetadata(uri: string) {
  await ensureFilesTable(uri); 
  const query = `SELECT id, name, "parentId", "isFolder", "createdAt", "updatedAt" FROM files`;
  return await executeQuery(uri, query);
}

export async function getFileContent(uri: string, id: string) {
  await ensureFilesTable(uri); 
  const query = `SELECT content FROM files WHERE id = $1`;
  const rows = await executeQuery(uri, query, [id]);
  return rows.length > 0 ? rows[0].content : '';
}

export async function getFolders(uri: string) {
  await ensureFoldersTable(uri);
  const query = `SELECT * FROM folders`;
  return await executeQuery(uri, query);
}

export async function saveFile(uri: string, file: any) {
  await ensureFilesTable(uri);
  // We ensure we don't save isFolder or set it to false if column exists
  // If column "isFolder" exists in DB, we should probably set it to FALSE just in case strictly.
  // But new schema might not have it.
  // The ensureFilesTable creates it with isFolder... for backward compat? 
  // I kept ensureFilesTable with isFolder. 
  
  const query = `
    INSERT INTO files (id, name, content, "parentId", "isFolder", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, FALSE, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      content = EXCLUDED.content,
      "parentId" = EXCLUDED."parentId",
      "updatedAt" = EXCLUDED."updatedAt"
  `;
  await executeQuery(uri, query, [
    file.id,
    file.name,
    file.content || "",
    file.parentId,
    file.createdAt,
    file.updatedAt
  ]);
  return { success: true };
}

export async function saveFolder(uri: string, folder: any) {
  await ensureFoldersTable(uri);
  const query = `
    INSERT INTO folders (id, name, "parentId", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      "parentId" = EXCLUDED."parentId",
      "updatedAt" = EXCLUDED."updatedAt"
  `;
  await executeQuery(uri, query, [
    folder.id,
    folder.name,
    folder.parentId,
    folder.createdAt,
    folder.updatedAt
  ]);
  return { success: true };
}

export async function deleteFile(uri: string, id: string) {
  await ensureFilesTable(uri);
  const query = `DELETE FROM files WHERE id = $1`;
  await executeQuery(uri, query, [id]);
  return { success: true };
}

export async function deleteFolder(uri: string, id: string) {
  await ensureFoldersTable(uri);
  const query = `DELETE FROM folders WHERE id = $1`;
  await executeQuery(uri, query, [id]);
  return { success: true };
}

export async function getChats(uri: string) {
  await ensureChatTable(uri);
  const query = `SELECT * FROM chats ORDER BY "updatedAt" DESC`;
  return await executeQuery(uri, query);
}

export async function saveChat(uri: string, chat: any) {
  await ensureChatTable(uri);
  const query = `
    INSERT INTO chats (id, title, messages, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      messages = EXCLUDED.messages,
      "updatedAt" = EXCLUDED."updatedAt"
  `;
  await executeQuery(uri, query, [
    chat.id,
    chat.title,
    JSON.stringify(chat.messages),
    chat.createdAt,
    chat.updatedAt
  ]);
  return { success: true };
}

export async function deleteChat(uri: string, id: string) {
  await ensureChatTable(uri);
  const query = `DELETE FROM chats WHERE id = $1`;
  await executeQuery(uri, query, [id]);
  return { success: true };
}

export async function getSettings(uri: string) {
  await ensureSettingsTable(uri);
  const query = `SELECT * FROM settings WHERE id = 'current'`;
  const results = await executeQuery(uri, query);
  return results[0] || null;
}

export async function saveSettings(uri: string, settings: any) {
  await ensureSettingsTable(uri);
  const query = `
    INSERT INTO settings (id, "apiKey", "baseUrl", "availableModels", "starredModel", "systemPrompt", "updatedAt")
    VALUES ('current', $1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      "apiKey" = EXCLUDED."apiKey",
      "baseUrl" = EXCLUDED."baseUrl",
      "availableModels" = EXCLUDED."availableModels",
      "starredModel" = EXCLUDED."starredModel",
      "systemPrompt" = EXCLUDED."systemPrompt",
      "updatedAt" = EXCLUDED."updatedAt"
  `;
  await executeQuery(uri, query, [
    settings.apiKey,
    settings.baseUrl,
    JSON.stringify(settings.availableModels),
    settings.starredModel,
    settings.systemPrompt,
    Date.now()
  ]);
  return { success: true };
}

export async function testConnection(uri: string) {
  try {
    await executeQuery(uri, 'SELECT 1');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
