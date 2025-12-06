

// services/jobStore.ts

import { CrashLog } from '../types'; // 导入 CrashLog 类型
import { CRASH_LOG_STORE_NAME } from '../constants'; // 导入崩溃日志存储名称

const DB_NAME = 'CleanLabDB';
const DB_VERSION = 2; // 将版本号从 1 提升到 2
const JOB_CONTENTS_STORE_NAME = 'jobContents'; // 原来的 STORE_NAME 重命名以区分


let dbPromise: Promise<IDBDatabase> | null = null; // 使用 Promise 来管理 DB 连接

/**
 * 初始化 IndexedDB 数据库连接的 Promise。
 * 处理数据库升级、成功打开和错误情况，并设置连接关闭的监听器。
 * @returns 一个 Promise，它在数据库成功打开并准备就绪时解析为 IDBDatabase 实例。
 */
function initializeDbPromise(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const targetDb = (event.target as IDBOpenDBRequest).result;
      if (!targetDb.objectStoreNames.contains(JOB_CONTENTS_STORE_NAME)) {
        targetDb.createObjectStore(JOB_CONTENTS_STORE_NAME, { keyPath: 'id' });
      }
      // 新增：创建崩溃日志存储
      if (!targetDb.objectStoreNames.contains(CRASH_LOG_STORE_NAME)) {
        targetDb.createObjectStore(CRASH_LOG_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB opened successfully');

      // 处理意外的数据库关闭（例如，浏览器标签页关闭，用户清除数据）
      // 当数据库版本改变或被其他连接关闭时触发
      dbInstance.onversionchange = () => {
        dbInstance.close();
        console.warn('IndexedDB version change detected, closing connection.');
        dbPromise = null; // 使 Promise 失效，强制重新初始化
      };
      // 当数据库连接意外关闭时触发
      dbInstance.onclose = () => {
        console.warn('IndexedDB connection unexpectedly closed.');
        dbPromise = null; // 使 Promise 失效
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('IndexedDB error during open:', error); // 记录原始 DOMException 对象
      reject(error || 'Failed to open IndexedDB'); // 拒绝时传递原始错误对象
      dbPromise = null; // 确保在错误时 Promise 被置为 null
    };

    // 新增：处理数据库被阻塞的情况
    request.onblocked = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (db) db.close(); // 尝试关闭旧连接
      console.warn('IndexedDB open request blocked. Please close other tabs or applications using this database.', event);
      // 可以选择在这里reject，或者等待onerror触发。通常onerror会随后触发。
    };
  });
}

/**
 * 获取 IndexedDB 数据库连接的 Promise。
 * 如果连接 Promise 不存在或已失效，则重新初始化它。
 * @returns 一个 Promise，它在数据库成功打开并准备就绪时解析为 IDBDatabase 实例。
 */
export function openJobStore(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = initializeDbPromise();
  }
  return dbPromise;
}

/**
 * 封装 IndexedDB 操作，提供自动重试机制来处理数据库连接关闭的问题。
 * @param storeName 对象存储名称。
 * @param mode 事务模式 ('readonly' 或 'readwrite')。
 * @param operation 实际执行数据库操作的函数，接收 IDBObjectStore 和 IDBTransaction 作为参数。
 * @returns 数据库操作的结果。
 */
async function runIndexedDBOperation<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore, transaction: IDBTransaction) => Promise<T>
): Promise<T> {
  const MAX_RETRIES = 1; // 最大重试次数为1
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const database = await openJobStore();
      const transaction = database.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      // 执行实际的数据库操作
      const result = await operation(store, transaction);

      // 等待事务完成
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => {
          // 捕获并传播事务错误
          console.error('IndexedDB Transaction error:', (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
        transaction.onabort = (event) => {
          // 捕获并传播事务中止错误
          console.error('IndexedDB Transaction aborted:', (event.target as IDBTransaction).error);
          reject((event.target as IDBTransaction).error);
        };
      });
      return result;
    } catch (error: any) {
      if (error instanceof DOMException && error.name === 'InvalidStateError' && retries < MAX_RETRIES) {
        console.warn(`IndexedDB connection closed during operation, retrying (attempt ${retries + 1})...`, error);
        dbPromise = null; // 强制重新初始化连接
        retries++;
        // 继续下一次循环以重试操作
      } else {
        // 对于其他类型的错误，直接重新抛出原始错误对象
        console.error('IndexedDB operation failed:', error);
        throw error; 
      }
    }
  }
  throw new Error("Failed to execute IndexedDB operation after multiple retries due to connection issues.");
}


