import React, { useState } from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  useMediaQuery,
  useTheme,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material'
import { 
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  FolderOpen as FileManageIcon,
  CloudUpload as UploadIcon,
  Queue as QueueIcon,
  Settings as ConfigIcon,
  GpsFixed as TargetIcon,
  Build as PipelineIcon,
  Bolt as FeatureIcon,
  Assessment as MonitorIcon,
  Rocket as ExecuteIcon,
  TrendingUp as ProgressIcon,
  Description as LogIcon,
  ViewList as ResultIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  Tune as SystemIcon,
  Speed as PerformanceIcon,
  Cloud as RemoteIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { store } from './store/store'
import { FileUploadPanel } from './components/FileUpload/FileUploadPanel'
import { TargetModePanel, TargetMode } from './components/TargetMode/TargetModePanel'
import { PipelinePanel, PipelineType } from './components/Pipeline/PipelinePanel'
import { AdditionalFeaturesPanel, ImageDescriptionMode } from './components/AdditionalFeatures/AdditionalFeaturesPanel'

// 导航菜单项类型定义
interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  children?: NavigationItem[]
  status?: 'normal' | 'warning' | 'error' | 'active'
}

// 导航菜单数据
const navigationItems: NavigationItem[] = [
  {
    id: 'file-management',
    label: '文件管理',
    icon: <FileManageIcon />,
    children: [
      { id: 'file-upload', label: '文件上传', icon: <UploadIcon /> },
      { id: 'upload-queue', label: '上传队列', icon: <QueueIcon /> }
    ]
  },
  {
    id: 'processing-config',
    label: '处理配置',
    icon: <ConfigIcon />,
    children: [
      { id: 'target-mode', label: '目标模式', icon: <TargetIcon /> },
      { id: 'pipeline-settings', label: '流水线设置', icon: <PipelineIcon /> },
      { id: 'additional-features', label: '附加功能', icon: <FeatureIcon /> }
    ]
  },
  {
    id: 'task-monitoring',
    label: '任务监控',
    icon: <MonitorIcon />,
    children: [
      { id: 'execution-control', label: '执行控制', icon: <ExecuteIcon /> },
      { id: 'progress-monitoring', label: '进度监控', icon: <ProgressIcon /> },
      { id: 'log-viewing', label: '日志查看', icon: <LogIcon /> }
    ]
  },
  {
    id: 'result-management',
    label: '结果管理',
    icon: <ResultIcon />,
    children: [
      { id: 'result-preview', label: '结果预览', icon: <PreviewIcon /> },
      { id: 'download-center', label: '下载中心', icon: <DownloadIcon /> }
    ]
  },
  {
    id: 'system-settings',
    label: '系统设置',
    icon: <SystemIcon />,
    children: [
      { id: 'performance-debug', label: '性能调试', icon: <PerformanceIcon /> },
      { id: 'remote-config', label: '远程配置', icon: <RemoteIcon /> }
    ]
  }
]

// Material-UI 主题配置 - 控制台三栏式布局专用
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // 蓝色主色调
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5', // 稍微深一点的背景色，便于区分区域
      paper: '#ffffff',
    },
    divider: '#e0e0e0',
  },
  typography: {
    fontFamily: [
      'Microsoft YaHei', // Windows 中文字体优先
      'PingFang SC',      // macOS 中文字体
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h6: {
      fontWeight: 600,
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          borderBottom: '1px solid #e0e0e0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e0e0e0',
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: '#e3f2fd',
            borderLeft: '3px solid #1976d2',
            '&:hover': {
              backgroundColor: '#e3f2fd',
            },
          },
          '&:hover': {
            backgroundColor: '#f5f5f5',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
  },
})

// 左侧导航栏宽度常量
const DRAWER_WIDTH = 240

