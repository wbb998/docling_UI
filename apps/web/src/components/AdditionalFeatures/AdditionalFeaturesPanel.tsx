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
  IconButton,
  Slider,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Extension as FeaturesIcon,
  Image as ImageIcon,
  Description as ExportIcon,
  Translate as TranslateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Computer as LocalIcon,
  Cloud as RemoteIcon,
  Download as DownloadIcon,
  TableChart as CsvIcon,
  Code as HtmlIcon,
  Photo as PngIcon,
  Storage as ParquetIcon
} from '@mui/icons-material'

// 图片描述模式枚举
export enum ImageDescriptionMode {
  DISABLED = 'disabled',
  LOCAL = 'local',
  REMOTE = 'remote'
}

// 产物导出格式
export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', icon: <CsvIcon />, description: '表格数据导出' },
  { value: 'html', label: 'HTML', icon: <HtmlIcon />, description: '网页格式导出' },
  { value: 'png', label: 'PNG', icon: <PngIcon />, description: '图片格式导出' },
  { value: 'parquet', label: 'Parquet', icon: <ParquetIcon />, description: '列式存储格式' }
]

// 翻译语言选项
const TRANSLATION_LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁体中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' }
]

// 本地图片描述模型
const LOCAL_IMAGE_MODELS = [
  { value: 'blip2', label: 'BLIP-2', description: '轻量级图像描述模型' },
  { value: 'git-large', label: 'GIT-Large', description: '通用图像转文本模型' },
  { value: 'ofa-large', label: 'OFA-Large', description: '多模态理解模型' }
]

// 远程图片描述服务
const REMOTE_IMAGE_SERVICES = [
  { value: 'openai-gpt4v', label: 'OpenAI GPT-4V', description: 'OpenAI视觉模型' },
  { value: 'anthropic-claude3v', label: 'Claude-3 Vision', description: 'Anthropic视觉模型' },
  { value: 'google-gemini-pro-vision', label: 'Gemini Pro Vision', description: 'Google视觉模型' }
]

// 附加功能配置接口
interface AdditionalFeaturesConfig {
  // 图片描述配置
  imageDescription: {
    mode: ImageDescriptionMode
    localModel: string
    remoteService: string
    remoteEndpoint: string
    apiKey: string
    prompt: string
    maxTokens: number
    temperature: number
  }
  // 产物导出配置
  artifactExport: {
    enabledFormats: string[]
    csvOptions: {
      delimiter: string
      encoding: string
      includeHeaders: boolean
    }
    htmlOptions: {
      includeStyles: boolean
      embedImages: boolean
      responsive: boolean
    }
    pngOptions: {
      quality: number
      dpi: number
      backgroundColor: string
    }
    parquetOptions: {
      compression: string
      rowGroupSize: number
    }
  }
  // 后处理配置
  postProcessing: {
    enableTranslation: boolean
    sourceLanguage: string
    targetLanguages: string[]
    translationService: string
    translationEndpoint: string
    translationApiKey: string
    customProcessingSteps: Array<{
      id: string
      name: string
      command: string
      enabled: boolean
    }>
  }
}

interface AdditionalFeaturesPanelProps {
  isAdvancedMode: boolean
  config: AdditionalFeaturesConfig
  onChange: (config: AdditionalFeaturesConfig) => void
  enableRemote: boolean // 从目标模式配置传入
}

