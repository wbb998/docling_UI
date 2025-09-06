import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// API 基础配置
const baseQuery = fetchBaseQuery({
  baseUrl: '/api', // 后端API网关地址
  prepareHeaders: (headers, { getState }) => {
    // 添加请求头 - 支持幂等性和追踪
    headers.set('Content-Type', 'application/json')
    headers.set('X-Request-Id', crypto.randomUUID())
    headers.set('Idempotency-Key', crypto.randomUUID())
    return headers
  },
})

// 转换请求参数类型定义
export interface ConvertRequest {
  // 输入与输出 (Global)
  input_sources: string[]
  from_formats?: string[]
  output?: string
  image_export_mode?: 'embedded' | 'referenced' | 'placeholder'
  enable_remote_services?: boolean

  // 处理流水线 (Pipeline)
  pipeline?: 'STANDARD' | 'VLM' | 'ASR'
  pdf_backend?: 'DoclingParseV4' | 'PyPdfium2'
  ocr?: boolean
  ocr_options?: {
    engine?: string
    lang?: string
    force_ocr?: boolean
    lang_auto?: boolean
  }
  enrich_options?: {
    code?: boolean
    formula?: boolean
    picture_classes?: boolean
  }
  vlm_options?: any
  asr_model?: string

  // 任务目标 (Target)
  to_formats?: string[]
  chunking_strategy?: string
  serialization_options?: {
    exclude?: string[]
  }
  extraction_schema?: object | string

  // 附加功能 (Add-ons)
  do_picture_description?: boolean
  picture_description_options?: any
  export_artifacts?: string[]
  post_processing_options?: any

  // 性能与调试
  device?: string
  num_threads?: number
  abort_on_error?: boolean
  document_timeout?: number
  page_batch_size?: number
  verbosity?: 'error' | 'warn' | 'info' | 'debug'
  allow_external_plugins?: boolean
  show_external_plugins?: boolean
  images_scale?: number
  generate_picture_images?: boolean
}

// 转换响应类型定义
export interface ConvertResponse {
  status: 'completed' | 'failed' | 'processing'
  job_id?: string
  results?: Array<{
    input_source: string
    status: 'success' | 'failed'
    outputs?: {
      [format: string]: string
      artifacts?: {
        [type: string]: string[]
      }
    }
    error?: string
  }>
  errors?: Array<{
    code: string
    message: string
    details?: any
  }>
}

// 任务状态响应类型定义
export interface JobStatusResponse {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: {
    total: number
    completed: number
    current_file?: string
  }
  created_at: string
  updated_at: string
}

// RTK Query API 切片定义
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Convert', 'Job'],
  endpoints: (builder) => ({
    // 提交转换任务
    convert: builder.mutation<ConvertResponse, ConvertRequest>({
      query: (data) => ({
        url: '/convert',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Convert'],
    }),

    // 查询任务状态
    getJobStatus: builder.query<JobStatusResponse, string>({
      query: (jobId) => `/jobs/${jobId}/status`,
      providesTags: (result, error, jobId) => [{ type: 'Job', id: jobId }],
    }),

    // 获取任务结果
    getJobResult: builder.query<ConvertResponse, string>({
      query: (jobId) => `/jobs/${jobId}/result`,
      providesTags: (result, error, jobId) => [{ type: 'Job', id: jobId }],
    }),
  }),
})

// 导出自动生成的 hooks
export const {
  useConvertMutation,
  useGetJobStatusQuery,
  useGetJobResultQuery,
} = apiSlice