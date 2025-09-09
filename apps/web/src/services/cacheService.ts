/**
 * 全局缓存服务
 * 负责管理用户数据的本地存储，包括表单输入、页面状态、交互信息等
 */

// 文件信息接口（用于缓存File对象的基本信息）
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  // 添加一个标识符用于区分文件
  id: string;
}

// 缓存数据类型定义
export interface CacheData {
  // 表单数据
  formData: {
    targetModeConfig: any;
    pipelineConfig: any;
    additionalFeaturesConfig: any;
    uploadedFiles: FileInfo[]; // 改为文件信息数组
  };
  // 界面状态
  uiState: {
    selectedNavItem: string;
    expandedGroups: string[];
    rightDrawerOpen: boolean;
    isAdvancedMode: boolean;
    scrollPositions: Record<string, number>;
    expandedSections: Record<string, Record<string, boolean>>;
  };
  // 任务状态
  taskState: {
    currentJobId: string;
    taskResults: any;
    validationResults: any[];
  };
  // 缓存元数据
  metadata: {
    timestamp: number;
    version: string;
    expiresAt: number;
  };
}

// 缓存配置
const CACHE_CONFIG = {
  // 缓存键名
  CACHE_KEY: 'docling_ui_cache',
  // 缓存版本（用于版本兼容性检查）
  VERSION: '1.0.1', // 更新版本号
  // 默认过期时间（24小时）
  DEFAULT_EXPIRY: 24 * 60 * 60 * 1000,
  // 最大缓存大小（5MB）
  MAX_SIZE: 5 * 1024 * 1024
};

/**
 * 缓存服务类
 */
class CacheService {
  private cache: CacheData | null = null;
  private listeners: Set<(data: CacheData | null) => void> = new Set();
  // 存储实际的File对象（内存中，不持久化）
  private fileObjects: Map<string, File> = new Map();

  /**
   * 初始化缓存服务
   */
  init(): void {
    try {
      this.loadFromStorage();
      this.startCleanupTimer();
      console.log('缓存服务初始化成功');
    } catch (error) {
      console.error('缓存服务初始化失败:', error);
      this.clearCache();
    }
  }

  /**
   * 从本地存储加载缓存数据
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_CONFIG.CACHE_KEY);
      if (!stored) {
        console.log('未找到缓存数据');
        return;
      }

      const parsed = JSON.parse(stored) as CacheData;
      
      // 检查版本兼容性
      if (parsed.metadata.version !== CACHE_CONFIG.VERSION) {
        console.warn('缓存版本不兼容，清除旧缓存');
        this.clearCache();
        return;
      }

      // 检查是否过期
      if (Date.now() > parsed.metadata.expiresAt) {
        console.log('缓存已过期，清除缓存');
        this.clearCache();
        return;
      }

      this.cache = parsed;
      console.log('缓存数据加载成功:', this.cache);
    } catch (error) {
      console.error('加载缓存数据失败:', error);
      this.clearCache();
    }
  }

  /**
   * 保存缓存数据到本地存储
   */
  private saveToStorage(): void {
    try {
      if (!this.cache) return;

      // 更新时间戳
      this.cache.metadata.timestamp = Date.now();

      const serialized = JSON.stringify(this.cache);
      
      // 检查大小限制
      if (serialized.length > CACHE_CONFIG.MAX_SIZE) {
        console.warn('缓存数据过大，执行清理');
        this.performCleanup();
        return;
      }

      localStorage.setItem(CACHE_CONFIG.CACHE_KEY, serialized);
      console.log('缓存数据保存成功');
    } catch (error) {
      console.error('保存缓存数据失败:', error);
      // 如果是存储空间不足，尝试清理
      if (error instanceof DOMException && error.code === 22) {
        this.performCleanup();
      }
    }
  }

  /**
   * 获取缓存数据
   */
  getCache(): CacheData | null {
    return this.cache;
  }

