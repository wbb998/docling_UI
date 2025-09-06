import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ConvertRequest } from '../../services/api'

// 应用模式类型
export type AppMode = 'simple' | 'advanced'

// 目标模式类型
export type TargetMode = 'conversion' | 'chunking' | 'extraction'

// 配置状态类型定义
interface ConfigState {
  // 应用模式
  appMode: AppMode
  
  // 目标模式
  targetMode: TargetMode
  
  // 转换配置参数（对应API请求参数）
  convertConfig: Partial<ConvertRequest>
  
  // 表单验证状态
  validation: {
    isValid: boolean
    errors: Record<string, string>
    warnings: Record<string, string>
  }
}

// 初始状态
const initialState: ConfigState = {
  appMode: 'simple',
  targetMode: 'conversion',
  convertConfig: {
    // 默认配置 - 简单模式
    pipeline: 'STANDARD',
    to_formats: ['markdown'],
    image_export_mode: 'referenced',
    enable_remote_services: false,
    ocr: false,
    device: 'auto',
    verbosity: 'info',
  },
  validation: {
    isValid: true,
    errors: {},
    warnings: {},
  },
}

// 配置切片
const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    // 切换应用模式
    setAppMode: (state, action: PayloadAction<AppMode>) => {
      state.appMode = action.payload
      
      // 简单模式时重置为默认配置
      if (action.payload === 'simple') {
        state.convertConfig = {
          pipeline: 'STANDARD',
          to_formats: ['markdown'],
          image_export_mode: 'referenced',
          enable_remote_services: false,
          ocr: false,
          device: 'auto',
          verbosity: 'info',
        }
        state.targetMode = 'conversion'
      }
    },

    // 设置目标模式
    setTargetMode: (state, action: PayloadAction<TargetMode>) => {
      state.targetMode = action.payload
      
      // 根据目标模式调整配置
      switch (action.payload) {
        case 'conversion':
          // 转换模式：清除分块和提取相关配置
          delete state.convertConfig.chunking_strategy
          delete state.convertConfig.extraction_schema
          delete state.convertConfig.serialization_options
          if (!state.convertConfig.to_formats?.length) {
            state.convertConfig.to_formats = ['markdown']
          }
          break
          
        case 'chunking':
          // 分块模式：清除转换格式，设置分块策略
          delete state.convertConfig.to_formats
          delete state.convertConfig.extraction_schema
          state.convertConfig.chunking_strategy = 'by_element'
          break
          
        case 'extraction':
          // 提取模式：清除转换格式和分块配置
          delete state.convertConfig.to_formats
          delete state.convertConfig.chunking_strategy
          delete state.convertConfig.serialization_options
          break
      }
    },

    // 更新转换配置
    updateConvertConfig: (state, action: PayloadAction<Partial<ConvertRequest>>) => {
      state.convertConfig = { ...state.convertConfig, ...action.payload }
    },

    // 设置验证状态
    setValidation: (state, action: PayloadAction<Partial<ConfigState['validation']>>) => {
      state.validation = { ...state.validation, ...action.payload }
    },

    // 添加验证错误
    addValidationError: (state, action: PayloadAction<{ field: string; message: string }>) => {
      state.validation.errors[action.payload.field] = action.payload.message
      state.validation.isValid = false
    },

    // 清除验证错误
    clearValidationError: (state, action: PayloadAction<string>) => {
      delete state.validation.errors[action.payload]
      state.validation.isValid = Object.keys(state.validation.errors).length === 0
    },

    // 添加验证警告
    addValidationWarning: (state, action: PayloadAction<{ field: string; message: string }>) => {
      state.validation.warnings[action.payload.field] = action.payload.message
    },

    // 清除验证警告
    clearValidationWarning: (state, action: PayloadAction<string>) => {
      delete state.validation.warnings[action.payload]
    },

    // 重置配置
    resetConfig: (state) => {
      state.convertConfig = initialState.convertConfig
      state.validation = initialState.validation
    },
  },
})

export const {
  setAppMode,
  setTargetMode,
  updateConvertConfig,
  setValidation,
  addValidationError,
  clearValidationError,
  addValidationWarning,
  clearValidationWarning,
  resetConfig,
} = configSlice.actions

export default configSlice.reducer