/**
 * Stores job content (original or rewritten text) in IndexedDB.
 * @param jobId The ID of the job.
 * @param type 'originalText' or 'rewrittenText'.
 * @param content The text content to store.
 * @returns A promise that resolves when the content is stored.
 */
export async function putJobContent(jobId: string, type: 'originalText' | 'rewrittenText', content: string): Promise<void> {
  await runIndexedDBOperation(JOB_CONTENTS_STORE_NAME, 'readwrite', async (store) => {
    // Get existing entry or create a new one
    const existingEntry = await new Promise<any>((resolve, reject) => {
      const getRequest = store.get(jobId);
      getRequest.onsuccess = (event) => resolve((event.target as IDBRequest).result);
      getRequest.onerror = (event) => {
        console.error(`Error getting existing entry for ${jobId} (${type}):`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });

    const entryToPut = {
      id: jobId,
      ...existingEntry, // Merge with existing data
      [type]: content,
    };

    await new Promise<void>((resolve, reject) => {
      const putRequest = store.put(entryToPut);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = (event) => {
        console.error(`Error putting job content for ${jobId} (${type}):`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error); // 传播具体的错误对象
      };
    });
    // console.log(`Job content stored for ${jobId} (${type})`);
  });
}

/**
 * Retrieves job content (original or rewritten text) from IndexedDB.
 * @param jobId The ID of the job.
 * @param type 'originalText' or 'rewrittenText'.
 * @returns A promise that resolves with the text content, or undefined if not found.
 */
export async function getJobContent(jobId: string, type: 'originalText' | 'rewrittenText'): Promise<string | undefined> {
  try {
    return await runIndexedDBOperation(JOB_CONTENTS_STORE_NAME, 'readonly', async (store) => {
      return await new Promise((resolve, reject) => {
        const request = store.get(jobId);
        request.onsuccess = (event) => {
          const result = (event.target as IDBRequest).result;
          resolve(result ? result[type] : undefined);
        };
        request.onerror = (event) => {
          console.error(`Error getting job content for ${jobId} (${type}):`, (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error); // 传播具体的错误对象
        };
      });
    });
  } catch (error) {
    // runIndexedDBOperation 内部已打印错误，这里只返回 undefined
    return undefined; 
  }
}

/**
 * Deletes all content for a specific job from IndexedDB.
 * @param jobId The ID of the job to delete.
 * @returns A promise that resolves when the content is deleted.
 */
export async function deleteJobContent(jobId: string): Promise<void> {
  await runIndexedDBOperation(JOB_CONTENTS_STORE_NAME, 'readwrite', async (store) => {
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(jobId);
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error(`Error deleting job content for ${jobId}:`, (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error); // 传播具体的错误对象
      };
    });
    console.log(`Job content deleted for ${jobId}`);
  });
}

/**
 * Clears all job content from IndexedDB.
 * @returns A promise that resolves when the store is cleared.
 */
export async function clearJobStore(): Promise<void> {
  await runIndexedDBOperation(JOB_CONTENTS_STORE_NAME, 'readwrite', async (store) => {
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error clearing job store:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error); // 传播具体的错误对象
      };
    });
    console.log('IndexedDB job store cleared successfully.');
  });
}

/**
 * Stores a crash log in IndexedDB.
 * @param log The crash log object to store.
 * @returns A promise that resolves when the log is stored.
 */