  /**
   * 将File对象转换为FileInfo
   */
  private fileToFileInfo(file: File): FileInfo {
    const id = `${file.name}_${file.size}_${file.lastModified}`;
    // 存储实际的File对象到内存中
    this.fileObjects.set(id, file);
    return {
      id,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }

  /**
   * 根据FileInfo获取File对象
   */
  getFileById(id: string): File | null {
    return this.fileObjects.get(id) || null;
  }

  /**
   * 获取所有缓存的文件信息
   */
  getCachedFileInfos(): FileInfo[] {
    return this.cache?.formData.uploadedFiles || [];
  }

  /**
   * 更新表单数据
   */
  updateFormData(formData: Partial<CacheData['formData']>): void {
    if (!this.cache) {
      this.initializeCache();
    }
    
    // 处理文件上传数据
    const processedFormData = { ...formData };
    if (formData.uploadedFiles && Array.isArray(formData.uploadedFiles)) {
      // 如果是File对象数组，转换为FileInfo数组
      if (formData.uploadedFiles.length > 0 && formData.uploadedFiles[0] instanceof File) {
        processedFormData.uploadedFiles = (formData.uploadedFiles as File[]).map(file => 
          this.fileToFileInfo(file)
        );
      }
      // 如果已经是FileInfo数组，直接使用
    }
    
    this.cache!.formData = {
      ...this.cache!.formData,
      ...processedFormData
    };
    
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * 更新界面状态
   */
  updateUIState(uiState: Partial<CacheData['uiState']>): void {
    if (!this.cache) {
      this.initializeCache();
    }
    
    this.cache!.uiState = {
      ...this.cache!.uiState,
      ...uiState
    };
    
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * 更新任务状态
   */
  updateTaskState(taskState: Partial<CacheData['taskState']>): void {
    if (!this.cache) {
      this.initializeCache();
    }
    
    this.cache!.taskState = {
      ...this.cache!.taskState,
      ...taskState
    };
    
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * 保存页面滚动位置
   */
  saveScrollPosition(pageId: string, position: number): void {
    if (!this.cache) {
      this.initializeCache();
    }
    
    this.cache!.uiState.scrollPositions[pageId] = position;
    this.saveToStorage();
  }

  /**
   * 获取页面滚动位置
   */
  getScrollPosition(pageId: string): number {
    return this.cache?.uiState.scrollPositions[pageId] || 0;
  }

  /**
   * 保存组件展开状态
   */
  saveExpandedState(componentId: string, expandedState: Record<string, boolean>): void {
    if (!this.cache) {
      this.initializeCache();
    }
    
    this.cache!.uiState.expandedSections[componentId] = expandedState;
    this.saveToStorage();
  }

  /**
   * 获取组件展开状态
   */
  getExpandedState(componentId: string): Record<string, boolean> {
    return this.cache?.uiState.expandedSections[componentId] || {};
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache = null;
    this.fileObjects.clear(); // 清除内存中的File对象
    localStorage.removeItem(CACHE_CONFIG.CACHE_KEY);
    this.notifyListeners();
    console.log('缓存已清除');
  }

  /**
   * 手动清除过期缓存
   */
  clearExpiredCache(): void {
    if (this.cache && Date.now() > this.cache.metadata.expiresAt) {
      this.clearCache();
    }
  }

  /**
   * 获取缓存状态信息
   */
  getCacheStatus(): {
    hasCache: boolean;
    size: number;
    lastUpdated: number | null;
    expiresAt: number | null;
    version: string | null;
    fileCount: number;
  } {
    const stored = localStorage.getItem(CACHE_CONFIG.CACHE_KEY);
    return {
      hasCache: !!this.cache,
      size: stored ? stored.length : 0,
      lastUpdated: this.cache?.metadata.timestamp || null,
      expiresAt: this.cache?.metadata.expiresAt || null,
      version: this.cache?.metadata.version || null,
      fileCount: this.cache?.formData.uploadedFiles?.length || 0
    };
  }

  /**
   * 设置缓存过期时间
   */
  setExpiry(expiryMs: number): void {
    if (!this.cache) {
      this.initializeCache();
    }
    
    this.cache!.metadata.expiresAt = Date.now() + expiryMs;
    this.saveToStorage();
  }

  /**
   * 添加缓存变化监听器
   */
  addListener(listener: (data: CacheData | null) => void): void {
    this.listeners.add(listener);
  }

  /**
   * 移除缓存变化监听器
   */
  removeListener(listener: (data: CacheData | null) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * 初始化空缓存
   */
  private initializeCache(): void {
    this.cache = {
      formData: {
        targetModeConfig: null,
        pipelineConfig: null,
        additionalFeaturesConfig: null,
        uploadedFiles: []
      },
      uiState: {
        selectedNavItem: 'file-upload',
        expandedGroups: ['file-management'],
        rightDrawerOpen: false,
        isAdvancedMode: false,
        scrollPositions: {},
        expandedSections: {}
      },
      taskState: {
        currentJobId: '',
        taskResults: null,
        validationResults: []
      },
      metadata: {
        timestamp: Date.now(),
        version: CACHE_CONFIG.VERSION,
        expiresAt: Date.now() + CACHE_CONFIG.DEFAULT_EXPIRY
      }
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.cache);
      } catch (error) {
        console.error('缓存监听器执行失败:', error);
      }
    });
  }

  /**
   * 执行缓存清理
   */
  private performCleanup(): void {
    if (!this.cache) return;

    // 清理旧的滚动位置（只保留最近10个）
    const scrollPositions = this.cache.uiState.scrollPositions;
    const scrollKeys = Object.keys(scrollPositions);
    if (scrollKeys.length > 10) {
      const toKeep = scrollKeys.slice(-10);
      this.cache.uiState.scrollPositions = toKeep.reduce((acc, key) => {
        acc[key] = scrollPositions[key];
        return acc;
      }, {} as Record<string, number>);
    }

    // 清理旧的展开状态（只保留最近使用的）
    const expandedSections = this.cache.uiState.expandedSections;
    const sectionKeys = Object.keys(expandedSections);
    if (sectionKeys.length > 20) {
      const toKeep = sectionKeys.slice(-20);
      this.cache.uiState.expandedSections = toKeep.reduce((acc, key) => {
        acc[key] = expandedSections[key];
        return acc;
      }, {} as Record<string, Record<string, boolean>>);
    }

    // 清理过多的文件信息（只保留最近50个）
    if (this.cache.formData.uploadedFiles.length > 50) {
      const filesToKeep = this.cache.formData.uploadedFiles.slice(-50);
      this.cache.formData.uploadedFiles = filesToKeep;
      
      // 同时清理对应的File对象
      const keepIds = new Set(filesToKeep.map(f => f.id));
      for (const [id, file] of this.fileObjects.entries()) {
        if (!keepIds.has(id)) {
          this.fileObjects.delete(id);
        }
      }
    }

    this.saveToStorage();
    console.log('缓存清理完成');
  }

  /**
   * 启动定时清理器
   */
  private startCleanupTimer(): void {
    // 每小时检查一次过期缓存
    setInterval(() => {
      this.clearExpiredCache();
    }, 60 * 60 * 1000);
  }
}

// 创建全局缓存服务实例
export const cacheService = new CacheService();

// 导出缓存相关的React Hook
export const useCacheService = () => {
  return cacheService;
};

// 导出缓存状态Hook
import { useState, useEffect } from 'react';

export const useCacheData = () => {
  const [cacheData, setCacheData] = useState<CacheData | null>(cacheService.getCache());

  useEffect(() => {
    const listener = (data: CacheData | null) => {
      setCacheData(data);
    };

    cacheService.addListener(listener);
    return () => cacheService.removeListener(listener);
  }, []);

  return cacheData;
};

// 导出缓存状态监控Hook
export const useCacheStatus = () => {
  const [status, setStatus] = useState(cacheService.getCacheStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(cacheService.getCacheStatus());
    };

    const listener = () => updateStatus();
    cacheService.addListener(listener);
    
    // 定时更新状态
    const interval = setInterval(updateStatus, 5000);

    return () => {
      cacheService.removeListener(listener);
      clearInterval(interval);
    };
  }, []);

  return status;
};