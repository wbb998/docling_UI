import React, { useState, useCallback, useRef, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Folder as FolderIcon,
  Link as UrlIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Clear as ClearIcon,
  Visibility as PreviewIcon,
  Edit as EditIcon,
  Refresh as RetryIcon,
  SelectAll as SelectAllIcon,
  Info as InfoIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon
} from '@mui/icons-material'

// 文件状态枚举
export enum FileStatus {
  PENDING = 'pending',     // 等待上传
  UPLOADING = 'uploading', // 上传中
  COMPLETED = 'completed', // 上传完成
  ERROR = 'error',         // 上传失败
  CANCELLED = 'cancelled'  // 已取消
}

// 文件项接口
export interface FileItem {
  id: string
  name: string
  originalName: string // 原始文件名
  size: number
  type: string
  status: FileStatus
  progress: number
  error?: string
  url?: string // URL上传时的源地址
  file?: File // 原始文件对象（用于预览）
  uploadTime?: Date // 上传时间
  selected?: boolean // 是否选中（用于批量操作）
}

// 上传设置接口
interface UploadSettings {
  autoStart: boolean        // 自动开始处理
  overwriteDuplicate: boolean // 重复文件覆盖
  chunkUpload: boolean      // 大文件分片上传
  maxFileSize: number       // 最大文件大小(MB)
  concurrentUploads: number // 并发上传数
}

// 支持的文件类型
const SUPPORTED_FILE_TYPES = [
  '.pdf', '.docx', '.pptx', '.html', '.htm', '.md', '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'
]

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/html',
  'text/markdown',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/webp'
]

interface FileUploadPanelProps {
  isAdvancedMode: boolean
}

