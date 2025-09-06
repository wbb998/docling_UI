import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apiSlice } from '../services/api'
import fileQueueReducer from './slices/fileQueueSlice'
import configReducer from './slices/configSlice'
import taskReducer from './slices/taskSlice'

// Redux store 配置 - 集中管理应用状态
export const store = configureStore({
  reducer: {
    // API 切片 - 处理所有后端通信
    api: apiSlice.reducer,
    // 文件队列管理
    fileQueue: fileQueueReducer,
    // 配置管理（转换参数、流水线设置等）
    config: configReducer,
    // 任务状态管理（进度、日志、结果等）
    task: taskReducer,
  },
  // 添加 RTK Query 中间件
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略 RTK Query 的内部 action 类型
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
})

// 启用 RTK Query 的缓存和重新获取功能
setupListeners(store.dispatch)

// 导出类型定义
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch