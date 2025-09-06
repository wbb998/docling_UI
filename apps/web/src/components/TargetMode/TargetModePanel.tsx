import React, { useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Switch,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Transform as ConvertIcon,
  ViewModule as ChunkingIcon,
  DataObject as ExtractionIcon
} from '@mui/icons-material'

// 目标模式枚举
export enum TargetMode {
  CONVERSION = 'conversion',
  CHUNKING = 'chunking', 
  EXTRACTION = 'extraction'
}

// 输出格式选项
const OUTPUT_FORMATS = {
  conversion: ['markdown', 'html', 'json', 'text'],
  chunking: ['json'], // 分块模式只支持JSON
  extraction: ['json'] // 提取模式只支持JSON
}

// 源格式选项
const SOURCE_FORMATS = [
  'pdf', 'docx', 'pptx', 'xlsx', 'html', 'md', 'txt', 'csv', 'json'
]

// 设备选项
const DEVICE_OPTIONS = ['auto', 'cpu', 'cuda', 'mps']

// 图片导出模式选项
const IMAGE_EXPORT_MODES = ['png', 'jpeg', 'webp', 'none']

interface TargetModeConfig {
  mode: TargetMode
  outputFormats: string[]
  sourceFormats: string[]
  imageExportMode: string
  // 性能配置
  device: string
  threads: number
  batchSize: number
  // 错误处理
  continueOnError: boolean
  maxRetries: number
  // 远程功能
  enableRemote: boolean
  remoteEndpoint: string
}

interface TargetModePanelProps {
  isAdvancedMode: boolean
  config: TargetModeConfig
  onChange: (config: TargetModeConfig) => void
}

