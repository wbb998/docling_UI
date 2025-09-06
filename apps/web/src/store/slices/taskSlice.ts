import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// 任务状态类型定义
export interface TaskState {
  // 当前任务信息
  currentTask: {
    jobId?: string
    status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
    progress: {
      total: number
      completed: number
      percentage: number
      currentFile?: string
    }
    startTime?: string
    endTime?: string
    error?: string
  }
  
  // 实时日志
  logs: Array<{
    id: string
    timestamp: string
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    details?: any
  }>
  
  // 任务结果
  results: Array<{
    inputSource: string
    status: 'success' | 'failed'
    outputs?: {
      [format: string]: string
      artifacts?: {
        [type: string]: string[]
      }
    }
    error?: string
  }>
  
  // 历史任务
  history: Array<{
    jobId: string
    status: 'completed' | 'failed'
    startTime: string
    endTime: string
    fileCount: number
    successCount: number
    failedCount: number
  }>
}

// 初始状态
const initialState: TaskState = {
  currentTask: {
    status: 'idle',
    progress: {
      total: 0,
      completed: 0,
      percentage: 0,
    },
  },
  logs: [],
  results: [],
  history: [],
}

// 任务切片
const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    // 开始任务
    startTask: (state, action: PayloadAction<{ jobId?: string; totalFiles: number }>) => {
      const { jobId, totalFiles } = action.payload
      state.currentTask = {
        jobId,
        status: 'pending',
        progress: {
          total: totalFiles,
          completed: 0,
          percentage: 0,
        },
        startTime: new Date().toISOString(),
      }
      state.results = []
      // 清空旧日志，保留最近50条
      if (state.logs.length > 50) {
        state.logs = state.logs.slice(-50)
      }
    },

    // 更新任务状态
    updateTaskStatus: (state, action: PayloadAction<TaskState['currentTask']['status']>) => {
      state.currentTask.status = action.payload
      if (action.payload === 'completed' || action.payload === 'failed') {
        state.currentTask.endTime = new Date().toISOString()
      }
    },

    // 更新任务进度
    updateTaskProgress: (state, action: PayloadAction<{ completed: number; currentFile?: string }>) => {
      const { completed, currentFile } = action.payload
      state.currentTask.progress.completed = completed
      state.currentTask.progress.percentage = Math.round((completed / state.currentTask.progress.total) * 100)
      if (currentFile) {
        state.currentTask.progress.currentFile = currentFile
      }
    },

    // 设置任务错误
    setTaskError: (state, action: PayloadAction<string>) => {
      state.currentTask.error = action.payload
      state.currentTask.status = 'failed'
      state.currentTask.endTime = new Date().toISOString()
    },

    // 添加日志
    addLog: (state, action: PayloadAction<Omit<TaskState['logs'][0], 'id' | 'timestamp'>>) => {
      const log = {
        ...action.payload,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      }
      state.logs.push(log)
      
      // 限制日志数量，保持最新的100条
      if (state.logs.length > 100) {
        state.logs = state.logs.slice(-100)
      }
    },

    // 清空日志
    clearLogs: (state) => {
      state.logs = []
    },

    // 设置任务结果
    setTaskResults: (state, action: PayloadAction<TaskState['results']>) => {
      state.results = action.payload
    },

    // 添加单个结果
    addTaskResult: (state, action: PayloadAction<TaskState['results'][0]>) => {
      state.results.push(action.payload)
    },

    // 添加到历史记录
    addToHistory: (state) => {
      if (state.currentTask.jobId && state.currentTask.startTime && state.currentTask.endTime) {
        const historyItem = {
          jobId: state.currentTask.jobId,
          status: state.currentTask.status as 'completed' | 'failed',
          startTime: state.currentTask.startTime,
          endTime: state.currentTask.endTime,
          fileCount: state.currentTask.progress.total,
          successCount: state.results.filter(r => r.status === 'success').length,
          failedCount: state.results.filter(r => r.status === 'failed').length,
        }
        state.history.unshift(historyItem)
        
        // 限制历史记录数量，保持最新的20条
        if (state.history.length > 20) {
          state.history = state.history.slice(0, 20)
        }
      }
    },

    // 重置任务状态
    resetTask: (state) => {
      state.currentTask = initialState.currentTask
      state.results = []
    },

    // 取消任务
    cancelTask: (state) => {
      state.currentTask.status = 'idle'
      state.currentTask.endTime = new Date().toISOString()
      state.addLog({
        level: 'info',
        message: '任务已被用户取消',
      } as any)
    },
  },
})

export const {
  startTask,
  updateTaskStatus,
  updateTaskProgress,
  setTaskError,
  addLog,
  clearLogs,
  setTaskResults,
  addTaskResult,
  addToHistory,
  resetTask,
  cancelTask,
} = taskSlice.actions

export default taskSlice.reducer