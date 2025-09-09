import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControlLabel,
  Switch,
  Snackbar
} from '@mui/material'
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as PendingIcon,
  Speed as ProcessingIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Settings as ConfigIcon,
  Timeline as ProgressIcon,
  BugReport as DebugIcon
} from '@mui/icons-material'

// 任务状态枚举
export enum TaskStatus {
  IDLE = 'idle',           // 空闲状态
  PREPARING = 'preparing', // 准备中
  RUNNING = 'running',     // 运行中
  PAUSED = 'paused',       // 已暂停
  COMPLETED = 'completed', // 已完成
  FAILED = 'failed',       // 失败
  CANCELLED = 'cancelled'  // 已取消
}

// 任务优先级
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 文件处理状态
export enum FileStatus {
  PENDING = 'pending',     // 等待处理
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed', // 处理完成
  FAILED = 'failed',       // 处理失败
  SKIPPED = 'skipped'      // 跳过
}

// 任务信息接口
interface TaskInfo {
  jobId: string
  status: TaskStatus
  priority: TaskPriority
  startTime?: Date
  endTime?: Date
  totalFiles: number
  processedFiles: number
  failedFiles: number
  skippedFiles: number
  currentFile?: string
  progress: number // 0-100
  estimatedTimeRemaining?: number // 秒
  errorMessage?: string
  warnings: string[]
}

// 文件处理信息接口
interface FileProcessInfo {
  filename: string
  status: FileStatus
  progress: number
  startTime?: Date
  endTime?: Date
  errorMessage?: string
  outputPath?: string
  size: number
  processingTime?: number
}

// SSE事件类型
interface SSEEvent {
  type: 'progress' | 'file_start' | 'file_complete' | 'file_error' | 'task_complete' | 'task_error' | 'log'
  data: any
  timestamp: Date
}

// 执行控制面板属性
interface ExecutionControlPanelProps {
  // 配置数据（从其他模块传入）
  files: File[]
  targetModeConfig: any
  pipelineConfig: any
  additionalFeaturesConfig: any
  // 回调函数
  onTaskStart?: (jobId: string) => void
  onTaskComplete?: (jobId: string, results: any) => void
  onTaskError?: (jobId: string, error: string) => void
}