export const TargetModePanel: React.FC<TargetModePanelProps> = ({
  isAdvancedMode,
  config,
  onChange
}) => {
  // 处理模式切换
  const handleModeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newMode = event.target.value as TargetMode
    const newConfig: TargetModeConfig = {
      ...config,
      mode: newMode,
      // 根据模式重置输出格式
      outputFormats: newMode === TargetMode.CONVERSION ? ['markdown'] : ['json']
    }
    onChange(newConfig)
  }, [config, onChange])

  // 处理输出格式变化
  const handleOutputFormatChange = useCallback((format: string, checked: boolean) => {
    const newFormats = checked 
      ? [...config.outputFormats, format]
      : config.outputFormats.filter(f => f !== format)
    
    onChange({
      ...config,
      outputFormats: newFormats
    })
  }, [config, onChange])

  // 处理源格式变化
  const handleSourceFormatChange = useCallback((format: string, checked: boolean) => {
    const newFormats = checked
      ? [...config.sourceFormats, format]
      : config.sourceFormats.filter(f => f !== format)
    
    onChange({
      ...config,
      sourceFormats: newFormats
    })
  }, [config, onChange])

  // 处理配置项变化
  const handleConfigChange = useCallback((field: keyof TargetModeConfig, value: any) => {
    onChange({
      ...config,
      [field]: value
    })
  }, [config, onChange])

  // 获取模式描述
  const getModeDescription = (mode: TargetMode) => {
    switch (mode) {
      case TargetMode.CONVERSION:
        return '将文档转换为指定格式，支持多种输出格式'
      case TargetMode.CHUNKING:
        return '将文档分割为语义块，便于后续处理和检索'
      case TargetMode.EXTRACTION:
        return '从文档中提取结构化信息，如表格、图片等'
      default:
        return ''
    }
  }

  // 获取模式图标
  const getModeIcon = (mode: TargetMode) => {
    switch (mode) {
      case TargetMode.CONVERSION:
        return <ConvertIcon />
      case TargetMode.CHUNKING:
        return <ChunkingIcon />
      case TargetMode.EXTRACTION:
        return <ExtractionIcon />
      default:
        return <SettingsIcon />
    }
  }

  return (
    <Box>
      {/* 目标模式选择 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon />
            🎯 目标模式选择
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={config.mode}
              onChange={handleModeChange}
              sx={{ gap: 2 }}
            >
              {Object.values(TargetMode).map((mode) => (
                <Card 
                  key={mode}
                  variant="outlined"
                  sx={{ 
                    p: 2,
                    border: config.mode === mode ? '2px solid' : '1px solid',
                    borderColor: config.mode === mode ? 'primary.main' : 'divider',
                    backgroundColor: config.mode === mode ? 'primary.50' : 'transparent'
                  }}
                >
                  <FormControlLabel
                    value={mode}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        {getModeIcon(mode)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {mode === TargetMode.CONVERSION && '📄 文档转换 (Conversion)'}
                            {mode === TargetMode.CHUNKING && '🧩 文档分块 (Chunking)'}
                            {mode === TargetMode.EXTRACTION && '🔍 信息提取 (Extraction)'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getModeDescription(mode)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    sx={{ margin: 0, width: '100%' }}
                  />
                </Card>
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* 通用配置 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚙️ 通用配置
          </Typography>

          {/* 输出格式配置 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📤 输出格式
              <Tooltip title="选择文档处理后的输出格式">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            
            <FormGroup row sx={{ gap: 1 }}>
              {OUTPUT_FORMATS[config.mode].map((format) => (
                <FormControlLabel
                  key={format}
                  control={
                    <Checkbox
                      checked={config.outputFormats.includes(format)}
                      onChange={(e) => handleOutputFormatChange(format, e.target.checked)}
                    />
                  }
                  label={
                    <Chip 
                      label={format.toUpperCase()} 
                      size="small" 
                      variant={config.outputFormats.includes(format) ? "filled" : "outlined"}
                    />
                  }
                />
              ))}
            </FormGroup>

            {config.mode !== TargetMode.CONVERSION && (
              <Alert severity="info" sx={{ mt: 1 }}>
                {config.mode === TargetMode.CHUNKING && '分块模式仅支持JSON格式输出'}
                {config.mode === TargetMode.EXTRACTION && '提取模式仅支持JSON格式输出'}
              </Alert>
            )}
          </Box>

          {/* 源格式过滤 */}
          {isAdvancedMode && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📥 源格式过滤
                <Tooltip title="限制可处理的文件格式类型">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              
              <FormGroup row sx={{ gap: 1 }}>
                {SOURCE_FORMATS.map((format) => (
                  <FormControlLabel
                    key={format}
                    control={
                      <Checkbox
                        checked={config.sourceFormats.includes(format)}
                        onChange={(e) => handleSourceFormatChange(format, e.target.checked)}
                      />
                    }
                    label={
                      <Chip 
                        label={format.toUpperCase()} 
                        size="small" 
                        variant={config.sourceFormats.includes(format) ? "filled" : "outlined"}
                      />
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* 图片导出模式 */}
          <Box sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>🖼️ 图片导出模式</InputLabel>
              <Select
                value={config.imageExportMode}
                label="🖼️ 图片导出模式"
                onChange={(e) => handleConfigChange('imageExportMode', e.target.value)}
              >
                {IMAGE_EXPORT_MODES.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode === 'none' ? '不导出' : mode.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* 高级配置 */}
      {isAdvancedMode && (
        <>
          {/* 性能配置 */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">🚀 性能配置</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>设备</InputLabel>
                  <Select
                    value={config.device}
                    label="设备"
                    onChange={(e) => handleConfigChange('device', e.target.value)}
                  >
                    {DEVICE_OPTIONS.map((device) => (
                      <MenuItem key={device} value={device}>
                        {device === 'auto' ? '自动' : device.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label="线程数"
                  type="number"
                  value={config.threads}
                  onChange={(e) => handleConfigChange('threads', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 16 }}
                  sx={{ width: 120 }}
                />

                <TextField
                  size="small"
                  label="批处理大小"
                  type="number"
                  value={config.batchSize}
                  onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value) || 1)}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ width: 120 }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 错误处理配置 */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">🛠️ 错误处理</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.continueOnError}
                      onChange={(e) => handleConfigChange('continueOnError', e.target.checked)}
                    />
                  }
                  label="遇到错误时继续处理其他文件"
                />

                <TextField
                  size="small"
                  label="最大重试次数"
                  type="number"
                  value={config.maxRetries}
                  onChange={(e) => handleConfigChange('maxRetries', parseInt(e.target.value) || 0)}
                  inputProps={{ min: 0, max: 10 }}
                  sx={{ width: 200 }}
                />
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 远程功能配置 */}
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">🌐 远程功能</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableRemote}
                      onChange={(e) => handleConfigChange('enableRemote', e.target.checked)}
                    />
                  }
                  label="启用远程服务（VLM、ASR等）"
                />

                {config.enableRemote && (
                  <TextField
                    size="small"
                    label="远程服务端点"
                    value={config.remoteEndpoint}
                    onChange={(e) => handleConfigChange('remoteEndpoint', e.target.value)}
                    placeholder="https://api.example.com"
                    fullWidth
                    helperText="用于VLM图片描述、ASR语音识别等远程服务"
                  />
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Box>
  )
}

export default TargetModePanel