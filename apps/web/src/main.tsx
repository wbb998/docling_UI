import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { store } from './store/store'
import App from './App'
import './index.css'

// MUI v6 主题化配置 - Windows 中文环境友好
const theme = createTheme({
  palette: {
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
  },
  typography: {
    fontFamily: [
      'Microsoft YaHei', // Windows 中文字体优先
      'PingFang SC',     // macOS 中文字体
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    // 全局组件样式覆盖
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'Microsoft YaHei, PingFang SC, Roboto, Arial, sans-serif',
        },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
)