export const ExecutionControlPanel: React.FC<ExecutionControlPanelProps> = ({
  files,
  targetModeConfig,
  pipelineConfig,
  additionalFeaturesConfig,
  onTaskStart,
  onTaskComplete,
  onTaskError
}) => {
  // 任务状态管理
  const [taskInfo, setTaskInfo] = useState<TaskInfo>({
    jobId: '',
    status: TaskStatus.IDLE,
    priority: TaskPriority.NORMAL,
    totalFiles: 0,
    processedFiles: 0,
    failedFiles: 0,
    skippedFiles: 0,
    progress: 0,
    warnings: []
  })

  // 文件处理状态
  const [fileProcessList, setFileProcessList] = useState<FileProcessInfo[]>([])
  
  // SSE连接状态
  const [sseConnected, setSseConnected] = useState(false)
  const [sseEvents, setSseEvents] = useState<SSEEvent[]>([])
  
  // UI状态
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false)
  const [showFileDetails, setShowFileDetails] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(2000) // 2秒
  
  // 对话框状态
  const [confirmCancelDialog, setConfirmCancelDialog] = useState(false)
  const [taskCompleteDialog, setTaskCompleteDialog] = useState(false)
  
  // 通知状态
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as 'success' | 'error' | 'warning' | 'info' })

  // 引用
  const sseRef = useRef<EventSource | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 初始化文件处理列表
  useEffect(() => {
    const fileList: FileProcessInfo[] = files.map(file => ({
      filename: file.name,
      status: FileStatus.PENDING,
      progress: 0,
      size: file.size
    }))
    setFileProcessList(fileList)
    setTaskInfo(prev => ({ ...prev, totalFiles: files.length }))
  }, [files])

  // 自动刷新定时器
  useEffect(() => {
    if (autoRefresh && taskInfo.status === TaskStatus.RUNNING && taskInfo.jobId) {
      refreshTimerRef.current = setInterval(() => {
        fetchTaskStatus(taskInfo.jobId)
      }, refreshInterval)
    } else {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefresh, taskInfo.status, taskInfo.jobId, refreshInterval])

  // 清理资源
  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.close()
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  // 构建请求参数
  const buildRequestParams = useCallback(() => {
    const params: any = {
      // 目标模式配置
      mode: targetModeConfig.mode,
      to_formats: targetModeConfig.outputFormats,
      from_formats: targetModeConfig.sourceFormats,
      
      // 性能配置
      device: targetModeConfig.device,
      threads: targetModeConfig.threads,
      batch_size: targetModeConfig.batchSize,
      
      // 错误处理
      continue_on_error: targetModeConfig.continueOnError,
      max_retries: targetModeConfig.maxRetries,
      
      // 流水线配置
      pipeline_type: pipelineConfig.type
    }

    // 根据流水线类型添加特定配置
    if (pipelineConfig.type === 'STANDARD') {
      params.ocr_engine = pipelineConfig.standard.ocrEngine
      params.enable_ocr_enhancement = pipelineConfig.standard.enableOcrEnhancement
      params.ocr_confidence_threshold = pipelineConfig.standard.ocrConfidenceThreshold
      params.enable_layout_analysis = pipelineConfig.standard.enableLayoutAnalysis
      params.enable_table_detection = pipelineConfig.standard.enableTableDetection
    } else if (pipelineConfig.type === 'VLM') {
      params.vlm_use_local = pipelineConfig.vlm.useLocal
      params.vlm_local_model = pipelineConfig.vlm.localModel
      params.vlm_remote_model = pipelineConfig.vlm.remoteModel
      params.vlm_remote_endpoint = pipelineConfig.vlm.remoteEndpoint
      params.vlm_api_key = pipelineConfig.vlm.apiKey
      params.vlm_max_tokens = pipelineConfig.vlm.maxTokens
      params.vlm_temperature = pipelineConfig.vlm.temperature
    } else if (pipelineConfig.type === 'ASR') {
      params.asr_model = pipelineConfig.asr.model
      params.asr_language = pipelineConfig.asr.language
      params.asr_enable_translation = pipelineConfig.asr.enableTranslation
      params.asr_target_language = pipelineConfig.asr.targetLanguage
    }

    // 附加功能配置
    if (additionalFeaturesConfig.imageDescription.mode !== 'disabled') {
      params.enable_image_description = true
      params.image_description_mode = additionalFeaturesConfig.imageDescription.mode
      if (additionalFeaturesConfig.imageDescription.mode === 'local') {
        params.image_description_model = additionalFeaturesConfig.imageDescription.localModel
      } else {
        params.image_description_service = additionalFeaturesConfig.imageDescription.remoteService
        params.image_description_endpoint = additionalFeaturesConfig.imageDescription.remoteEndpoint
        params.image_description_api_key = additionalFeaturesConfig.imageDescription.apiKey
      }
    }

    // 导出格式配置
    params.export_formats = additionalFeaturesConfig.artifactExport.enabledFormats

    // 翻译配置
    if (additionalFeaturesConfig.postProcessing.enableTranslation) {
      params.enable_translation = true
      params.translation_source_language = additionalFeaturesConfig.postProcessing.sourceLanguage
      params.translation_target_languages = additionalFeaturesConfig.postProcessing.targetLanguages
      params.translation_service = additionalFeaturesConfig.postProcessing.translationService
    }

    return params
  }, [targetModeConfig, pipelineConfig, additionalFeaturesConfig])

  // 启动任务
  const startTask = useCallback(async () => {
    try {
      // 验证文件
      if (files.length === 0) {
        showNotification('请先上传文件', 'warning')
        return
      }

      // 构建请求参数（使用JSON格式，符合后端API文档规范）
      const params = buildRequestParams()
      
      // 添加输入源（模拟文件路径，实际应用中需要先上传文件获取路径）
      const input_sources = files.map(file => file.name)
      
      const requestBody = {
        input_sources,
        ...params
      }

      // 更新状态为准备中
      setTaskInfo(prev => ({
        ...prev,
        status: TaskStatus.PREPARING,
        startTime: new Date(),
        progress: 0,
        processedFiles: 0,
        failedFiles: 0,
        skippedFiles: 0,
        warnings: []
      }))

      // 发送请求（使用JSON格式）
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (jsonError) {
          // 如果响应不是JSON格式，使用默认错误消息
          console.warn('响应不是有效的JSON格式:', jsonError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      const jobId = result.job_id || result.jobId

      // 更新任务信息
      setTaskInfo(prev => ({
        ...prev,
        jobId,
        status: TaskStatus.RUNNING,
        progress: 0
      }))

      // 建立SSE连接
      connectSSE(jobId)

      // 开始轮询状态
      if (autoRefresh) {
        setTimeout(() => fetchTaskStatus(jobId), 1000)
      }

      // 通知回调
      onTaskStart?.(jobId)
      showNotification('任务已启动', 'success')

    } catch (error) {
      console.error('启动任务失败:', error)
      setTaskInfo(prev => ({
        ...prev,
        status: TaskStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : '未知错误'
      }))
      showNotification(`启动任务失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
      onTaskError?.(taskInfo.jobId, error instanceof Error ? error.message : '未知错误')
    }
  }, [files, buildRequestParams, autoRefresh, onTaskStart, onTaskError, taskInfo.jobId])

  // 取消任务
  const cancelTask = useCallback(async () => {
    if (!taskInfo.jobId) return

    try {
      const response = await fetch(`/api/jobs/${taskInfo.jobId}/cancel`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setTaskInfo(prev => ({
        ...prev,
        status: TaskStatus.CANCELLED,
        endTime: new Date()
      }))

      // 关闭SSE连接
      if (sseRef.current) {
        sseRef.current.close()
        setSseConnected(false)
      }

      showNotification('任务已取消', 'info')
      setConfirmCancelDialog(false)

    } catch (error) {
      console.error('取消任务失败:', error)
      showNotification(`取消任务失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error')
    }
  }, [taskInfo.jobId])

  // 获取任务状态
  const fetchTaskStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const statusData = await response.json()
      
      // 更新任务信息
      setTaskInfo(prev => ({
        ...prev,
        status: statusData.status,
        progress: statusData.progress || 0,
        processedFiles: statusData.processed_files || 0,
        failedFiles: statusData.failed_files || 0,
        skippedFiles: statusData.skipped_files || 0,
        currentFile: statusData.current_file,
        estimatedTimeRemaining: statusData.estimated_time_remaining,
        errorMessage: statusData.error_message,
        warnings: statusData.warnings || []
      }))

      // 更新文件处理状态
      if (statusData.file_status) {
        setFileProcessList(prev => 
          prev.map(file => {
            const fileStatus = statusData.file_status[file.filename]
            return fileStatus ? { ...file, ...fileStatus } : file
          })
        )
      }

      // 检查任务是否完成
      if (statusData.status === TaskStatus.COMPLETED) {
        setTaskInfo(prev => ({ ...prev, endTime: new Date() }))
        setTaskCompleteDialog(true)
        onTaskComplete?.(jobId, statusData.results)
        
        // 关闭SSE连接
        if (sseRef.current) {
          sseRef.current.close()
          setSseConnected(false)
        }
      } else if (statusData.status === TaskStatus.FAILED) {
        setTaskInfo(prev => ({ ...prev, endTime: new Date() }))
        onTaskError?.(jobId, statusData.error_message || '任务执行失败')
        
        // 关闭SSE连接
        if (sseRef.current) {
          sseRef.current.close()
          setSseConnected(false)
        }
      }

    } catch (error) {
      console.error('获取任务状态失败:', error)
      // 不显示错误通知，避免频繁弹窗
    }
  }, [onTaskComplete, onTaskError])

  // 建立SSE连接
  const connectSSE = useCallback((jobId: string) => {
    try {
      const eventSource = new EventSource(`/api/jobs/${jobId}/events`)
      
      eventSource.onopen = () => {
        setSseConnected(true)
        console.log('SSE连接已建立')
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const sseEvent: SSEEvent = {
            type: data.type,
            data: data.data,
            timestamp: new Date()
          }
          
          setSseEvents(prev => [...prev.slice(-99), sseEvent]) // 保留最近100条事件
          
          // 处理不同类型的事件
          switch (data.type) {
            case 'progress':
              setTaskInfo(prev => ({ ...prev, progress: data.progress || 0 }))
              break
            case 'file_start':
              setTaskInfo(prev => ({ ...prev, currentFile: data.data.filename }))
              setFileProcessList(prev => 
                prev.map(file => 
                  file.filename === data.data.filename 
                    ? { ...file, status: FileStatus.PROCESSING, startTime: new Date() }
                    : file
                )
              )
              break
            case 'file_complete':
              setFileProcessList(prev => 
                prev.map(file => 
                  file.filename === data.data.filename 
                    ? { 
                        ...file, 
                        status: FileStatus.COMPLETED, 
                        endTime: new Date(),
                        progress: 100,
                        outputPath: data.data.output_path,
                        processingTime: data.data.processing_time
                      }
                    : file
                )
              )
              break
            case 'file_error':
              setFileProcessList(prev => 
                prev.map(file => 
                  file.filename === data.data.filename 
                    ? { 
                        ...file, 
                        status: FileStatus.FAILED, 
                        endTime: new Date(),
                        errorMessage: data.data.error_message
                      }
                    : file
                )
              )
              break
            case 'task_complete':
              setTaskInfo(prev => ({ 
                ...prev, 
                status: TaskStatus.COMPLETED,
                endTime: new Date(),
                progress: 100
              }))
              setTaskCompleteDialog(true)
              break
            case 'task_error':
              setTaskInfo(prev => ({ 
                ...prev, 
                status: TaskStatus.FAILED,
                endTime: new Date(),
                errorMessage: data.data.error_message
              }))
              break
          }
        } catch (error) {
          console.error('解析SSE事件失败:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error)
        setSseConnected(false)
        eventSource.close()
      }

      sseRef.current = eventSource

    } catch (error) {
      console.error('建立SSE连接失败:', error)
      setSseConnected(false)
    }
  }, [])

  // 显示通知
  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  // 关闭通知
  const closeNotification = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }, [])

  // 重置任务
  const resetTask = useCallback(() => {
    setTaskInfo({
      jobId: '',
      status: TaskStatus.IDLE,
      priority: TaskPriority.NORMAL,
      totalFiles: files.length,
      processedFiles: 0,
      failedFiles: 0,
      skippedFiles: 0,
      progress: 0,
      warnings: []
    })
    
    setFileProcessList(prev => 
      prev.map(file => ({
        ...file,
        status: FileStatus.PENDING,
        progress: 0,
        startTime: undefined,
        endTime: undefined,
        errorMessage: undefined,
        outputPath: undefined,
        processingTime: undefined
      }))
    )
    
    setSseEvents([])
    
    if (sseRef.current) {
      sseRef.current.close()
      setSseConnected(false)
    }
  }, [files.length])

  // 获取状态颜色
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.IDLE: return 'default'
      case TaskStatus.PREPARING: return 'info'
      case TaskStatus.RUNNING: return 'primary'
      case TaskStatus.PAUSED: return 'warning'
      case TaskStatus.COMPLETED: return 'success'
      case TaskStatus.FAILED: return 'error'
      case TaskStatus.CANCELLED: return 'default'
      default: return 'default'
    }
  }

  // 获取状态图标
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.IDLE: return <PendingIcon />
      case TaskStatus.PREPARING: return <InfoIcon />
      case TaskStatus.RUNNING: return <ProcessingIcon />
      case TaskStatus.PAUSED: return <PauseIcon />
      case TaskStatus.COMPLETED: return <SuccessIcon />
      case TaskStatus.FAILED: return <ErrorIcon />
      case TaskStatus.CANCELLED: return <CancelIcon />
      default: return <InfoIcon />
    }
  }

  // 格式化时间
  const formatTime = (seconds?: number) => {
    if (!seconds) return '--'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 0 }}>
      {/* 主控制面板 */}
      <Card sx={{ mb: 3, mx: 0, borderRadius: 2, boxShadow: 1 }}>
        <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProcessingIcon />
            🚀 任务执行控制
          </Typography>

          {/* 任务状态概览 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  icon={getStatusIcon(taskInfo.status)}
                  label={taskInfo.status ? taskInfo.status.toUpperCase() : 'UNKNOWN'}
                  color={getStatusColor(taskInfo.status)}
                  variant="filled"
                />
                {taskInfo.jobId && (
                  <Typography variant="body2" color="text.secondary">
                    任务ID: {taskInfo.jobId.slice(0, 8)}...
                  </Typography>
                )}
                {sseConnected && (
                  <Chip label="实时连接" size="small" color="success" variant="outlined" />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={startTask}
                  disabled={taskInfo.status === TaskStatus.RUNNING || taskInfo.status === TaskStatus.PREPARING || files.length === 0}
                  color="primary"
                >
                  开始执行
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<StopIcon />}
                  onClick={() => setConfirmCancelDialog(true)}
                  disabled={taskInfo.status !== TaskStatus.RUNNING && taskInfo.status !== TaskStatus.PREPARING}
                  color="error"
                >
                  取消任务
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={resetTask}
                  disabled={taskInfo.status === TaskStatus.RUNNING || taskInfo.status === TaskStatus.PREPARING}
                >
                  重置
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* 进度条 */}
          {(taskInfo.status === TaskStatus.RUNNING || taskInfo.status === TaskStatus.PREPARING) && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  总体进度: {taskInfo.processedFiles}/{taskInfo.totalFiles} 文件
                </Typography>
                <Typography variant="body2">
                  {taskInfo.progress.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={taskInfo.progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              {taskInfo.currentFile && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  当前处理: {taskInfo.currentFile}
                </Typography>
              )}
              {taskInfo.estimatedTimeRemaining && (
                <Typography variant="body2" color="text.secondary">
                  预计剩余时间: {formatTime(taskInfo.estimatedTimeRemaining)}
                </Typography>
              )}
            </Box>
          )}

          {/* 统计信息 */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {taskInfo.totalFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总文件数
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {taskInfo.processedFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  已处理
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">
                  {taskInfo.failedFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  失败
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {taskInfo.skippedFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  跳过
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* 错误信息 */}
          {taskInfo.errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {taskInfo.errorMessage}
            </Alert>
          )}

          {/* 警告信息 */}
          {taskInfo.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                发现 {taskInfo.warnings.length} 个警告:
              </Typography>
              <List dense>
                {taskInfo.warnings.map((warning, index) => (
                  <ListItem key={index} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <WarningIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={warning} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}

          {/* 高级信息切换 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="自动刷新"
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => setShowFileDetails(!showFileDetails)}
                variant={showFileDetails ? "contained" : "outlined"}
              >
                文件详情
              </Button>
              <Button
                size="small"
                startIcon={<DebugIcon />}
                onClick={() => setShowLogs(!showLogs)}
                variant={showLogs ? "contained" : "outlined"}
              >
                实时日志
              </Button>
              <Button
                size="small"
                startIcon={<ConfigIcon />}
                onClick={() => setShowAdvancedInfo(!showAdvancedInfo)}
                variant={showAdvancedInfo ? "contained" : "outlined"}
              >
                高级信息
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 文件处理详情 */}
      {showFileDetails && (
        <Card sx={{ mb: 3, mx: 0, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" gutterBottom>
              📄 文件处理详情
            </Typography>
            <List>
              {fileProcessList.map((file, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    {file.status === FileStatus.PENDING && <PendingIcon color="disabled" />}
                    {file.status === FileStatus.PROCESSING && <ProcessingIcon color="primary" />}
                    {file.status === FileStatus.COMPLETED && <SuccessIcon color="success" />}
                    {file.status === FileStatus.FAILED && <ErrorIcon color="error" />}
                    {file.status === FileStatus.SKIPPED && <WarningIcon color="warning" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.filename}
                    secondary={
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            大小: {formatFileSize(file.size)}
                            {file.processingTime && ` | 处理时间: ${formatTime(file.processingTime)}`}
                            {file.outputPath && ` | 输出: ${file.outputPath}`}
                          </Typography>
                          <Chip 
                            label={file.status ? file.status.toUpperCase() : 'UNKNOWN'} 
                            size="small" 
                            color={
                              file.status === FileStatus.COMPLETED ? 'success' :
                              file.status === FileStatus.FAILED ? 'error' :
                              file.status === FileStatus.PROCESSING ? 'primary' :
                              file.status === FileStatus.SKIPPED ? 'warning' : 'default'
                            }
                          />
                        </Box>
                        {file.status === FileStatus.PROCESSING && (
                          <LinearProgress 
                            variant="determinate" 
                            value={file.progress} 
                            sx={{ mt: 1, height: 4, borderRadius: 2 }}
                          />
                        )}
                        {file.errorMessage && (
                          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
                            错误: {file.errorMessage}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  {file.outputPath && (
                    <IconButton size="small" color="primary">
                      <DownloadIcon />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 实时日志 */}
      {showLogs && (
        <Card sx={{ mb: 3, mx: 0, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" gutterBottom>
              📋 实时日志 {sseConnected && <Chip label="已连接" size="small" color="success" />}
            </Typography>
            <Box sx={{ 
              maxHeight: 300, 
              overflowY: 'auto', 
              backgroundColor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              fontFamily: 'monospace'
            }}>
              {sseEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  暂无日志信息
                </Typography>
              ) : (
                sseEvents.map((event, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      [{event.timestamp.toLocaleTimeString()}] {event.type}:
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ ml: 2, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(event.data, null, 2)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 高级信息 */}
      {showAdvancedInfo && (
        <Card sx={{ mb: 3, mx: 0, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" gutterBottom>
              🔧 高级信息
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="刷新间隔 (毫秒)"
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 2000)}
                  inputProps={{ min: 500, max: 10000 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  任务开始时间: {taskInfo.startTime?.toLocaleString() || '--'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  任务结束时间: {taskInfo.endTime?.toLocaleString() || '--'}
                </Typography>
                {taskInfo.startTime && taskInfo.endTime && (
                  <Typography variant="body2" color="text.secondary">
                    总耗时: {formatTime((taskInfo.endTime.getTime() - taskInfo.startTime.getTime()) / 1000)}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* 取消确认对话框 */}
      <Dialog open={confirmCancelDialog} onClose={() => setConfirmCancelDialog(false)}>
        <DialogTitle>确认取消任务</DialogTitle>
        <DialogContent>
          <Typography>
            确定要取消当前正在执行的任务吗？已处理的文件结果将会保留。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancelDialog(false)}>
            继续执行
          </Button>
          <Button onClick={cancelTask} color="error" variant="contained">
            确认取消
          </Button>
        </DialogActions>
      </Dialog>

      {/* 任务完成对话框 */}
      <Dialog open={taskCompleteDialog} onClose={() => setTaskCompleteDialog(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SuccessIcon color="success" />
          任务执行完成
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            🎉 任务已成功完成！
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 总文件数: {taskInfo.totalFiles}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 成功处理: {taskInfo.processedFiles}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 处理失败: {taskInfo.failedFiles}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 跳过文件: {taskInfo.skippedFiles}
          </Typography>
          {taskInfo.startTime && taskInfo.endTime && (
            <Typography variant="body2" color="text.secondary">
              • 总耗时: {formatTime((taskInfo.endTime.getTime() - taskInfo.startTime.getTime()) / 1000)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskCompleteDialog(false)}>
            关闭
          </Button>
          <Button variant="contained" startIcon={<ViewIcon />}>
            查看结果
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={closeNotification} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ExecutionControlPanel