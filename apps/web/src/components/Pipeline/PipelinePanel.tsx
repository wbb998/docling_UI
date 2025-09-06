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
  Grid
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Build as PipelineIcon,
  AutoFixHigh as StandardIcon,
  Visibility as VlmIcon,
  Mic as AsrIcon,
  Settings as SettingsIcon,
  Memory as OcrIcon,
  Enhancement as EnhanceIcon,
  Computer as LocalIcon,
  Cloud as RemoteIcon
} from '@mui/icons-material'

// 流水线类型枚举
export enum PipelineType {
  STANDARD = 'standard',
  VLM = 'vlm', 
  ASR = 'asr'
}

// OCR引擎选项
const OCR_ENGINES = [
  { value: 'easyocr', label: 'EasyOCR', description: '通用OCR引擎，支持多语言' },
  { value: 'tesseract', label: 'Tesseract', description: '开源OCR引擎，准确度高' },
  { value: 'paddleocr', label: 'PaddleOCR', description: '百度开源OCR，中文效果好' }
]

// VLM模型选项
const VLM_MODELS = {
  local: [
    { value: 'llava', label: 'LLaVA', description: '轻量级视觉语言模型' },
    { value: 'blip2', label: 'BLIP-2', description: '图像理解和描述模型' },
    { value: 'instructblip', label: 'InstructBLIP', description: '指令调优的视觉模型' }
  ],
  remote: [
    { value: 'gpt4v', label: 'GPT-4V', description: 'OpenAI视觉模型' },
    { value: 'claude3v', label: 'Claude-3 Vision', description: 'Anthropic视觉模型' },
    { value: 'gemini-pro-vision', label: 'Gemini Pro Vision', description: 'Google视觉模型' }
  ]
}

// ASR模型选项
const ASR_MODELS = [
  { value: 'whisper-tiny', label: 'Whisper Tiny', description: '最小模型，速度快' },
  { value: 'whisper-base', label: 'Whisper Base', description: '基础模型，平衡性能' },
  { value: 'whisper-small', label: 'Whisper Small', description: '小型模型，较好准确度' },
  { value: 'whisper-medium', label: 'Whisper Medium', description: '中型模型，高准确度' },
  { value: 'whisper-large', label: 'Whisper Large', description: '大型模型，最高准确度' }
]

// 流水线配置接口
interface PipelineConfig {
  type: PipelineType
  // STANDARD流水线配置
  standard: {
    ocrEngine: string
    enableOcrEnhancement: boolean
    ocrConfidenceThreshold: number
    enableLayoutAnalysis: boolean
    enableTableDetection: boolean
  }
  // VLM流水线配置
  vlm: {
    useLocal: boolean
    localModel: string
    remoteModel: string
    remoteEndpoint: string
    apiKey: string
    maxTokens: number
    temperature: number
    enableImageDescription: boolean
    enableTableOcr: boolean
  }
  // ASR流水线配置
  asr: {
    model: string
    language: string
    enableTranslation: boolean
    targetLanguage: string
    enableTimestamps: boolean
    enableSpeakerDiarization: boolean
  }
}

interface PipelinePanelProps {
  isAdvancedMode: boolean
  config: PipelineConfig
  onChange: (config: PipelineConfig) => void
  enableRemote: boolean // 从目标模式配置传入
}

