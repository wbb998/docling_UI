/**
 * 文件会话服务
 * 专门处理文件的会话级持久化，解决File对象无法序列化到localStorage的问题
 */

export interface SessionFileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  // 文件内容的Base64编码（小文件）
  content?: string;
  // 是否为大文件（使用临时URL）
  isLargeFile: boolean;
  // 临时URL（仅在当前会话有效）
  tempUrl?: string;
}

export interface UploadFileWithSession {
  id: string;
  file: File | null;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cached';
  progress: number;
  error: string | null;
  uploadTime: Date;
}

class FileSessionService {
  private static instance: FileSessionService;
  private readonly SESSION_KEY = 'docling_session_files';
  private readonly MAX_FILE_SIZE_FOR_BASE64 = 5 * 1024 * 1024; // 5MB以下使用Base64
  private fileObjectCache: Map<string, File> = new Map();

  static getInstance(): FileSessionService {
    if (!FileSessionService.instance) {
      FileSessionService.instance = new FileSessionService();
    }
    return FileSessionService.instance;
  }

  /**
   * 保存文件到会话存储
   */
  async saveFiles(files: UploadFileWithSession[]): Promise<void> {
    try {
      const sessionFiles: SessionFileInfo[] = [];

      for (const uploadFile of files) {
        if (!uploadFile.file) continue;

        const file = uploadFile.file;
        const sessionFileInfo: SessionFileInfo = {
          id: uploadFile.id,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          isLargeFile: file.size > this.MAX_FILE_SIZE_FOR_BASE64
        };

        // 缓存File对象到内存
        this.fileObjectCache.set(uploadFile.id, file);

        // 小文件转换为Base64存储
        if (!sessionFileInfo.isLargeFile) {
          try {
            sessionFileInfo.content = await this.fileToBase64(file);
          } catch (error) {
            console.warn(`文件 ${file.name} Base64转换失败，使用临时URL:`, error);
            sessionFileInfo.isLargeFile = true;
          }
        }

        // 大文件创建临时URL
        if (sessionFileInfo.isLargeFile) {
          sessionFileInfo.tempUrl = URL.createObjectURL(file);
        }

        sessionFiles.push(sessionFileInfo);
      }

      // 保存到SessionStorage
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionFiles));
      console.log(`已保存 ${sessionFiles.length} 个文件到会话存储`);
    } catch (error) {
      console.error('保存文件到会话存储失败:', error);
    }
  }

  /**
   * 从会话存储恢复文件
   */
  async restoreFiles(): Promise<UploadFileWithSession[]> {
    try {
      const stored = sessionStorage.getItem(this.SESSION_KEY);
      if (!stored) {
        return [];
      }

      const sessionFiles: SessionFileInfo[] = JSON.parse(stored);
      const restoredFiles: UploadFileWithSession[] = [];

      for (const sessionFile of sessionFiles) {
        let file: File | null = null;

        // 首先尝试从内存缓存获取
        const cachedFile = this.fileObjectCache.get(sessionFile.id);
        if (cachedFile) {
          file = cachedFile;
        } else {
          // 尝试从存储的数据恢复File对象
          if (!sessionFile.isLargeFile && sessionFile.content) {
            // 从Base64恢复小文件
            try {
              file = await this.base64ToFile(
                sessionFile.content,
                sessionFile.name,
                sessionFile.type
              );
              // 重新缓存到内存
              this.fileObjectCache.set(sessionFile.id, file);
            } catch (error) {
              console.warn(`从Base64恢复文件 ${sessionFile.name} 失败:`, error);
            }
          }
        }

        const uploadFile: UploadFileWithSession = {
          id: sessionFile.id,
          file: file,
          name: sessionFile.name,
          size: sessionFile.size,
          type: sessionFile.type,
          status: file ? 'cached' : 'error',
          progress: file ? 100 : 0,
          error: file ? null : '文件会话已过期，请重新上传',
          uploadTime: new Date()
        };

        restoredFiles.push(uploadFile);
      }

      console.log(`从会话存储恢复了 ${restoredFiles.length} 个文件`);
      return restoredFiles;
    } catch (error) {
      console.error('从会话存储恢复文件失败:', error);
      return [];
    }
  }

  /**
   * 清除会话存储的文件
   */
  clearFiles(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
      this.fileObjectCache.clear();
      console.log('已清除会话存储的文件');
    } catch (error) {
      console.error('清除会话存储文件失败:', error);
    }
  }

  /**
   * 获取缓存的File对象
   */
  getCachedFile(id: string): File | null {
    return this.fileObjectCache.get(id) || null;
  }

  /**
   * 将File转换为Base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 将Base64转换为File
   */
  private async base64ToFile(base64: string, fileName: string, mimeType: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], fileName, { type: mimeType });
  }
}

// 导出单例实例
export const fileSessionService = FileSessionService.getInstance();