// 主应用组件 - 控制台三栏式布局
function App() {
  // 状态管理
  const [selectedNavItem, setSelectedNavItem] = useState('file-upload') // 当前选中的导航项
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['file-management']) // 展开的导航组
  const [mobileOpen, setMobileOpen] = useState(false) // 移动端导航抽屉状态
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false) // 右侧任务抽屉状态
  const [isAdvancedMode, setIsAdvancedMode] = useState(false) // 简单/高级模式切换
  
  // 目标模式配置状态
  const [targetModeConfig, setTargetModeConfig] = useState({
    mode: TargetMode.CONVERSION,
    outputFormats: ['markdown'],
    sourceFormats: ['pdf', 'docx', 'pptx', 'xlsx', 'html', 'md', 'txt'],
    imageExportMode: 'png',
    // 性能配置
    device: 'auto',
    threads: 4,
    batchSize: 10,
    // 错误处理
    continueOnError: true,
    maxRetries: 3,
    // 远程功能
    enableRemote: false,
    remoteEndpoint: ''
  })

  // 流水线配置状态
  const [pipelineConfig, setPipelineConfig] = useState({
    type: PipelineType.STANDARD,
    // STANDARD流水线配置
    standard: {
      ocrEngine: 'easyocr',
      enableOcrEnhancement: true,
      ocrConfidenceThreshold: 80,
      enableLayoutAnalysis: true,
      enableTableDetection: true
    },
    // VLM流水线配置
    vlm: {
      useLocal: true,
      localModel: 'llava',
      remoteModel: 'gpt4v',
      remoteEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      maxTokens: 1000,
      temperature: 0.7,
      enableImageDescription: true,
      enableTableOcr: false
    },
    // ASR流水线配置
    asr: {
      model: 'whisper-base',
      language: 'auto',
      enableTranslation: false,
      targetLanguage: 'zh',
      enableTimestamps: true,
      enableSpeakerDiarization: false
    }
  })

  // 附加功能配置状态
  const [additionalFeaturesConfig, setAdditionalFeaturesConfig] = useState({
    // 图片描述配置
    imageDescription: {
      mode: ImageDescriptionMode.DISABLED,
      localModel: 'blip2',
      remoteService: 'openai-gpt4v',
      remoteEndpoint: 'https://api.openai.com/v1',
      apiKey: '',
      prompt: '请详细描述这张图片的内容，包括主要对象、场景、颜色、布局等信息。',
      maxTokens: 500,
      temperature: 0.7
    },
    // 产物导出配置
    artifactExport: {
      enabledFormats: ['markdown'],
      csvOptions: {
        delimiter: ',',
        encoding: 'utf-8',
        includeHeaders: true
      },
      htmlOptions: {
        includeStyles: true,
        embedImages: false,
        responsive: true
      },
      pngOptions: {
        quality: 90,
        dpi: 300,
        backgroundColor: '#FFFFFF'
      },
      parquetOptions: {
        compression: 'snappy',
        rowGroupSize: 128
      }
    },
    // 后处理配置
    postProcessing: {
      enableTranslation: false,
      sourceLanguage: 'auto',
      targetLanguages: [],
      translationService: 'google-translate',
      translationEndpoint: 'https://translate.googleapis.com/translate/v2',
      translationApiKey: '',
      customProcessingSteps: []
    }
  })

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // 处理导航组展开/收起
  const handleGroupToggle = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  // 处理导航项选择
  const handleNavItemSelect = (itemId: string) => {
    setSelectedNavItem(itemId)
    if (isMobile) {
      setMobileOpen(false) // 移动端选择后自动关闭导航
    }
  }

  // 处理移动端导航抽屉切换
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // 处理右侧任务抽屉切换
  const handleRightDrawerToggle = () => {
    setRightDrawerOpen(!rightDrawerOpen)
  }

  // 渲染导航菜单项
  const renderNavigationItems = (items: NavigationItem[]) => {
    return items.map((item) => {
      if (item.children) {
        // 有子项的组
        const isExpanded = expandedGroups.includes(item.id)
        return (
          <Box key={item.id}>
            <ListItemButton onClick={() => handleGroupToggle(item.id)}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
              />
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children.map((child) => (
                  <ListItemButton
                    key={child.id}
                    selected={selectedNavItem === child.id}
                    onClick={() => handleNavItemSelect(child.id)}
                    sx={{ pl: 4 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {child.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={child.label}
                      primaryTypographyProps={{ fontSize: '0.8rem' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        )
      } else {
        // 无子项的单独项
        return (
          <ListItemButton
            key={item.id}
            selected={selectedNavItem === item.id}
            onClick={() => handleNavItemSelect(item.id)}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{ fontSize: '0.875rem' }}
            />
          </ListItemButton>
        )
      }
    })
  }

  // 渲染主内容区
  const renderMainContent = () => {
    switch (selectedNavItem) {
      case 'file-upload':
        return (
          <Box>
            {/* 模式切换开关 */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              p: 2, 
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdvancedMode}
                    onChange={(e) => setIsAdvancedMode(e.target.checked)}
                    size="small"
                  />
                }
                label={isAdvancedMode ? "高级模式" : "简单模式"}
                sx={{ fontSize: '0.875rem' }}
              />
            </Box>
            {/* 文件上传面板 */}
            <FileUploadPanel isAdvancedMode={isAdvancedMode} />
          </Box>
        )

      case 'target-mode':
        return (
          <Box sx={{ 
            p: 3,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              width: '100%'
            }}>
              <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
                🎯 目标模式配置
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdvancedMode}
                    onChange={(e) => setIsAdvancedMode(e.target.checked)}
                    color="primary"
                  />
                }
                label={isAdvancedMode ? "高级模式" : "简单模式"}
                sx={{ fontSize: '0.875rem', m: 0 }}
              />
            </Box>
            {/* 目标模式配置面板 */}
            <TargetModePanel 
              isAdvancedMode={isAdvancedMode}
              config={targetModeConfig}
              onChange={setTargetModeConfig}
            />
          </Box>
        )

      case 'pipeline-settings':
        return (
          <Box sx={{ 
            p: 3,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              width: '100%'
            }}>
              <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
                🔧 流水线设置
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdvancedMode}
                    onChange={(e) => setIsAdvancedMode(e.target.checked)}
                    color="primary"
                  />
                }
                label={isAdvancedMode ? "高级模式" : "简单模式"}
                sx={{ fontSize: '0.875rem', m: 0 }}
              />
            </Box>
            {/* 流水线配置面板 */}
            <PipelinePanel 
              isAdvancedMode={isAdvancedMode}
              config={pipelineConfig}
              onChange={setPipelineConfig}
              enableRemote={targetModeConfig.enableRemote}
            />
          </Box>
        )

      case 'additional-features':
        return (
          <Box sx={{ 
            p: 3,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              width: '100%'
            }}>
              <Typography variant="h4" gutterBottom sx={{ m: 0 }}>
                ⚡ 附加功能
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdvancedMode}
                    onChange={(e) => setIsAdvancedMode(e.target.checked)}
                    color="primary"
                  />
                }
                label={isAdvancedMode ? "高级模式" : "简单模式"}
                sx={{ fontSize: '0.875rem', m: 0 }}
              />
            </Box>
            {/* 附加功能配置面板 */}
            <AdditionalFeaturesPanel 
              isAdvancedMode={isAdvancedMode}
              config={additionalFeaturesConfig}
              onChange={setAdditionalFeaturesConfig}
              enableRemote={targetModeConfig.enableRemote}
            />
          </Box>
        )
      
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              功能开发中
            </Typography>
            <Typography variant="body1" color="text.secondary">
              当前选中：{navigationItems
                .flatMap(group => group.children || [group])
                .find(item => item.id === selectedNavItem)?.label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              该功能模块正在开发中，敬请期待。
            </Typography>
          </Box>
        )
    }
  }

  // 左侧导航抽屉内容
  const drawerContent = (
    <Box>
      <Toolbar sx={{ 
        justifyContent: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          功能导航
        </Typography>
      </Toolbar>
      <List sx={{ pt: 1 }}>
        {renderNavigationItems(navigationItems)}
      </List>
    </Box>
  )

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* 固定布局容器 - 确保右边界稳定 */}
        <Box sx={{ 
          display: 'flex',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden', // 防止整体页面滚动
        }}>
          {/* 顶部应用栏 */}
          <AppBar 
            position="fixed" 
            sx={{ 
              zIndex: (theme) => theme.zIndex.drawer + 1,
              height: 64,
              width: '100%'
            }}
          >
            <Toolbar>
              {/* 移动端汉堡菜单按钮 */}
              <IconButton
                color="inherit"
                aria-label="打开导航菜单"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              
              {/* 应用标题 */}
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                Docling 文档处理系统
              </Typography>
              
              {/* 右侧任务监控按钮 */}
              <IconButton
                color="inherit"
                aria-label="打开任务监控"
                onClick={handleRightDrawerToggle}
                sx={{ mr: 1 }}
              >
                <MonitorIcon />
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* 左侧导航抽屉 */}
          <Box
            component="nav"
            sx={{ 
              width: { md: DRAWER_WIDTH }, 
              flexShrink: 0,
              zIndex: (theme) => theme.zIndex.drawer
            }}
          >
            {/* 移动端临时抽屉 */}
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{ keepMounted: true }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { 
                  boxSizing: 'border-box', 
                  width: DRAWER_WIDTH 
                },
              }}
            >
              {drawerContent}
            </Drawer>
            
            {/* 桌面端永久抽屉 */}
            <Drawer
              variant="permanent"
              sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': { 
                  boxSizing: 'border-box', 
                  width: DRAWER_WIDTH 
                },
              }}
              open
            >
              {drawerContent}
            </Drawer>
          </Box>

          {/* 主内容区 - 固定宽度计算 */}
          <Box
            component="main"
            sx={{
              // 固定宽度计算，确保右边界稳定
              width: {
                xs: '100%', // 移动端全宽
                md: rightDrawerOpen 
                  ? `calc(100vw - ${DRAWER_WIDTH}px - 320px)` // 桌面端：总宽度 - 左侧导航 - 右侧抽屉
                  : `calc(100vw - ${DRAWER_WIDTH}px)` // 桌面端：总宽度 - 左侧导航
              },
              mt: 8, // AppBar 高度补偿
              backgroundColor: 'background.default',
              height: 'calc(100vh - 64px)',
              overflow: 'hidden', // 主容器不滚动
              // 平滑过渡
              transition: theme.transitions.create(['width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }),
            }}
          >
            {/* 内容滚动容器 */}
            <Box sx={{ 
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              // 自定义滚动条样式
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#a8a8a8',
              },
            }}>
              {renderMainContent()}
            </Box>
          </Box>

          {/* 右侧任务抽屉 - 固定定位 */}
          {rightDrawerOpen && (
            <Box
              sx={{
                width: isMobile ? '100vw' : 320,
                height: 'calc(100vh - 64px)',
                mt: 8,
                backgroundColor: 'background.paper',
                borderLeft: '1px solid',
                borderColor: 'divider',
                position: isMobile ? 'fixed' : 'relative',
                right: 0,
                top: isMobile ? 64 : 0,
                zIndex: isMobile ? (theme) => theme.zIndex.drawer + 2 : 'auto',
                // 平滑过渡
                transition: theme.transitions.create(['transform'], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.standard,
                }),
              }}
            >
              <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
                {/* 抽屉标题栏 */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MonitorIcon />
                    任务监控
                  </Typography>
                  <IconButton onClick={handleRightDrawerToggle} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {/* 任务监控内容 */}
                <Typography variant="body2" color="text.secondary">
                  暂无运行中的任务
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  • 后端连接状态：🟢 正常
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • SSE连接状态：🟡 未连接
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </ThemeProvider>
    </Provider>
  )
}

export default App