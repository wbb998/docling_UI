import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 文件队列项类型定义
export interface FileQueueItem {
  id: string
  name: string
  size: number
  type: string
  source: 'local' | 'url'
  path?: string
  url?: string
  status: 'pending' | 'uploading' | 'ready' | 'processing' | 'completed' | 'failed'
  progress?: number
  error?: string
}

// 文件队列状态类型定义
interface FileQueueState {
  items: FileQueueItem[]
  totalSize: number
  uploadProgress: number
}

// 初始状态
const initialState: FileQueueState = {
  items: [],
  totalSize: 0,
  uploadProgress: 0,
}

// 文件队列切片
const fileQueueSlice = createSlice({
  name: 'fileQueue',
  initialState,
  reducers: {
    // 添加文件到队列
    addFiles: (state, action: PayloadAction<Omit<FileQueueItem, 'id' | 'status'>[]>) => {
      const newFiles = action.payload.map(file => ({
        ...file,
        id: crypto.randomUUID(),
        status: 'pending' as const,
      }))
      state.items.push(...newFiles)
      state.totalSize = state.items.reduce((sum, item) => sum + item.size, 0)
    },

    // 添加URL文件
    addUrlFile: (state, action: PayloadAction<{ url: string; name?: string }>) => {
      const { url, name } = action.payload
      const newFile: FileQueueItem = {
        id: crypto.randomUUID(),
        name: name || url.split('/').pop() || 'Unknown',
        size: 0, // URL文件大小未知
        type: 'application/octet-stream',
        source: 'url',
        url,
        status: 'pending',
      }
      state.items.push(newFile)
    },

    // 移除文件
    removeFile: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      state.totalSize = state.items.reduce((sum, item) => sum + item.size, 0)
    },

    // 清空队列
    clearQueue: (state) => {
      state.items = []
      state.totalSize = 0
      state.uploadProgress = 0
    },

    // 更新文件状态
    updateFileStatus: (state, action: PayloadAction<{ id: string; status: FileQueueItem['status']; progress?: number; error?: string }>) => {
      const { id, status, progress, error } = action.payload
      const file = state.items.find(item => item.id === id)
      if (file) {
        file.status = status
        if (progress !== undefined) file.progress = progress
        if (error !== undefined) file.error = error
      }
    },

    // 更新上传进度
    updateUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload
    },
  },
})

export const {
  addFiles,
  addUrlFile,
  removeFile,
  clearQueue,
  updateFileStatus,
  updateUploadProgress,
} = fileQueueSlice.actions

export default fileQueueSlice.reducer