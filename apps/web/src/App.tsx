import React from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { AppBar, Toolbar, Typography, Container, Box, Card, CardContent, CardActions, Button, Chip } from '@mui/material'
import { 
  CloudUpload as UploadIcon,
  Settings as ConfigIcon,
  Timeline as MonitorIcon,
  Download as ResultIcon,
  Description as DocIcon
} from '@mui/icons-material'
import { store } from './store/store'

// Material-UI 主题配置 - 符合设计要求
const theme = createTheme({
  palette: {
    mode: 'light', // 浅色主题
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
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Microsoft YaHei', // Windows 中文字体优先
      'PingFang SC',      // macOS 中文字体
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
      color: '#1976d2',
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    // 自定义组件样式
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // 保持按钮文字原始大小写
          borderRadius: 6,
        },
      },
    },
  },
})

// 主应用组件
function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* 固定顶部导航栏 */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Docling 文档处理系统
              </Typography>
              {/* 模式切换开关将在后续模块中添加 */}
            </Toolbar>
          </AppBar>
          
          {/* 主内容区 - 设置 pt 避免被 AppBar 遮挡 */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              pt: 8, // AppBar 高度补偿
              pb: 2,
              backgroundColor: 'background.default',
            }}
          >
            <Container maxWidth="xl" sx={{ mt: 2 }}>
              {/* 欢迎页面 - 临时内容，后续将替换为实际功能模块 */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '60vh',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h4" gutterBottom>
                  欢迎使用 Docling 文档处理系统
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
                  这是一个现代化的文档处理平台，支持文档转换、智能分块和信息提取。
                  项目基础架构已搭建完成，功能模块正在开发中。
                </Typography>
                
                {/* 功能模块卡片 - 优化的响应式布局 */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { 
                      xs: '1fr',                    // 手机：1列
                      sm: 'repeat(2, 1fr)',        // 平板：2列
                      md: 'repeat(2, 1fr)',        // 中等屏幕：2列
                      lg: 'repeat(4, 1fr)',        // 大屏：4列
                      xl: 'repeat(4, 1fr)'         // 超大屏：4列
                    },
                    gap: { 
                      xs: 2,                       // 手机：16px间距
                      sm: 2.5,                     // 平板：20px间距
                      md: 3,                       // 中等屏幕：24px间距
                      lg: 3,                       // 大屏：24px间距
                      xl: 4                        // 超大屏：32px间距
                    },
                    width: '100%',
                    maxWidth: { 
                      xs: '100%',                  // 手机：全宽
                      sm: 600,                     // 平板：600px
                      md: 800,                     // 中等屏幕：800px
                      lg: 1000,                    // 大屏：1000px
                      xl: 1200                     // 超大屏：1200px
                    },
                    mt: { xs: 3, sm: 4 },
                    px: { xs: 1, sm: 0 },         // 手机端添加水平内边距
                  }}
                >
                  {[
                    { 
                      title: '文件上传管理', 
                      desc: '支持单文件、多文件、文件夹和URL上传，实时进度显示',
                      icon: <UploadIcon />,
                      status: 'doing',
                      features: ['拖拽上传', '批量处理', '进度跟踪'],
                      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    },
                    { 
                      title: '转换配置中心', 
                      desc: '灵活配置文档转换、智能分块和信息提取参数',
                      icon: <ConfigIcon />,
                      status: 'pending',
                      features: ['多格式转换', '智能分块', '信息提取'],
                      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    },
                    { 
                      title: '任务执行监控', 
                      desc: '实时监控处理进度，查看详细日志和任务状态',
                      icon: <MonitorIcon />,
                      status: 'pending',
                      features: ['实时进度', '日志查看', '任务控制'],
                      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    },
                    { 
                      title: '结果展示下载', 
                      desc: '在线预览处理结果，支持单个和批量下载',
                      icon: <ResultIcon />,
                      status: 'pending',
                      features: ['在线预览', '批量下载', '格式转换'],
                      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    },
                  ].map((item, index) => (
                    <Card
                      key={index}
                      sx={{
                        position: 'relative',
                        height: { 
                          xs: 280,                   // 手机：280px
                          sm: 300,                   // 平板：300px
                          md: 320,                   // 中等屏幕：320px
                          lg: 320,                   // 大屏：320px
                          xl: 340                    // 超大屏：340px
                        },
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: { xs: 2, sm: 3 }, // 手机端较小圆角
                        '&:hover': {
                          transform: { 
                            xs: 'translateY(-4px) scale(1.01)',  // 手机端较小的变换
                            sm: 'translateY(-6px) scale(1.015)', // 平板端中等变换
                            md: 'translateY(-8px) scale(1.02)'   // 桌面端完整变换
                          },
                          boxShadow: {
                            xs: '0 8px 20px rgba(0,0,0,0.08)',   // 手机端较轻阴影
                            sm: '0 12px 30px rgba(0,0,0,0.09)',  // 平板端中等阴影
                            md: '0 20px 40px rgba(0,0,0,0.1)'    // 桌面端完整阴影
                          },
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      {/* 顶部渐变背景区域 */}
                      <Box
                        sx={{
                          height: 80,
                          background: item.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 20,
                            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.8))',
                          }
                        }}
                      >
                        <Box sx={{ 
                          color: 'white', 
                          fontSize: 48,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                          zIndex: 1
                        }}>
                          {item.icon}
                        </Box>
                        
                        {/* 状态标签 - 绝对定位在右上角 */}
                        <Chip 
                          label={item.status === 'doing' ? '开发中' : '待开发'} 
                          size="small"
                          color={item.status === 'doing' ? 'success' : 'default'}
                          variant="filled"
                          sx={{ 
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            zIndex: 2,
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        />
                      </Box>
                      
                      {/* 内容区域 */}
                      <CardContent sx={{ 
                        flexGrow: 1, 
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2
                      }}>
                        {/* 标题 */}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: '1.1rem',
                            lineHeight: 1.3
                          }}
                        >
                          {item.title}
                        </Typography>
                        
                        {/* 描述 */}
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            lineHeight: 1.6,
                            fontSize: '0.875rem',
                            flexGrow: 1
                          }}
                        >
                          {item.desc}
                        </Typography>
                        
                        {/* 功能特性标签 */}
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 0.5,
                          mt: 'auto'
                        }}>
                          {item.features.map((feature, idx) => (
                            <Chip
                              key={idx}
                              label={feature}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.7rem',
                                height: 22,
                                borderColor: 'primary.main',
                                color: 'primary.main',
                                '& .MuiChip-label': { 
                                  px: 1,
                                  fontWeight: 500
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                      
                      {/* 底部操作区域 */}
                      <CardActions sx={{ 
                        p: 3, 
                        pt: 0,
                        justifyContent: 'center'
                      }}>
                        <Button 
                          variant={item.status === 'doing' ? 'contained' : 'outlined'}
                          disabled={item.status === 'pending'}
                          startIcon={<DocIcon />}
                          fullWidth
                          sx={{ 
                            borderRadius: 2,
                            py: 1,
                            fontWeight: 600,
                            textTransform: 'none'
                          }}
                        >
                          {item.status === 'doing' ? '查看进度' : '即将开放'}
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </Box>
            </Container>
          </Box>
        </Box>
      </ThemeProvider>
    </Provider>
  )
}

export default App