export const PipelinePanel: React.FC<PipelinePanelProps> = ({
  isAdvancedMode,
  config,
  onChange,
  enableRemote
}) => {
  // 处理流水线类型切换
  const handlePipelineTypeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as PipelineType
    onChange({
      ...config,
      type: newType
    })
  }, [config, onChange])

  // 处理配置项变化
  const handleConfigChange = useCallback((section: keyof PipelineConfig, field: string, value: any) => {
    if (section === 'type') {
      onChange({
        ...config,
        type: value
      })
    } else {
      onChange({
        ...config,
        [section]: {
          ...config[section],
          [field]: value
        }
      })
    }
  }, [config, onChange])

  // 获取流水线描述
  const getPipelineDescription = (type: PipelineType) => {
    switch (type) {
      case PipelineType.STANDARD:
        return '标准文档处理流水线，使用OCR和布局分析'
      case PipelineType.VLM:
        return '视觉语言模型流水线，支持图像理解和描述'
      case PipelineType.ASR:
        return '自动语音识别流水线，处理音频文件转文本'
      default:
        return ''
    }
  }

  // 获取流水线图标
  const getPipelineIcon = (type: PipelineType) => {
    switch (type) {
      case PipelineType.STANDARD:
        return <StandardIcon />
      case PipelineType.VLM:
        return <VlmIcon />
      case PipelineType.ASR:
        return <AsrIcon />
      default:
        return <PipelineIcon />
    }
  }

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      px: 0,
    }}>
      {/* 流水线类型选择 */}
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
            <PipelineIcon />
            🔧 流水线类型选择
          </Typography>
          
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={config.type}
              onChange={handlePipelineTypeChange}
              sx={{ gap: 2 }}
            >
              {Object.values(PipelineType).map((type) => (
                <Card 
                  key={type}
                  variant="outlined"
                  sx={{ 
                    p: 2,
                    border: config.type === type ? '2px solid' : '1px solid',
                    borderColor: config.type === type ? 'primary.main' : 'divider',
                    backgroundColor: config.type === type ? 'primary.50' : 'transparent'
                  }}
                >
                  <FormControlLabel
                    value={type}
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        {getPipelineIcon(type)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {type === PipelineType.STANDARD && '⚙️ 标准流水线 (STANDARD)'}
                            {type === PipelineType.VLM && '👁️ 视觉语言模型 (VLM)'}
                            {type === PipelineType.ASR && '🎤 语音识别 (ASR)'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getPipelineDescription(type)}
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

      {/* STANDARD流水线配置 */}
      {config.type === PipelineType.STANDARD && (
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
              <OcrIcon />
              ⚙️ 标准流水线配置
            </Typography>

            {/* OCR引擎选择 */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>OCR引擎</InputLabel>
                <Select
                  value={config.standard.ocrEngine}
                  label="OCR引擎"
                  onChange={(e) => handleConfigChange('standard', 'ocrEngine', e.target.value)}
                >
                  {OCR_ENGINES.map((engine) => (
                    <MenuItem key={engine.value} value={engine.value}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {engine.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {engine.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* OCR增强选项 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                📈 OCR增强选项
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.standard.enableOcrEnhancement}
                      onChange={(e) => handleConfigChange('standard', 'enableOcrEnhancement', e.target.checked)}
                    />
                  }
                  label="启用OCR结果增强"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.standard.enableLayoutAnalysis}
                      onChange={(e) => handleConfigChange('standard', 'enableLayoutAnalysis', e.target.checked)}
                    />
                  }
                  label="启用版面分析"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.standard.enableTableDetection}
                      onChange={(e) => handleConfigChange('standard', 'enableTableDetection', e.target.checked)}
                    />
                  }
                  label="启用表格检测"
                />
              </FormGroup>
            </Box>

            {/* 高级配置 */}
            {isAdvancedMode && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🎛️ 高级配置
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    OCR置信度阈值: {config.standard.ocrConfidenceThreshold}%
                  </Typography>
                  <Slider
                    value={config.standard.ocrConfidenceThreshold}
                    onChange={(_, value) => handleConfigChange('standard', 'ocrConfidenceThreshold', value)}
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                    sx={{ mb: 2 }}
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* VLM流水线配置 */}
      {config.type === PipelineType.VLM && (
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
              <VlmIcon />
              👁️ 视觉语言模型配置
            </Typography>

            {/* 远程功能检查 */}
            {!enableRemote && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                VLM功能需要启用远程服务。请在目标模式配置中开启"启用远程服务"选项。
              </Alert>
            )}

            {/* 本地/远程选择 */}
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">模型部署方式</FormLabel>
                <RadioGroup
                  row
                  value={config.vlm.useLocal ? 'local' : 'remote'}
                  onChange={(e) => handleConfigChange('vlm', 'useLocal', e.target.value === 'local')}
                >
                  <FormControlLabel
                    value="local"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalIcon />
                        本地模型
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="remote"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RemoteIcon />
                        远程API
                      </Box>
                    }
                    disabled={!enableRemote}
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* 模型选择 */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>
                  {config.vlm.useLocal ? '本地VLM模型' : '远程VLM服务'}
                </InputLabel>
                <Select
                  value={config.vlm.useLocal ? config.vlm.localModel : config.vlm.remoteModel}
                  label={config.vlm.useLocal ? '本地VLM模型' : '远程VLM服务'}
                  onChange={(e) => handleConfigChange('vlm', config.vlm.useLocal ? 'localModel' : 'remoteModel', e.target.value)}
                >
                  {(config.vlm.useLocal ? VLM_MODELS.local : VLM_MODELS.remote).map((model) => (
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

            {/* 远程API配置 */}
            {!config.vlm.useLocal && enableRemote && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🌐 远程API配置
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="API端点"
                      value={config.vlm.remoteEndpoint}
                      onChange={(e) => handleConfigChange('vlm', 'remoteEndpoint', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="API密钥"
                      type="password"
                      value={config.vlm.apiKey}
                      onChange={(e) => handleConfigChange('vlm', 'apiKey', e.target.value)}
                      placeholder="sk-..."
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* VLM功能选项 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                🎯 VLM功能选项
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.vlm.enableImageDescription}
                      onChange={(e) => handleConfigChange('vlm', 'enableImageDescription', e.target.checked)}
                    />
                  }
                  label="启用图像描述生成"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.vlm.enableTableOcr}
                      onChange={(e) => handleConfigChange('vlm', 'enableTableOcr', e.target.checked)}
                    />
                  }
                  label="启用表格OCR增强"
                />
              </FormGroup>
            </Box>

            {/* 高级参数 */}
            {isAdvancedMode && (
              <Accordion sx={{ 
                mb: 2,
                mx: 0,
                borderRadius: 2,
                boxShadow: 1,
                '&:before': { display: 'none' }
              }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">🎛️ 高级参数</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="最大Token数"
                        type="number"
                        value={config.vlm.maxTokens}
                        onChange={(e) => handleConfigChange('vlm', 'maxTokens', parseInt(e.target.value) || 1000)}
                        inputProps={{ min: 100, max: 4000 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          Temperature: {config.vlm.temperature}
                        </Typography>
                        <Slider
                          value={config.vlm.temperature}
                          onChange={(_, value) => handleConfigChange('vlm', 'temperature', value)}
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
      )}

      {/* ASR流水线配置 */}
      {config.type === PipelineType.ASR && (
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
              <AsrIcon />
              🎤 语音识别配置
            </Typography>

            {/* ASR模型选择 */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>ASR模型</InputLabel>
                <Select
                  value={config.asr.model}
                  label="ASR模型"
                  onChange={(e) => handleConfigChange('asr', 'model', e.target.value)}
                >
                  {ASR_MODELS.map((model) => (
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

            {/* 语言设置 */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>识别语言</InputLabel>
                    <Select
                      value={config.asr.language}
                      label="识别语言"
                      onChange={(e) => handleConfigChange('asr', 'language', e.target.value)}
                    >
                      <MenuItem value="auto">自动检测</MenuItem>
                      <MenuItem value="zh">中文</MenuItem>
                      <MenuItem value="en">英语</MenuItem>
                      <MenuItem value="ja">日语</MenuItem>
                      <MenuItem value="ko">韩语</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small" disabled={!config.asr.enableTranslation}>
                    <InputLabel>目标语言</InputLabel>
                    <Select
                      value={config.asr.targetLanguage}
                      label="目标语言"
                      onChange={(e) => handleConfigChange('asr', 'targetLanguage', e.target.value)}
                    >
                      <MenuItem value="zh">中文</MenuItem>
                      <MenuItem value="en">英语</MenuItem>
                      <MenuItem value="ja">日语</MenuItem>
                      <MenuItem value="ko">韩语</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            {/* ASR功能选项 */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                🎯 ASR功能选项
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.asr.enableTranslation}
                      onChange={(e) => handleConfigChange('asr', 'enableTranslation', e.target.checked)}
                    />
                  }
                  label="启用语言翻译"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.asr.enableTimestamps}
                      onChange={(e) => handleConfigChange('asr', 'enableTimestamps', e.target.checked)}
                    />
                  }
                  label="启用时间戳"
                />
                {isAdvancedMode && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={config.asr.enableSpeakerDiarization}
                        onChange={(e) => handleConfigChange('asr', 'enableSpeakerDiarization', e.target.checked)}
                      />
                    }
                    label="启用说话人分离"
                  />
                )}
              </FormGroup>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default PipelinePanel