export const FileUploadPanel: React.FC<FileUploadPanelProps> = ({ isAdvancedMode }) => {
  // 状态管理
  const [fileQueue, setFileQueue] = useState<FileItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [urlDialogOpen, setUrlDialogOpen] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean
    file: FileItem | null
  }>({ open: false, file: null })
  
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean
    file: FileItem | null
    newName: string
  }>({ open: false, file: null, newName: '' })
  const [selectAll, setSelectAll] = useState(false)
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    autoStart: false,
    overwriteDuplicate: false,
    chunkUpload: true,
    maxFileSize: 100,
    concurrentUploads: 3
  })

  // 计算统计信息
  const stats = useMemo(() => {
    const total = fileQueue.length
    const completed = fileQueue.filter(f => f.status === FileStatus.COMPLETED).length
    const uploading = fileQueue.filter(f => f.status === FileStatus.UPLOADING).length
    const error = fileQueue.filter(f => f.status === FileStatus.ERROR).length
    const pending = fileQueue.filter(f => f.status === FileStatus.PENDING).length
    const selected = fileQueue.filter(f => f.selected).length
    
    return { total, completed, uploading, error, pending, selected }
  }, [fileQueue])

  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 验证文件类型
  const validateFileType = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    return SUPPORTED_FILE_TYPES.includes(fileExtension) || 
           SUPPORTED_MIME_TYPES.includes(file.type)
  }

  // 验证文件大小
  const validateFileSize = (file: File): boolean => {
    const maxSizeBytes = uploadSettings.maxFileSize * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  // 添加文件到队列
  const addFilesToQueue = useCallback((files: File[]) => {
    const newFiles: FileItem[] = []
    
    files.forEach(file => {
      // 检查文件类型
      if (!validateFileType(file)) {
        console.error(`不支持的文件类型: ${file.name}`)
        return
      }
      
      // 检查文件大小
      if (!validateFileSize(file)) {
        console.error(`文件过大: ${file.name} (${formatFileSize(file.size)})`)
        return
      }
      
      // 检查重复文件
      const isDuplicate = fileQueue.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      )
      
      if (isDuplicate && !uploadSettings.overwriteDuplicate) {
        console.warn(`重复文件已跳过: ${file.name}`)
        return
      }
      
      const fileItem: FileItem = {
        id: generateId(),
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        status: FileStatus.PENDING,
        progress: 0,
        file: file,
        uploadTime: new Date(),
        selected: false
      }
      
      newFiles.push(fileItem)
    })
    
    setFileQueue(prev => {
      if (uploadSettings.overwriteDuplicate) {
        // 移除重复文件
        const filtered = prev.filter(existingFile => 
          !newFiles.some(newFile => 
            newFile.name === existingFile.name && newFile.size === existingFile.size
          )
        )
        return [...filtered, ...newFiles]
      } else {
        return [...prev, ...newFiles]
      }
    })
    
    // 自动开始上传
    if (uploadSettings.autoStart && newFiles.length > 0) {
      startUpload(newFiles.map(f => f.id))
    }
  }, [fileQueue, uploadSettings])

  // 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      addFilesToQueue(files)
    }
  }, [addFilesToQueue])

  // 文件选择处理
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      addFilesToQueue(files)
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }, [addFilesToQueue])

  // URL上传处理
  const handleUrlUpload = useCallback(() => {
    if (!urlInput.trim()) return
    
    try {
      const url = new URL(urlInput.trim())
      const fileName = url.pathname.split('/').pop() || 'downloaded-file'
      
      const fileItem: FileItem = {
        id: generateId(),
        name: fileName,
        originalName: fileName,
        size: 0, // URL文件大小未知
        type: 'application/octet-stream',
        status: FileStatus.PENDING,
        progress: 0,
        url: urlInput.trim(),
        uploadTime: new Date(),
        selected: false
      }
      
      setFileQueue(prev => [...prev, fileItem])
      setUrlInput('')
      setUrlDialogOpen(false)
      
      // 自动开始下载
      if (uploadSettings.autoStart) {
        startUpload([fileItem.id])
      }
    } catch (error) {
      console.error('无效的URL:', urlInput)
    }
  }, [urlInput, uploadSettings.autoStart])

  // 开始上传
  const startUpload = useCallback((fileIds: string[]) => {
    fileIds.forEach(fileId => {
      setFileQueue(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, status: FileStatus.UPLOADING, progress: 0 }
          : file
      ))
      
      // 模拟上传进度
      simulateUpload(fileId)
    })
  }, [])

  // 模拟上传进度（实际项目中应该是真实的上传逻辑）
  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFileQueue(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, status: FileStatus.COMPLETED, progress: 100 }
            : file
        ))
      } else {
        setFileQueue(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, progress: Math.round(progress) }
            : file
        ))
      }
    }, 200)
  }

  // 取消上传
  const cancelUpload = useCallback((fileId: string) => {
    setFileQueue(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status: FileStatus.CANCELLED, progress: 0 }
        : file
    ))
  }, [])

  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setFileQueue(prev => prev.filter(file => file.id !== fileId))
  }, [])

  // 清空队列
  const clearQueue = useCallback(() => {
    setFileQueue([])
    setSelectAll(false)
  }, [])

  // 批量选择处理
  const handleSelectAll = useCallback(() => {
    const newSelectAll = !selectAll
    setSelectAll(newSelectAll)
    setFileQueue(prev => prev.map(file => ({ ...file, selected: newSelectAll })))
  }, [selectAll])

  // 单个文件选择
  const handleFileCheckboxSelect = useCallback((fileId: string, selected: boolean) => {
    setFileQueue(prev => {
      const updated = prev.map(file => 
        file.id === fileId ? { ...file, selected } : file
      )
      // 检查是否全选
      const allSelected = updated.every(file => file.selected)
      setSelectAll(allSelected)
      return updated
    })
  }, [])

  // 批量删除选中文件
  const deleteSelectedFiles = useCallback(() => {
    setFileQueue(prev => prev.filter(file => !file.selected))
    setSelectAll(false)
  }, [])

  // 批量重试选中文件
  const retrySelectedFiles = useCallback(() => {
    const selectedIds = fileQueue.filter(file => file.selected && 
      (file.status === FileStatus.ERROR || file.status === FileStatus.CANCELLED)
    ).map(file => file.id)
    
    if (selectedIds.length > 0) {
      startUpload(selectedIds)
    }
  }, [fileQueue, startUpload])

  // 文件预览
  const handlePreviewFile = useCallback((file: FileItem) => {
    setPreviewDialog({ open: true, file })
  }, [])

  // 文件重命名
  const handleEditFileName = useCallback((file: FileItem) => {
    setRenameDialog({ open: true, file, newName: file.name })
  }, [])

  // 确认重命名
  const handleConfirmRename = useCallback(() => {
    if (renameDialog.file && renameDialog.newName.trim()) {
      setFileQueue(prev => prev.map(file => 
        file.id === renameDialog.file!.id 
          ? { 
              ...file, 
              name: renameDialog.newName.trim(),
              originalName: file.originalName || file.name
            }
          : file
      ))
      setRenameDialog({ open: false, file: null, newName: '' })
    }
  }, [renameDialog])

  // 获取上传统计信息
  const getUploadStats = useCallback(() => {
    const total = fileQueue.length
    const completed = fileQueue.filter(f => f.status === FileStatus.COMPLETED).length
    const uploading = fileQueue.filter(f => f.status === FileStatus.UPLOADING).length
    const error = fileQueue.filter(f => f.status === FileStatus.ERROR).length
    const pending = fileQueue.filter(f => f.status === FileStatus.PENDING).length
    const selected = fileQueue.filter(f => f.selected).length
    
    return { total, completed, uploading, error, pending, selected }
  }, [fileQueue])

  // 判断文件是否可预览
  const isPreviewable = (file: FileItem): boolean => {
    return file.type.startsWith('image/') || 
           file.type === 'text/plain' ||
           file.type === 'text/markdown'
  }

  // 渲染文件预览内容
  const renderPreviewContent = (file: FileItem) => {
    if (!file.file) return <Typography>无法预览此文件</Typography>

    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file.file)
      return (
        <Box sx={{ textAlign: 'center' }}>
          <img 
            src={imageUrl} 
            alt={file.name}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '400px',
              objectFit: 'contain'
            }}
            onLoad={() => URL.revokeObjectURL(imageUrl)}
          />
        </Box>
      )
    }

    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      // 对于文本文件，可以显示文件信息
      return (
        <Box>
          <Typography variant="body2" color="text.secondary">
            文件类型: {file.type}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            文件大小: {formatFileSize(file.size)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            上传时间: {file.uploadTime?.toLocaleString()}
          </Typography>
        </Box>
      )
    }

    return (
      <Box>
        <Typography variant="body1" gutterBottom>文件信息</Typography>
        <Typography variant="body2" color="text.secondary">
          文件名: {file.originalName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          文件类型: {file.type}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          文件大小: {formatFileSize(file.size)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          上传时间: {file.uploadTime?.toLocaleString()}
        </Typography>
      </Box>
    )
  }

  // 获取状态图标
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case FileStatus.PENDING:
        return <PendingIcon color="action" />
      case FileStatus.UPLOADING:
        return <UploadIcon color="primary" />
      case FileStatus.COMPLETED:
        return <CompleteIcon color="success" />
      case FileStatus.ERROR:
        return <ErrorIcon color="error" />
      case FileStatus.CANCELLED:
        return <CancelIcon color="disabled" />
      default:
        return <FileIcon />
    }
  }

  // 获取状态文本
  const getStatusText = (file: FileItem) => {
    switch (file.status) {
      case FileStatus.PENDING:
        return '等待中'
      case FileStatus.UPLOADING:
        return `上传中 ${file.progress}%`
      case FileStatus.COMPLETED:
        return '上传完成'
      case FileStatus.ERROR:
        return `错误: ${file.error || '未知错误'}`
      case FileStatus.CANCELLED:
        return '已取消'
      default:
        return '未知状态'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 标题区域 */}
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UploadIcon />
        文件上传
      </Typography>

      {/* 拖拽上传区域 */}
      <Card 
        sx={{ 
          mb: 3,
          border: isDragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
          backgroundColor: isDragOver ? '#f3f8ff' : 'background.paper',
          transition: 'all 0.3s ease'
        }}
      >
        <CardContent
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            textAlign: 'center',
            py: 4,
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            拖拽文件到此处 或 点击选择文件
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            支持: PDF, DOCX, PPTX, HTML, MD, TXT, 图片等
          </Typography>
          
          {/* 上传按钮组 */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<FileIcon />}
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              选择文件
            </Button>
            <Button
              variant="outlined"
              startIcon={<FolderIcon />}
              onClick={(e) => {
                e.stopPropagation()
                folderInputRef.current?.click()
              }}
            >
              选择文件夹
            </Button>
            <Button
              variant="outlined"
              startIcon={<UrlIcon />}
              onClick={(e) => {
                e.stopPropagation()
                setUrlDialogOpen(true)
              }}
            >
              URL输入
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={SUPPORTED_FILE_TYPES.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* 上传队列 */}
      {fileQueue.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            {/* 队列标题和统计信息 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  📋 上传队列 ({stats.total}个文件)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {stats.completed > 0 && (
                    <Chip label={`✅ 完成 ${stats.completed}`} size="small" color="success" />
                  )}
                  {stats.uploading > 0 && (
                    <Chip label={`🔄 上传中 ${stats.uploading}`} size="small" color="primary" />
                  )}
                  {stats.error > 0 && (
                    <Chip label={`❌ 错误 ${stats.error}`} size="small" color="error" />
                  )}
                  {stats.pending > 0 && (
                    <Chip label={`⏳ 等待 ${stats.pending}`} size="small" color="default" />
                  )}
                  {stats.selected > 0 && (
                    <Chip label={`☑️ 已选 ${stats.selected}`} size="small" color="info" />
                  )}
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearQueue}
              >
                清空队列
              </Button>
            </Box>

            {/* 批量操作工具栏 */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mb: 2, 
              p: 1, 
              backgroundColor: 'grey.50',
              borderRadius: 1,
              flexWrap: 'wrap'
            }}>
              <Button
                size="small"
                startIcon={<SelectAllIcon />}
                onClick={handleSelectAll}
                variant={selectAll ? "contained" : "outlined"}
              >
                {selectAll ? '取消全选' : '全选'}
              </Button>
              
              {stats.selected > 0 && (
                <>
                  <Button
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={deleteSelectedFiles}
                    color="error"
                    variant="outlined"
                  >
                    删除选中 ({stats.selected})
                  </Button>
                  
                  {fileQueue.some(f => f.selected && 
                    (f.status === FileStatus.ERROR || f.status === FileStatus.CANCELLED)) && (
                    <Button
                      size="small"
                      startIcon={<RetryIcon />}
                      onClick={retrySelectedFiles}
                      color="primary"
                      variant="outlined"
                    >
                      重试选中
                    </Button>
                  )}
                </>
              )}
            </Box>
            
            <List>
              {fileQueue.map((file, index) => (
                <React.Fragment key={file.id}>
                  <ListItem>
                    {/* 选择框 */}
                    <ListItemIcon>
                      <Checkbox
                        checked={file.selected || false}
                        onChange={(e) => handleFileCheckboxSelect(file.id, e.target.checked)}
                        size="small"
                      />
                    </ListItemIcon>
                    
                    {/* 状态图标 */}
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {getStatusIcon(file.status)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 500 }}>{file.name}</span>
                          {file.name !== file.originalName && (
                            <Chip label="已重命名" size="small" variant="outlined" />
                          )}
                          <Chip 
                            label={getStatusText(file)} 
                            size="small" 
                            color={
                              file.status === FileStatus.COMPLETED ? 'success' :
                              file.status === FileStatus.ERROR ? 'error' :
                              file.status === FileStatus.UPLOADING ? 'primary' : 'default'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <div>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {formatFileSize(file.size)}
                            {file.url && ` • 来源: ${file.url}`}
                            {file.uploadTime && ` • ${file.uploadTime.toLocaleTimeString()}`}
                          </div>
                          {file.status === FileStatus.UPLOADING && (
                            <LinearProgress 
                              variant="determinate" 
                              value={file.progress} 
                              sx={{ mt: 1 }}
                            />
                          )}
                          {file.error && (
                            <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                              {file.error}
                            </Alert>
                          )}
                        </div>
                      }
                    />
                    
                    {/* 操作按钮组 */}
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {/* 预览按钮 */}
                        {isPreviewable(file) && (
                          <IconButton 
                            onClick={() => handlePreviewFile(file)} 
                            size="small"
                            title="预览文件"
                          >
                            <PreviewIcon />
                          </IconButton>
                        )}
                        
                        {/* 重命名按钮 */}
                        {file.status !== FileStatus.UPLOADING && (
                          <IconButton 
                            onClick={() => handleEditFileName(file)} 
                            size="small"
                            title="重命名"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        
                        {/* 重试按钮 */}
                        {(file.status === FileStatus.ERROR || file.status === FileStatus.CANCELLED) && (
                          <IconButton 
                            onClick={() => startUpload([file.id])} 
                            size="small"
                            title="重试上传"
                            color="primary"
                          >
                            <RetryIcon />
                          </IconButton>
                        )}
                        
                        {/* 取消/删除按钮 */}
                        {file.status === FileStatus.UPLOADING ? (
                          <IconButton 
                            onClick={() => cancelUpload(file.id)} 
                            size="small"
                            title="取消上传"
                            color="warning"
                          >
                            <CancelIcon />
                          </IconButton>
                        ) : (
                          <IconButton 
                            onClick={() => removeFile(file.id)} 
                            size="small"
                            title="移除文件"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < fileQueue.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* 上传设置 - 高级模式显示 */}
      {isAdvancedMode && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚙️ 上传设置
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadSettings.autoStart}
                    onChange={(e) => setUploadSettings(prev => ({
                      ...prev,
                      autoStart: e.target.checked
                    }))}
                  />
                }
                label="自动开始处理"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadSettings.overwriteDuplicate}
                    onChange={(e) => setUploadSettings(prev => ({
                      ...prev,
                      overwriteDuplicate: e.target.checked
                    }))}
                  />
                }
                label="重复文件覆盖"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={uploadSettings.chunkUpload}
                    onChange={(e) => setUploadSettings(prev => ({
                      ...prev,
                      chunkUpload: e.target.checked
                    }))}
                  />
                }
                label="大文件分片上传"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>最大文件大小</InputLabel>
                <Select
                  value={uploadSettings.maxFileSize}
                  label="最大文件大小"
                  onChange={(e) => setUploadSettings(prev => ({
                    ...prev,
                    maxFileSize: e.target.value as number
                  }))}
                >
                  <MenuItem value={50}>50MB</MenuItem>
                  <MenuItem value={100}>100MB</MenuItem>
                  <MenuItem value={200}>200MB</MenuItem>
                  <MenuItem value={500}>500MB</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>并发上传数</InputLabel>
                <Select
                  value={uploadSettings.concurrentUploads}
                  label="并发上传数"
                  onChange={(e) => setUploadSettings(prev => ({
                    ...prev,
                    concurrentUploads: e.target.value as number
                  }))}
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* URL输入对话框 */}
      <Dialog open={urlDialogOpen} onClose={() => setUrlDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>从URL添加文件</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文件URL"
            type="url"
            fullWidth
            variant="outlined"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/document.pdf"
            helperText="请输入有效的文件URL地址"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUrlDialogOpen(false)}>取消</Button>
          <Button onClick={handleUrlUpload} variant="contained" disabled={!urlInput.trim()}>
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 文件预览对话框 */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, file: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PreviewIcon />
            文件预览: {previewDialog.file?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {previewDialog.file && (
            <Box>
              {/* 文件基本信息 */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>📄 文件信息</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">文件名:</Typography>
                    <Typography variant="body2">{previewDialog.file.name}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">大小:</Typography>
                    <Typography variant="body2">{formatFileSize(previewDialog.file.size)}</Typography>
                    
                    <Typography variant="body2" color="text.secondary">类型:</Typography>
                    <Typography variant="body2">{previewDialog.file.type || '未知'}</Typography>
                    
                    {previewDialog.file.url && (
                      <>
                        <Typography variant="body2" color="text.secondary">来源:</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {previewDialog.file.url}
                        </Typography>
                      </>
                    )}
                    
                    {previewDialog.file.uploadTime && (
                      <>
                        <Typography variant="body2" color="text.secondary">上传时间:</Typography>
                        <Typography variant="body2">
                          {previewDialog.file.uploadTime.toLocaleString()}
                        </Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* 图片预览 */}
              {previewDialog.file.type?.startsWith('image/') && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>🖼️ 图片预览</Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      <img
                        src={URL.createObjectURL(previewDialog.file.file)}
                        alt={previewDialog.file.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* 文档信息预览 */}
              {!previewDialog.file.type?.startsWith('image/') && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>📋 文档信息</Typography>
                    <Alert severity="info">
                      此文件类型暂不支持内容预览，上传后可进行处理。
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, file: null })}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>

      {/* 文件重命名对话框 */}
      <Dialog
        open={renameDialog.open}
        onClose={() => setRenameDialog({ open: false, file: null, newName: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            重命名文件
          </Box>
        </DialogTitle>
        <DialogContent>
          {renameDialog.file && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                原文件名: {renameDialog.file.originalName || renameDialog.file.name}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label="新文件名"
                value={renameDialog.newName}
                onChange={(e) => setRenameDialog(prev => ({ ...prev, newName: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmRename();
                  }
                }}
                helperText="请输入新的文件名（包含扩展名）"
                error={!renameDialog.newName.trim()}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog({ open: false, file: null, newName: '' })}>
            取消
          </Button>
          <Button 
            onClick={handleConfirmRename}
            variant="contained"
            disabled={!renameDialog.newName.trim()}
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}