export const AdditionalFeaturesPanel: React.FC<AdditionalFeaturesPanelProps> = ({
  isAdvancedMode,
  config,
  onChange,
  enableRemote
}) => {
  // 处理配置项变化
  const handleConfigChange = useCallback((section: keyof AdditionalFeaturesConfig, field: string, value: any) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    })
  }, [config, onChange])

  // 处理嵌套配置项变化
  const handleNestedConfigChange = useCallback((section: keyof AdditionalFeaturesConfig, subsection: string, field: string, value: any) => {
    onChange({
      ...config,
      [section]: {
        ...config[section],
        [subsection]: {
          ...config[section][subsection],
          [field]: value
        }
      }
    })
  }, [config, onChange])

  // 处理导出格式变化
  const handleExportFormatChange = useCallback((format: string, checked: boolean) => {
    const newFormats = checked 
      ? [...config.artifactExport.enabledFormats, format]
      : config.artifactExport.enabledFormats.filter(f => f !== format)
    
    handleConfigChange('artifactExport', 'enabledFormats', newFormats)
  }, [config.artifactExport.enabledFormats, handleConfigChange])

  // 处理目标语言变化
  const handleTargetLanguageChange = useCallback((language: string, checked: boolean) => {
    const newLanguages = checked
      ? [...config.postProcessing.targetLanguages, language]
      : config.postProcessing.targetLanguages.filter(l => l !== language)
    
    handleConfigChange('postProcessing', 'targetLanguages', newLanguages)
  }, [config.postProcessing.targetLanguages, handleConfigChange])

  // 添加自定义处理步骤
  const addCustomProcessingStep = useCallback(() => {
    const newStep = {
      id: `step_${Date.now()}`,
      name: '新处理步骤',
      command: '',
      enabled: true
    }
    
    handleConfigChange('postProcessing', 'customProcessingSteps', [
      ...config.postProcessing.customProcessingSteps,
      newStep
    ])
  }, [config.postProcessing.customProcessingSteps, handleConfigChange])

  // 删除自定义处理步骤
  const removeCustomProcessingStep = useCallback((stepId: string) => {
    const newSteps = config.postProcessing.customProcessingSteps.filter(step => step.id !== stepId)
    handleConfigChange('postProcessing', 'customProcessingSteps', newSteps)
  }, [config.postProcessing.customProcessingSteps, handleConfigChange])

  // 更新自定义处理步骤
  const updateCustomProcessingStep = useCallback((stepId: string, field: string, value: any) => {
    const newSteps = config.postProcessing.customProcessingSteps.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    )
    handleConfigChange('postProcessing', 'customProcessingSteps', newSteps)
  }, [config.postProcessing.customProcessingSteps, handleConfigChange])

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      px: 0,
    }}>
      {/* 图片描述配置 */}
      <Card sx={{ 
        mb: 3,
        mx: 0,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <CardContent sx={{ 
          px: 3,
          py: 2,
          '&:last-child': { pb: 2 }
        }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ImageIcon />
            🖼️ 图片描述配置
          </Typography>

          {/* 图片描述模式选择 */}
          <Box sx={{ mb: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">图片描述模式</FormLabel>
              <RadioGroup
                row
                value={config.imageDescription.mode}
                onChange={(e) => handleConfigChange('imageDescription', 'mode', e.target.value as ImageDescriptionMode)}
              >
                <FormControlLabel
                  value={ImageDescriptionMode.DISABLED}
                  control={<Radio />}
                  label="禁用"
                />
                <FormControlLabel
                  value={ImageDescriptionMode.LOCAL}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalIcon />
                      本地模型
                    </Box>
                  }
                />
                <FormControlLabel
                  value={ImageDescriptionMode.REMOTE}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RemoteIcon />
                      远程服务
                    </Box>
                  }
                  disabled={!enableRemote}
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* 远程功能检查 */}
          {config.imageDescription.mode === ImageDescriptionMode.REMOTE && !enableRemote && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              远程图片描述功能需要启用远程服务。请在目标模式配置中开启"启用远程服务"选项。
            </Alert>
          )}

          {/* 本地模型配置 */}
          {config.imageDescription.mode === ImageDescriptionMode.LOCAL && (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>本地图片描述模型</InputLabel>
                <Select
                  value={config.imageDescription.localModel}
                  label="本地图片描述模型"
                  onChange={(e) => handleConfigChange('imageDescription', 'localModel', e.target.value)}
                >
                  {LOCAL_IMAGE_MODELS.map((model) => (
                    <MenuItem key={model.value} value={model.value}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {model.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {model.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* 远程服务配置 */}
          {config.imageDescription.mode === ImageDescriptionMode.REMOTE && enableRemote && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                🌐 远程图片描述服务
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>远程服务</InputLabel>
                    <Select
                      value={config.imageDescription.remoteService}
                      label="远程服务"
                      onChange={(e) => handleConfigChange('imageDescription', 'remoteService', e.target.value)}
                    >
                      {REMOTE_IMAGE_SERVICES.map((service) => (
                        <MenuItem key={service.value} value={service.value}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {service.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {service.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="API端点"
                    value={config.imageDescription.remoteEndpoint}
                    onChange={(e) => handleConfigChange('imageDescription', 'remoteEndpoint', e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="API密钥"
                    type="password"
                    value={config.imageDescription.apiKey}
                    onChange={(e) => handleConfigChange('imageDescription', 'apiKey', e.target.value)}
                    placeholder="sk-..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* 图片描述高级配置 */}
          {config.imageDescription.mode !== ImageDescriptionMode.DISABLED && isAdvancedMode && (
            <Accordion sx={{ 
              mb: 2,
              mx: 0,
              borderRadius: 2,
              boxShadow: 1,
              '&:before': { display: 'none' }
            }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">🎛️ 高级配置</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      size="small"
                      label="描述提示词"
                      value={config.imageDescription.prompt}
                      onChange={(e) => handleConfigChange('imageDescription', 'prompt', e.target.value)}
                      placeholder="请详细描述这张图片的内容..."
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="最大Token数"
                      type="number"
                      value={config.imageDescription.maxTokens}
                      onChange={(e) => handleConfigChange('imageDescription', 'maxTokens', parseInt(e.target.value) || 500)}
                      inputProps={{ min: 100, max: 2000 }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        Temperature: {config.imageDescription.temperature}
                      </Typography>
                      <Slider
                        value={config.imageDescription.temperature}
                        onChange={(_, value) => handleConfigChange('imageDescription', 'temperature', value)}
                        min={0}
                        max={2}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 1, label: '1' },
                          { value: 2, label: '2' }
                        ]}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* 产物导出配置 */}
      <Card sx={{ 
        mb: 3,
        mx: 0,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <CardContent sx={{ 
          px: 3,
          py: 2,
          '&:last-child': { pb: 2 }
        }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExportIcon />
            📤 产物导出配置
          </Typography>

          {/* 导出格式选择 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              导出格式选择
            </Typography>
            <FormGroup row sx={{ gap: 1 }}>
              {EXPORT_FORMATS.map((format) => (
                <FormControlLabel
                  key={format.value}
                  control={
                    <Checkbox
                      checked={config.artifactExport.enabledFormats.includes(format.value)}
                      onChange={(e) => handleExportFormatChange(format.value, e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {format.icon}
                      <Chip 
                        label={format.label} 
                        size="small" 
                        variant={config.artifactExport.enabledFormats.includes(format.value) ? "filled" : "outlined"}
                      />
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          {/* 格式特定配置 */}
          {isAdvancedMode && config.artifactExport.enabledFormats.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🔧 格式特定配置
              </Typography>
              
              {/* CSV配置 */}
              {config.artifactExport.enabledFormats.includes('csv') && (
                <Accordion sx={{ 
                  mb: 1,
                  mx: 0,
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">CSV 配置</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="分隔符"
                          value={config.artifactExport.csvOptions.delimiter}
                          onChange={(e) => handleNestedConfigChange('artifactExport', 'csvOptions', 'delimiter', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>编码</InputLabel>
                          <Select
                            value={config.artifactExport.csvOptions.encoding}
                            label="编码"
                            onChange={(e) => handleNestedConfigChange('artifactExport', 'csvOptions', 'encoding', e.target.value)}
                          >
                            <MenuItem value="utf-8">UTF-8</MenuItem>
                            <MenuItem value="gbk">GBK</MenuItem>
                            <MenuItem value="gb2312">GB2312</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.artifactExport.csvOptions.includeHeaders}
                              onChange={(e) => handleNestedConfigChange('artifactExport', 'csvOptions', 'includeHeaders', e.target.checked)}
                            />
                          }
                          label="包含表头"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* HTML配置 */}
              {config.artifactExport.enabledFormats.includes('html') && (
                <Accordion sx={{ 
                  mb: 1,
                  mx: 0,
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">HTML 配置</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.artifactExport.htmlOptions.includeStyles}
                            onChange={(e) => handleNestedConfigChange('artifactExport', 'htmlOptions', 'includeStyles', e.target.checked)}
                          />
                        }
                        label="包含样式"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.artifactExport.htmlOptions.embedImages}
                            onChange={(e) => handleNestedConfigChange('artifactExport', 'htmlOptions', 'embedImages', e.target.checked)}
                          />
                        }
                        label="嵌入图片"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.artifactExport.htmlOptions.responsive}
                            onChange={(e) => handleNestedConfigChange('artifactExport', 'htmlOptions', 'responsive', e.target.checked)}
                          />
                        }
                        label="响应式设计"
                      />
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* PNG配置 */}
              {config.artifactExport.enabledFormats.includes('png') && (
                <Accordion sx={{ 
                  mb: 1,
                  mx: 0,
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">PNG 配置</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            质量: {config.artifactExport.pngOptions.quality}%
                          </Typography>
                          <Slider
                            value={config.artifactExport.pngOptions.quality}
                            onChange={(_, value) => handleNestedConfigChange('artifactExport', 'pngOptions', 'quality', value)}
                            min={10}
                            max={100}
                            step={10}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="DPI"
                          type="number"
                          value={config.artifactExport.pngOptions.dpi}
                          onChange={(e) => handleNestedConfigChange('artifactExport', 'pngOptions', 'dpi', parseInt(e.target.value) || 300)}
                          inputProps={{ min: 72, max: 600 }}
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="背景色"
                          value={config.artifactExport.pngOptions.backgroundColor}
                          onChange={(e) => handleNestedConfigChange('artifactExport', 'pngOptions', 'backgroundColor', e.target.value)}
                          placeholder="#FFFFFF"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Parquet配置 */}
              {config.artifactExport.enabledFormats.includes('parquet') && (
                <Accordion sx={{ 
                  mb: 1,
                  mx: 0,
                  borderRadius: 2,
                  boxShadow: 1,
                  '&:before': { display: 'none' }
                }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">Parquet 配置</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>压缩算法</InputLabel>
                          <Select
                            value={config.artifactExport.parquetOptions.compression}
                            label="压缩算法"
                            onChange={(e) => handleNestedConfigChange('artifactExport', 'parquetOptions', 'compression', e.target.value)}
                          >
                            <MenuItem value="snappy">Snappy</MenuItem>
                            <MenuItem value="gzip">GZIP</MenuItem>
                            <MenuItem value="lzo">LZO</MenuItem>
                            <MenuItem value="brotli">Brotli</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="行组大小"
                          type="number"
                          value={config.artifactExport.parquetOptions.rowGroupSize}
                          onChange={(e) => handleNestedConfigChange('artifactExport', 'parquetOptions', 'rowGroupSize', parseInt(e.target.value) || 128)}
                          inputProps={{ min: 64, max: 1024 }}
                          helperText="MB"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 后处理配置 */}
      <Card sx={{ 
        mb: 3,
        mx: 0,
        borderRadius: 2,
        boxShadow: 1
      }}>
        <CardContent sx={{ 
          px: 3,
          py: 2,
          '&:last-child': { pb: 2 }
        }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TranslateIcon />
            🔄 后处理配置
          </Typography>

          {/* 翻译功能 */}
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.postProcessing.enableTranslation}
                  onChange={(e) => handleConfigChange('postProcessing', 'enableTranslation', e.target.checked)}
                />
              }
              label="启用文档翻译"
            />
          </Box>

          {config.postProcessing.enableTranslation && (
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>源语言</InputLabel>
                    <Select
                      value={config.postProcessing.sourceLanguage}
                      label="源语言"
                      onChange={(e) => handleConfigChange('postProcessing', 'sourceLanguage', e.target.value)}
                    >
                      <MenuItem value="auto">自动检测</MenuItem>
                      {TRANSLATION_LANGUAGES.map((lang) => (
                        <MenuItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="翻译服务"
                    value={config.postProcessing.translationService}
                    onChange={(e) => handleConfigChange('postProcessing', 'translationService', e.target.value)}
                    placeholder="google-translate"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  目标语言
                </Typography>
                <FormGroup row sx={{ gap: 1 }}>
                  {TRANSLATION_LANGUAGES.map((lang) => (
                    <FormControlLabel
                      key={lang.value}
                      control={
                        <Checkbox
                          checked={config.postProcessing.targetLanguages.includes(lang.value)}
                          onChange={(e) => handleTargetLanguageChange(lang.value, e.target.checked)}
                        />
                      }
                      label={
                        <Chip 
                          label={lang.label} 
                          size="small" 
                          variant={config.postProcessing.targetLanguages.includes(lang.value) ? "filled" : "outlined"}
                        />
                      }
                    />
                  ))}
                </FormGroup>
              </Box>

              {/* 翻译API配置 */}
              {isAdvancedMode && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    翻译API配置
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="API端点"
                        value={config.postProcessing.translationEndpoint}
                        onChange={(e) => handleConfigChange('postProcessing', 'translationEndpoint', e.target.value)}
                        placeholder="https://translate.googleapis.com/translate/v2"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="API密钥"
                        type="password"
                        value={config.postProcessing.translationApiKey}
                        onChange={(e) => handleConfigChange('postProcessing', 'translationApiKey', e.target.value)}
                        placeholder="AIza..."
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {/* 自定义处理步骤 */}
          {isAdvancedMode && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">
                  🛠️ 自定义处理步骤
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addCustomProcessingStep}
                  variant="outlined"
                >
                  添加步骤
                </Button>
              </Box>

              {config.postProcessing.customProcessingSteps.length > 0 && (
                <List>
                  {config.postProcessing.customProcessingSteps.map((step, index) => (
                    <ListItem key={step.id} sx={{ px: 0 }}>
                      <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={1}>
                            <Switch
                              checked={step.enabled}
                              onChange={(e) => updateCustomProcessingStep(step.id, 'enabled', e.target.checked)}
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="步骤名称"
                              value={step.name}
                              onChange={(e) => updateCustomProcessingStep(step.id, 'name', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={7}>
                            <TextField
                              fullWidth
                              size="small"
                              label="执行命令"
                              value={step.command}
                              onChange={(e) => updateCustomProcessingStep(step.id, 'command', e.target.value)}
                              placeholder="python script.py {input} {output}"
                            />
                          </Grid>
                          <Grid item xs={1}>
                            <IconButton
                              size="small"
                              onClick={() => removeCustomProcessingStep(step.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}

              {config.postProcessing.customProcessingSteps.length === 0 && (
                <Alert severity="info">
                  暂无自定义处理步骤。点击"添加步骤"按钮创建新的处理步骤。
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default AdditionalFeaturesPanel