import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Grid,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  LinearProgress,
  Snackbar,
  Menu,
  MenuList,
  ListItemButton,
  Checkbox,
  FormControlLabel,
  Switch
} from '@mui/material'
import {
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  Archive as ZipIcon,
  Description as MarkdownIcon,
  Code as HtmlIcon,
  DataObject as JsonIcon,
  Image as ImageIcon,
  TableChart as CsvIcon,
  Storage as ParquetIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  GetApp as ExportIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
  Close as CloseIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material'

// 结果文件类型枚举
export enum ResultFileType {
  MARKDOWN = 'markdown',
  HTML = 'html',
  JSON = 'json',
  CSV = 'csv',
  PNG = 'png',
  PARQUET = 'parquet',
  ERROR_LOG = 'error_log'
}

// 处理状态枚举
export enum ProcessingStatus {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  PARTIAL = 'partial'
}

// 结果文件信息接口
interface ResultFile {
  id: string
  originalFilename: string
  outputFilename: string
  fileType: ResultFileType
  size: number
  status: ProcessingStatus
  downloadUrl: string
  previewUrl?: string
  createdAt: Date
  processingTime: number
  errorMessage?: string
  warnings: string[]
  metadata: {
    pages?: number
    words?: number
    images?: number
    tables?: number
    [key: string]: any
  }
}

// 任务结果信息接口
interface TaskResult {
  jobId: string
  status: ProcessingStatus
  totalFiles: number
  successFiles: number
  errorFiles: number
  warningFiles: number
  startTime: Date
  endTime: Date
  processingTime: number
  files: ResultFile[]
  globalErrors: string[]
  summary: {
    totalPages: number
    totalWords: number
    totalImages: number
    totalTables: number
  }
}

// 预览内容接口
interface PreviewContent {
  type: ResultFileType
  content: string
  metadata?: any
}

// 筛选和排序选项
interface FilterOptions {
  status: ProcessingStatus | 'all'
  fileType: ResultFileType | 'all'
  searchQuery: string
}

interface SortOptions {
  field: 'filename' | 'size' | 'createdAt' | 'processingTime'
  direction: 'asc' | 'desc'
}

// 结果预览面板属性
interface ResultPreviewPanelProps {
  jobId?: string
  taskResult?: TaskResult
  onRefresh?: () => void
  onDownloadFile?: (fileId: string) => void
  onDownloadAll?: (format: 'zip' | 'individual') => void
}

export const ResultPreviewPanel: React.FC<ResultPreviewPanelProps> = ({
  jobId,
  taskResult,
  onRefresh,
  onDownloadFile,
  onDownloadAll
}) => {
  // 状态管理
  const [selectedTab, setSelectedTab] = useState(0) // 0: 文件列表, 1: 预览, 2: 错误报告, 3: 统计信息
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean
    file: ResultFile | null
    content: PreviewContent | null
    loading: boolean
  }>({ open: false, file: null, content: null, loading: false })
  
  // 筛选和排序
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'all',
    fileType: 'all',
    searchQuery: ''
  })
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    field: 'createdAt',
    direction: 'desc'
  })
  
  // UI状态
  const [downloadProgress, setDownloadProgress] = useState<{
    visible: boolean
    progress: number
    message: string
  }>({ visible: false, progress: 0, message: '' })
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '', severity: 'info' })
  
  const [contextMenu, setContextMenu] = useState<{
    open: boolean
    anchorEl: HTMLElement | null
    file: ResultFile | null
  }>({ open: false, anchorEl: null, file: null })

  // 模拟数据（实际应用中从props或API获取）
  const mockTaskResult: TaskResult = useMemo(() => {
    if (taskResult) return taskResult
    
    return {
      jobId: jobId || 'job_12345',
      status: ProcessingStatus.SUCCESS,
      totalFiles: 5,
      successFiles: 4,
      errorFiles: 1,
      warningFiles: 2,
      startTime: new Date(Date.now() - 300000), // 5分钟前
      endTime: new Date(),
      processingTime: 285,
      globalErrors: [
        '文件 document3.pdf 处理失败：不支持的PDF版本',
        '远程VLM服务连接超时，已切换到本地模式'
      ],
      summary: {
        totalPages: 156,
        totalWords: 45230,
        totalImages: 23,
        totalTables: 12
      },
      files: [
        {
          id: 'file_1',
          originalFilename: 'document1.pdf',
          outputFilename: 'document1.md',
          fileType: ResultFileType.MARKDOWN,
          size: 15420,
          status: ProcessingStatus.SUCCESS,
          downloadUrl: '/api/download/file_1',
          previewUrl: '/api/preview/file_1',
          createdAt: new Date(Date.now() - 60000),
          processingTime: 45,
          warnings: [],
          metadata: {
            pages: 12,
            words: 3420,
            images: 5,
            tables: 2
          }
        },
        {
          id: 'file_2',
          originalFilename: 'presentation.pptx',
          outputFilename: 'presentation.html',
          fileType: ResultFileType.HTML,
          size: 28750,
          status: ProcessingStatus.WARNING,
          downloadUrl: '/api/download/file_2',
          previewUrl: '/api/preview/file_2',
          createdAt: new Date(Date.now() - 120000),
          processingTime: 78,
          warnings: ['部分图片无法提取', '检测到损坏的表格'],
          metadata: {
            pages: 24,
            words: 1850,
            images: 12,
            tables: 3
          }
        },
        {
          id: 'file_3',
          originalFilename: 'data.xlsx',
          outputFilename: 'data.json',
          fileType: ResultFileType.JSON,
          size: 8960,
          status: ProcessingStatus.SUCCESS,
          downloadUrl: '/api/download/file_3',
          previewUrl: '/api/preview/file_3',
          createdAt: new Date(Date.now() - 180000),
          processingTime: 23,
          warnings: [],
          metadata: {
            pages: 1,
            words: 0,
            tables: 5,
            rows: 1250
          }
        },
        {
          id: 'file_4',
          originalFilename: 'report.docx',
          outputFilename: 'report.csv',
          fileType: ResultFileType.CSV,
          size: 12340,
          status: ProcessingStatus.WARNING,
          downloadUrl: '/api/download/file_4',
          createdAt: new Date(Date.now() - 240000),
          processingTime: 67,
          warnings: ['表格格式不规范', '部分单元格合并导致数据丢失'],
          metadata: {
            pages: 8,
            words: 2340,
            tables: 4,
            rows: 890
          }
        },
        {
          id: 'file_5',
          originalFilename: 'document3.pdf',
          outputFilename: 'document3_error.log',
          fileType: ResultFileType.ERROR_LOG,
          size: 1250,
          status: ProcessingStatus.ERROR,
          downloadUrl: '/api/download/file_5',
          createdAt: new Date(Date.now() - 300000),
          processingTime: 12,
          errorMessage: '不支持的PDF版本，无法解析文档结构',
          warnings: [],
          metadata: {}
        }
      ]
    }
  }, [taskResult, jobId])

  // 筛选和排序后的文件列表
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = mockTaskResult.files

    // 应用筛选
    if (filterOptions.status !== 'all') {
      filtered = filtered.filter(file => file.status === filterOptions.status)
    }
    
    if (filterOptions.fileType !== 'all') {
      filtered = filtered.filter(file => file.fileType === filterOptions.fileType)
    }
    
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase()
      filtered = filtered.filter(file => 
        file.originalFilename.toLowerCase().includes(query) ||
        file.outputFilename.toLowerCase().includes(query)
      )
    }

    // 应用排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortOptions.field) {
        case 'filename':
          aValue = a.originalFilename.toLowerCase()
          bValue = b.originalFilename.toLowerCase()
          break
        case 'size':
          aValue = a.size
          bValue = b.size
          break
        case 'createdAt':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'processingTime':
          aValue = a.processingTime
          bValue = b.processingTime
          break
        default:
          return 0
      }
      
      if (sortOptions.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [mockTaskResult.files, filterOptions, sortOptions])

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: ResultFileType) => {
    switch (fileType) {
      case ResultFileType.MARKDOWN: return <MarkdownIcon />
      case ResultFileType.HTML: return <HtmlIcon />
      case ResultFileType.JSON: return <JsonIcon />
      case ResultFileType.CSV: return <CsvIcon />
      case ResultFileType.PNG: return <ImageIcon />
      case ResultFileType.PARQUET: return <ParquetIcon />
      case ResultFileType.ERROR_LOG: return <ErrorIcon />
      default: return <FileIcon />
    }
  }

  // 获取状态颜色和图标
  const getStatusInfo = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.SUCCESS:
        return { color: 'success', icon: <SuccessIcon />, label: '成功' }
      case ProcessingStatus.WARNING:
        return { color: 'warning', icon: <WarningIcon />, label: '警告' }
      case ProcessingStatus.ERROR:
        return { color: 'error', icon: <ErrorIcon />, label: '失败' }
      case ProcessingStatus.PARTIAL:
        return { color: 'info', icon: <InfoIcon />, label: '部分' }
      default:
        return { color: 'default', icon: <InfoIcon />, label: '未知' }
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

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  // 预览文件
  const previewFile = useCallback(async (file: ResultFile) => {
    if (!file.previewUrl) {
      showNotification('该文件不支持预览', 'warning')
      return
    }

    setPreviewDialog(prev => ({ ...prev, open: true, file, loading: true }))

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      let content: PreviewContent
      
      switch (file.fileType) {
        case ResultFileType.MARKDOWN:
          content = {
            type: ResultFileType.MARKDOWN,
            content: `# ${file.originalFilename}\n\n这是一个示例Markdown文档的预览内容。\n\n## 主要内容\n\n- 文档包含 ${file.metadata.pages} 页\n- 总计 ${file.metadata.words} 个单词\n- 包含 ${file.metadata.images} 张图片\n- 包含 ${file.metadata.tables} 个表格\n\n## 处理信息\n\n处理时间: ${formatTime(file.processingTime)}\n文件大小: ${formatFileSize(file.size)}`
          }
          break
        case ResultFileType.HTML:
          content = {
            type: ResultFileType.HTML,
            content: `<!DOCTYPE html>\n<html>\n<head>\n    <title>${file.originalFilename}</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 20px; }\n        .header { color: #1976d2; }\n        .content { margin: 20px 0; }\n        .metadata { background: #f5f5f5; padding: 10px; border-radius: 4px; }\n    </style>\n</head>\n<body>\n    <h1 class="header">${file.originalFilename}</h1>\n    <div class="content">\n        <p>这是一个示例HTML文档的预览内容。</p>\n        <div class="metadata">\n            <h3>文档信息</h3>\n            <ul>\n                <li>页数: ${file.metadata.pages}</li>\n                <li>单词数: ${file.metadata.words}</li>\n                <li>图片数: ${file.metadata.images}</li>\n                <li>表格数: ${file.metadata.tables}</li>\n            </ul>\n        </div>\n    </div>\n</body>\n</html>`
          }
          break
        case ResultFileType.JSON:
          content = {
            type: ResultFileType.JSON,
            content: JSON.stringify({
              filename: file.originalFilename,
              metadata: file.metadata,
              processing: {
                time: file.processingTime,
                status: file.status,
                warnings: file.warnings
              },
              data: {
                example: "这是示例JSON数据",
                tables: Array.from({ length: file.metadata.tables || 0 }, (_, i) => ({
                  id: i + 1,
                  name: `表格${i + 1}`,
                  rows: Math.floor(Math.random() * 100) + 10
                }))
              }
            }, null, 2)
          }
          break
        default:
          content = {
            type: file.fileType,
            content: `文件类型: ${file.fileType}\n文件名: ${file.outputFilename}\n大小: ${formatFileSize(file.size)}\n状态: ${getStatusInfo(file.status).label}`
          }
      }

      setPreviewDialog(prev => ({ ...prev, content, loading: false }))
    } catch (error) {
      console.error('预览文件失败:', error)
      setPreviewDialog(prev => ({ ...prev, loading: false }))
      showNotification('预览文件失败', 'error')
    }
  }, [])

  // 下载文件
  const downloadFile = useCallback(async (file: ResultFile) => {
    try {
      onDownloadFile?.(file.id)
      showNotification(`开始下载 ${file.outputFilename}`, 'success')
    } catch (error) {
      console.error('下载文件失败:', error)
      showNotification('下载文件失败', 'error')
    }
  }, [onDownloadFile])

  // 批量下载
  const downloadSelected = useCallback(async (format: 'zip' | 'individual') => {
    if (selectedFiles.length === 0) {
      showNotification('请先选择要下载的文件', 'warning')
      return
    }

    try {
      setDownloadProgress({ visible: true, progress: 0, message: '准备下载...' })
      
      // 模拟下载进度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setDownloadProgress(prev => ({ 
          ...prev, 
          progress: i, 
          message: i === 100 ? '下载完成' : `下载中... ${i}%`
        }))
      }

      onDownloadAll?.(format)
      showNotification(`成功下载 ${selectedFiles.length} 个文件`, 'success')
      
      setTimeout(() => {
        setDownloadProgress({ visible: false, progress: 0, message: '' })
      }, 2000)
    } catch (error) {
      console.error('批量下载失败:', error)
      showNotification('批量下载失败', 'error')
      setDownloadProgress({ visible: false, progress: 0, message: '' })
    }
  }, [selectedFiles, onDownloadAll])

  // 显示通知
  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  // 关闭通知
  const closeNotification = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }, [])

  // 处理文件选择
  const handleFileSelect = useCallback((fileId: string, selected: boolean) => {
    setSelectedFiles(prev => 
      selected 
        ? [...prev, fileId]
        : prev.filter(id => id !== fileId)
    )
  }, [])

  // 全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedFiles(selected ? filteredAndSortedFiles.map(f => f.id) : [])
  }, [filteredAndSortedFiles])

  // 右键菜单
  const handleContextMenu = useCallback((event: React.MouseEvent, file: ResultFile) => {
    event.preventDefault()
    setContextMenu({
      open: true,
      anchorEl: event.currentTarget as HTMLElement,
      file
    })
  }, [])

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu({ open: false, anchorEl: null, file: null })
  }, [])

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: 0 }}>
      {/* 任务结果概览 */}
      <Card sx={{ mb: 3, mx: 0, borderRadius: 2, boxShadow: 1 }}>
        <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PreviewIcon />
            📊 任务结果概览
            <Chip 
              label={getStatusInfo(mockTaskResult.status).label}
              color={getStatusInfo(mockTaskResult.status).color as any}
              icon={getStatusInfo(mockTaskResult.status).icon}
              size="small"
            />
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary">
                  {mockTaskResult.totalFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总文件数
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main">
                  {mockTaskResult.successFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  成功处理
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="warning.main">
                  {mockTaskResult.warningFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  警告
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="error.main">
                  {mockTaskResult.errorFiles}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  失败
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              处理时间: {formatTime(mockTaskResult.processingTime)} | 
              总页数: {mockTaskResult.summary.totalPages} | 
              总字数: {mockTaskResult.summary.totalWords.toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                variant="outlined"
              >
                刷新
              </Button>
              <Button
                size="small"
                startIcon={<ZipIcon />}
                onClick={() => downloadSelected('zip')}
                variant="contained"
                disabled={selectedFiles.length === 0}
              >
                打包下载
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 主要内容区域 */}
      <Card sx={{ mb: 3, mx: 0, borderRadius: 2, boxShadow: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
            <Tab label="文件列表" />
            <Tab label="预览" disabled={!previewDialog.file} />
            <Tab label="错误报告" />
            <Tab label="统计信息" />
          </Tabs>
        </Box>

        {/* 文件列表标签页 */}
        {selectedTab === 0 && (
          <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
            {/* 筛选和排序工具栏 */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="搜索文件..."
                value={filterOptions.searchQuery}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, searchQuery: e.target.value }))}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: 200 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>状态筛选</InputLabel>
                <Select
                  value={filterOptions.status}
                  label="状态筛选"
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="all">全部</MenuItem>
                  <MenuItem value={ProcessingStatus.SUCCESS}>成功</MenuItem>
                  <MenuItem value={ProcessingStatus.WARNING}>警告</MenuItem>
                  <MenuItem value={ProcessingStatus.ERROR}>失败</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>类型筛选</InputLabel>
                <Select
                  value={filterOptions.fileType}
                  label="类型筛选"
                  onChange={(e) => setFilterOptions(prev => ({ ...prev, fileType: e.target.value as any }))}
                >
                  <MenuItem value="all">全部</MenuItem>
                  <MenuItem value={ResultFileType.MARKDOWN}>Markdown</MenuItem>
                  <MenuItem value={ResultFileType.HTML}>HTML</MenuItem>
                  <MenuItem value={ResultFileType.JSON}>JSON</MenuItem>
                  <MenuItem value={ResultFileType.CSV}>CSV</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>排序方式</InputLabel>
                <Select
                  value={`${sortOptions.field}_${sortOptions.direction}`}
                  label="排序方式"
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('_')
                    setSortOptions({ field: field as any, direction: direction as any })
                  }}
                >
                  <MenuItem value="createdAt_desc">时间↓</MenuItem>
                  <MenuItem value="createdAt_asc">时间↑</MenuItem>
                  <MenuItem value="filename_asc">文件名↑</MenuItem>
                  <MenuItem value="filename_desc">文件名↓</MenuItem>
                  <MenuItem value="size_desc">大小↓</MenuItem>
                  <MenuItem value="size_asc">大小↑</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedFiles.length === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                    indeterminate={selectedFiles.length > 0 && selectedFiles.length < filteredAndSortedFiles.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                }
                label="全选"
              />
            </Box>

            {/* 文件列表 */}
            <List>
              {filteredAndSortedFiles.map((file) => {
                const statusInfo = getStatusInfo(file.status)
                return (
                  <ListItem
                    key={file.id}
                    sx={{ 
                      px: 0, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onChange={(e) => handleFileSelect(file.id, e.target.checked)}
                      />
                    </ListItemIcon>
                    <ListItemIcon>
                      {getFileTypeIcon(file.fileType)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {file.outputFilename}
                          </Typography>
                          <Chip 
                            label={statusInfo.label}
                            color={statusInfo.color as any}
                            size="small"
                            icon={statusInfo.icon}
                          />
                          {file.warnings.length > 0 && (
                            <Tooltip title={file.warnings.join('; ')}>
                              <WarningIcon color="warning" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            原文件: {file.originalFilename} | 
                            大小: {formatFileSize(file.size)} | 
                            处理时间: {formatTime(file.processingTime)}
                          </Typography>
                          {file.errorMessage && (
                            <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                              错误: {file.errorMessage}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {file.previewUrl && (
                          <Tooltip title="预览">
                            <IconButton size="small" onClick={() => previewFile(file)}>
                              <PreviewIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="下载">
                          <IconButton size="small" onClick={() => downloadFile(file)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={(e) => handleContextMenu(e, file)}>
                          <MoreIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>

            {filteredAndSortedFiles.length === 0 && (
              <Alert severity="info">
                没有找到符合条件的文件
              </Alert>
            )}
          </CardContent>
        )}

        {/* 错误报告标签页 */}
        {selectedTab === 2 && (
          <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" gutterBottom>
              🚨 错误报告
            </Typography>
            
            {mockTaskResult.globalErrors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  全局错误
                </Typography>
                {mockTaskResult.globalErrors.map((error, index) => (
                  <Alert key={index} severity="error" sx={{ mb: 1 }}>
                    {error}
                  </Alert>
                ))}
              </Box>
            )}

            <Typography variant="subtitle2" gutterBottom>
              文件级错误
            </Typography>
            {mockTaskResult.files
              .filter(file => file.status === ProcessingStatus.ERROR || file.errorMessage)
              .map((file) => (
                <Accordion key={file.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" />
                      <Typography>{file.originalFilename}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="error.main">
                      {file.errorMessage}
                    </Typography>
                    {file.warnings.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          相关警告:
                        </Typography>
                        {file.warnings.map((warning, index) => (
                          <Typography key={index} variant="body2" color="warning.main">
                            • {warning}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}

            {mockTaskResult.files.filter(file => file.status === ProcessingStatus.ERROR).length === 0 && (
              <Alert severity="success">
                🎉 没有发现错误！所有文件都已成功处理。
              </Alert>
            )}
          </CardContent>
        )}

        {/* 统计信息标签页 */}
        {selectedTab === 3 && (
          <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="h6" gutterBottom>
              📈 统计信息
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    处理统计
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">总处理时间:</Typography>
                    <Typography variant="body2">{formatTime(mockTaskResult.processingTime)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">平均处理时间:</Typography>
                    <Typography variant="body2">{formatTime(Math.round(mockTaskResult.processingTime / mockTaskResult.totalFiles))}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">成功率:</Typography>
                    <Typography variant="body2">{((mockTaskResult.successFiles / mockTaskResult.totalFiles) * 100).toFixed(1)}%</Typography>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    内容统计
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">总页数:</Typography>
                    <Typography variant="body2">{mockTaskResult.summary.totalPages}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">总字数:</Typography>
                    <Typography variant="body2">{mockTaskResult.summary.totalWords.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">图片数:</Typography>
                    <Typography variant="body2">{mockTaskResult.summary.totalImages}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">表格数:</Typography>
                    <Typography variant="body2">{mockTaskResult.summary.totalTables}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}
      </Card>

      {/* 下载进度 */}
      {downloadProgress.visible && (
        <Card sx={{ mb: 3, mx: 0, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ px: 3, py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="body2" gutterBottom>
              {downloadProgress.message}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={downloadProgress.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      )}

      {/* 预览对话框 */}
      <Dialog 
        open={previewDialog.open} 
        onClose={() => setPreviewDialog(prev => ({ ...prev, open: false }))}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {previewDialog.file && getFileTypeIcon(previewDialog.file.fileType)}
            预览: {previewDialog.file?.outputFilename}
          </Box>
          <IconButton onClick={() => setPreviewDialog(prev => ({ ...prev, open: false }))}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <LinearProgress sx={{ width: '100%' }} />
            </Box>
          ) : previewDialog.content ? (
            <Box sx={{ 
              maxHeight: 500, 
              overflowY: 'auto',
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontFamily: previewDialog.content.type === ResultFileType.JSON ? 'monospace' : 'inherit'
            }}>
              {previewDialog.content.type === ResultFileType.HTML ? (
                <div dangerouslySetInnerHTML={{ __html: previewDialog.content.content }} />
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {previewDialog.content.content}
                </pre>
              )}
            </Box>
          ) : (
            <Alert severity="error">预览内容加载失败</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(prev => ({ ...prev, open: false }))}>
            关闭
          </Button>
          {previewDialog.file && (
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
              onClick={() => {
                downloadFile(previewDialog.file!)
                setPreviewDialog(prev => ({ ...prev, open: false }))
              }}
            >
              下载
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 右键菜单 */}
      <Menu
        open={contextMenu.open}
        onClose={closeContextMenu}
        anchorEl={contextMenu.anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList>
          {contextMenu.file?.previewUrl && (
            <ListItemButton onClick={() => {
              previewFile(contextMenu.file!)
              closeContextMenu()
            }}>
              <ListItemIcon><PreviewIcon /></ListItemIcon>
              <ListItemText>预览</ListItemText>
            </ListItemButton>
          )}
          <ListItemButton onClick={() => {
            downloadFile(contextMenu.file!)
            closeContextMenu()
          }}>
            <ListItemIcon><DownloadIcon /></ListItemIcon>
            <ListItemText>下载</ListItemText>
          </ListItemButton>
          <ListItemButton onClick={() => {
            navigator.clipboard.writeText(contextMenu.file!.outputFilename)
            showNotification('文件名已复制到剪贴板', 'success')
            closeContextMenu()
          }}>
            <ListItemIcon><CopyIcon /></ListItemIcon>
            <ListItemText>复制文件名</ListItemText>
          </ListItemButton>
        </MenuList>
      </Menu>

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

export default ResultPreviewPanel