export async function putCrashLog(log: CrashLog): Promise<void> {
  await runIndexedDBOperation(CRASH_LOG_STORE_NAME, 'readwrite', async (store) => {
    await new Promise<void>((resolve, reject) => {
      const putRequest = store.put(log);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = (event) => {
        console.error('Error putting crash log:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error); // 传播具体的错误对象
      };
    });
  });
}

/**
 * Retrieves all crash logs from IndexedDB.
 * @returns A promise that resolves with an array of CrashLog objects.
 */
export async function getCrashLogs(): Promise<CrashLog[]> {
  try {
    return await runIndexedDBOperation(CRASH_LOG_STORE_NAME, 'readonly', async (store) => {
      return await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = (event) => resolve((event.target as IDBRequest).result as CrashLog[]);
        request.onerror = (event) => {
          console.error('Error getting crash logs:', (event.target as IDBRequest).error);
          reject((event.target as IDBRequest).error); // 传播具体的错误对象
        };
      });
    });
  } catch (error) {
    console.error('Failed to retrieve crash logs:', error);
    return []; // 在获取失败时返回空数组
  }
}

/**
 * Clears all crash logs from IndexedDB.
 * @returns A promise that resolves when the store is cleared.
 */
export async function clearCrashLogs(): Promise<void> {
  await runIndexedDBOperation(CRASH_LOG_STORE_NAME, 'readwrite', async (store) => {
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (event) => {
        console.error('Error clearing crash log store:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error); // 传播具体的错误对象
      };
    });
    console.log('IndexedDB crash log store cleared successfully.');
  });
}


/**
 * Estimates the storage usage for IndexedDB and the overall origin.
 * @returns A promise resolving to an object with totalBytes, usedBytes, and indexedDBBytes.
 */
export async function getStorageEstimate(): Promise<{ totalBytes: number | null; usedBytes: number | null; indexedDBBytes: number }> {
  let totalBytes: number | null = null;
  let usedBytes: number | null = null;

  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      totalBytes = estimate.quota || null;
      usedBytes = estimate.usage || null;
    }

    let currentIndexedDBBytes = 0;

    // Estimate size for job contents
    try { // Added try-catch for individual store estimation
      currentIndexedDBBytes += await runIndexedDBOperation(JOB_CONTENTS_STORE_NAME, 'readonly', async (store) => {
        let storeBytes = 0;
        await new Promise<void>((resolve, reject) => {
          const request = store.openCursor();
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor) {
              const entry = cursor.value;
              if (entry.originalText) {
                storeBytes += new TextEncoder().encode(entry.originalText).length;
              }
              if (entry.rewrittenText) {
                storeBytes += new TextEncoder().encode(entry.rewrittenText).length;
              }
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = (event) => {
            console.error('Error getting IndexedDB job contents size:', (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        });
        return storeBytes;
      });
    } catch (e) {
      console.warn('Failed to estimate size for jobContents store:', e);
      // Continue without adding bytes for this store
    }


    // Estimate size for crash logs
    try { // Added try-catch for individual store estimation
      currentIndexedDBBytes += await runIndexedDBOperation(CRASH_LOG_STORE_NAME, 'readonly', async (store) => {
        let storeBytes = 0;
        await new Promise<void>((resolve, reject) => {
          const request = store.openCursor();
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
            if (cursor) {
              const entry = cursor.value;
              // A simple approximation for string length in bytes
              storeBytes += new TextEncoder().encode(JSON.stringify(entry)).length;
              cursor.continue();
            } else {
              resolve();
            }
          };
          request.onerror = (event) => {
            console.error('Error getting IndexedDB crash logs size:', (event.target as IDBRequest).error);
            reject((event.target as IDBRequest).error);
          };
        });
        return storeBytes;
      });
    } catch (e) {
      console.warn('Failed to estimate size for crashLogs store:', e);
      // Continue without adding bytes for this store
    }


    return { totalBytes, usedBytes, indexedDBBytes: currentIndexedDBBytes };
  } catch (error) {
    console.error('Error in getStorageEstimate:', error); // Top-level error for entire estimation process
    // runIndexedDBOperation 内部已打印错误，这里只返回默认值
    return { totalBytes: null, usedBytes: null, indexedDBBytes: 0 };
  }
}