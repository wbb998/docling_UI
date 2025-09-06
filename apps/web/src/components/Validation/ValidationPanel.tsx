import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Link as LinkIcon,
  Block as BlockIcon
} from '@mui/icons-material';

// 校验规则类型定义
interface ValidationRule {
  id: string;
  type: 'conflict' | 'dependency' | 'visibility' | 'format';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  conditions: string[];
  suggestions?: string[];
  affectedFields?: string[];
}

// 校验结果类型定义
interface ValidationResult {
  rule: ValidationRule;
  isTriggered: boolean;
  currentValues: Record<string, any>;
  message: string;
}

// 组件属性接口
interface ValidationPanelProps {
  // 当前配置状态
  targetMode: string;
  outputFormats: string[];
  imageExportMode: string;
  enableRemote: boolean;
  vlmProvider: string;
  asrProvider: string;
  pipelineType: string;
  // 校验结果回调
  onValidationChange?: (results: ValidationResult[]) => void;
  // 自动修复回调
  onAutoFix?: (fixes: Record<string, any>) => void;
}

// 预定义校验规则
const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'extraction_json_lock',
    type: 'conflict',
    severity: 'error',
    title: '提取模式输出格式冲突',
    description: '当目标模式为"提取"时，输出格式必须为JSON',
    conditions: ['targetMode === "extraction"', 'outputFormats.length > 0', '!outputFormats.includes("json")'],
    suggestions: ['自动设置输出格式为JSON', '切换到转换或分块模式'],
    affectedFields: ['targetMode', 'outputFormats']
  },
  {
    id: 'chunking_json_lock',
    type: 'conflict',
    severity: 'error',
    title: '分块模式输出格式冲突',
    description: '当目标模式为"分块"时，输出格式必须为JSON',
    conditions: ['targetMode === "chunking"', 'outputFormats.length > 0', '!outputFormats.includes("json")'],
    suggestions: ['自动设置输出格式为JSON', '切换到转换模式'],
    affectedFields: ['targetMode', 'outputFormats']
  },
  {
    id: 'image_export_visibility',
    type: 'visibility',
    severity: 'info',
    title: '图片导出模式可见性',
    description: '图片导出模式仅在转换模式下可用',
    conditions: ['targetMode !== "conversion"'],
    suggestions: ['切换到转换模式以启用图片导出选项'],
    affectedFields: ['imageExportMode']
  },
  {
    id: 'remote_vlm_dependency',
    type: 'dependency',
    severity: 'warning',
    title: '远程VLM前置依赖',
    description: '使用远程VLM提供商需要先启用远程服务',
    conditions: ['vlmProvider !== "none"', 'vlmProvider !== "local"', '!enableRemote'],
    suggestions: ['启用远程服务开关', '切换到本地VLM或禁用VLM'],
    affectedFields: ['enableRemote', 'vlmProvider']
  },
  {
    id: 'remote_asr_dependency',
    type: 'dependency',
    severity: 'warning',
    title: '远程ASR前置依赖',
    description: '使用远程ASR提供商需要先启用远程服务',
    conditions: ['asrProvider !== "none"', 'asrProvider !== "local"', '!enableRemote'],
    suggestions: ['启用远程服务开关', '切换到本地ASR或禁用ASR'],
    affectedFields: ['enableRemote', 'asrProvider']
  },
  {
    id: 'vlm_pipeline_dependency',
    type: 'dependency',
    severity: 'warning',
    title: 'VLM流水线依赖',
    description: '启用VLM流水线需要配置VLM提供商',
    conditions: ['pipelineType === "vlm"', 'vlmProvider === "none"'],
    suggestions: ['选择VLM提供商', '切换到标准流水线'],
    affectedFields: ['pipelineType', 'vlmProvider']
  },
  {
    id: 'asr_pipeline_dependency',
    type: 'dependency',
    severity: 'warning',
    title: 'ASR流水线依赖',
    description: '启用ASR流水线需要配置ASR提供商',
    conditions: ['pipelineType === "asr"', 'asrProvider === "none"'],
    suggestions: ['选择ASR提供商', '切换到标准流水线'],
    affectedFields: ['pipelineType', 'asrProvider']
  },
  {
    id: 'output_format_conflict',
    type: 'format',
    severity: 'error',
    title: '输出格式冲突',
    description: '某些输出格式组合可能导致处理失败',
    conditions: ['outputFormats.includes("docx")', 'outputFormats.includes("txt")', 'outputFormats.length > 3'],
    suggestions: ['减少输出格式数量', '选择兼容的格式组合'],
    affectedFields: ['outputFormats']
  }
];

const ValidationPanel: React.FC<ValidationPanelProps> = ({
  targetMode,
  outputFormats,
  imageExportMode,
  enableRemote,
  vlmProvider,
  asrProvider,
  pipelineType,
  onValidationChange,
  onAutoFix
}) => {
  // 状态管理
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    errors: true,
    warnings: true,
    info: false
  });
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [showAllRules, setShowAllRules] = useState(false);

  // 当前配置值
  const currentConfig = useMemo(() => ({
    targetMode,
    outputFormats,
    imageExportMode,
    enableRemote,
    vlmProvider,
    asrProvider,
    pipelineType
  }), [targetMode, outputFormats, imageExportMode, enableRemote, vlmProvider, asrProvider, pipelineType]);

  // 执行校验逻辑
  const validationResults = useMemo(() => {
    const results: ValidationResult[] = [];

    VALIDATION_RULES.forEach(rule => {
      try {
        // 评估条件表达式
        const isTriggered = rule.conditions.every(condition => {
          // 简单的条件评估（实际项目中可能需要更复杂的表达式解析器）
          return eval(condition.replace(/(\w+)/g, (match) => {
            if (match in currentConfig) {
              const value = currentConfig[match as keyof typeof currentConfig];
              if (typeof value === 'string') {
                return `"${value}"`;
              }
              if (Array.isArray(value)) {
                return JSON.stringify(value);
              }
              return String(value);
            }
            return match;
          }));
        });

        let message = rule.description;
        if (isTriggered && rule.suggestions) {
          message += ` 建议：${rule.suggestions.join('，')}`;
        }

        results.push({
          rule,
          isTriggered,
          currentValues: currentConfig,
          message
        });
      } catch (error) {
        console.error(`校验规则 ${rule.id} 执行失败:`, error);
      }
    });

    return results;
  }, [currentConfig]);

  // 按严重程度分组
  const groupedResults = useMemo(() => {
    const triggered = validationResults.filter(result => result.isTriggered);
    return {
      errors: triggered.filter(result => result.rule.severity === 'error'),
      warnings: triggered.filter(result => result.rule.severity === 'warning'),
      info: triggered.filter(result => result.rule.severity === 'info'),
      all: showAllRules ? validationResults : triggered
    };
  }, [validationResults, showAllRules]);

  // 通知父组件校验结果变化
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validationResults.filter(result => result.isTriggered));
    }
  }, [validationResults, onValidationChange]);

  // 切换展开状态
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 自动修复处理
  const handleAutoFix = (result: ValidationResult) => {
    if (!onAutoFix || !autoFixEnabled) return;

    const fixes: Record<string, any> = {};

    // 根据规则类型生成修复建议
    switch (result.rule.id) {
      case 'extraction_json_lock':
      case 'chunking_json_lock':
        fixes.outputFormats = ['json'];
        break;
      case 'remote_vlm_dependency':
      case 'remote_asr_dependency':
        fixes.enableRemote = true;
        break;
      case 'vlm_pipeline_dependency':
        fixes.vlmProvider = 'local';
        break;
      case 'asr_pipeline_dependency':
        fixes.asrProvider = 'local';
        break;
    }

    if (Object.keys(fixes).length > 0) {
      onAutoFix(fixes);
    }
  };

  // 获取严重程度图标
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  // 渲染校验结果项
  const renderValidationItem = (result: ValidationResult) => (
    <ListItem
      key={result.rule.id}
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        border: 1,
        borderColor: `${getSeverityColor(result.rule.severity)}.light`,
        borderRadius: 1,
        mb: 1,
        bgcolor: `${getSeverityColor(result.rule.severity)}.50`
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
        <ListItemIcon sx={{ minWidth: 40 }}>
          {getSeverityIcon(result.rule.severity)}
        </ListItemIcon>
        <ListItemText
          primary={result.rule.title}
          secondary={result.message}
          primaryTypographyProps={{ fontWeight: 'medium' }}
        />
        {autoFixEnabled && result.rule.suggestions && (
          <Tooltip title="自动修复">
            <IconButton
              size="small"
              onClick={() => handleAutoFix(result)}
              color={getSeverityColor(result.rule.severity) as any}
            >
              <CheckCircleIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {result.rule.affectedFields && result.rule.affectedFields.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            影响字段:
          </Typography>
          {result.rule.affectedFields.map(field => (
            <Chip
              key={field}
              label={field}
              size="small"
              variant="outlined"
              color={getSeverityColor(result.rule.severity) as any}
            />
          ))}
        </Box>
      )}
    </ListItem>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 标题和控制 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="primary" />
          动态校验与规则
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoFixEnabled}
                onChange={(e) => setAutoFixEnabled(e.target.checked)}
                size="small"
              />
            }
            label="自动修复"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showAllRules}
                onChange={(e) => setShowAllRules(e.target.checked)}
                size="small"
              />
            }
            label="显示全部"
          />
        </Box>
      </Box>

      {/* 统计概览 */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<ErrorIcon />}
              label={`错误: ${groupedResults.errors.length}`}
              color="error"
              variant={groupedResults.errors.length > 0 ? "filled" : "outlined"}
            />
            <Chip
              icon={<WarningIcon />}
              label={`警告: ${groupedResults.warnings.length}`}
              color="warning"
              variant={groupedResults.warnings.length > 0 ? "filled" : "outlined"}
            />
            <Chip
              icon={<InfoIcon />}
              label={`提示: ${groupedResults.info.length}`}
              color="info"
              variant={groupedResults.info.length > 0 ? "filled" : "outlined"}
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`总计: ${groupedResults.all.length}`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 校验结果列表 */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* 错误 */}
        {groupedResults.errors.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleSection('errors')}
              >
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 'medium' }}>
                  错误 ({groupedResults.errors.length})
                </Typography>
                {expandedSections.errors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              <Collapse in={expandedSections.errors}>
                <List sx={{ pt: 1 }}>
                  {groupedResults.errors.map(renderValidationItem)}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* 警告 */}
        {groupedResults.warnings.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleSection('warnings')}
              >
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 'medium' }}>
                  警告 ({groupedResults.warnings.length})
                </Typography>
                {expandedSections.warnings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              <Collapse in={expandedSections.warnings}>
                <List sx={{ pt: 1 }}>
                  {groupedResults.warnings.map(renderValidationItem)}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* 提示信息 */}
        {groupedResults.info.length > 0 && (
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleSection('info')}
              >
                <InfoIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle1" sx={{ flex: 1, fontWeight: 'medium' }}>
                  提示 ({groupedResults.info.length})
                </Typography>
                {expandedSections.info ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              <Collapse in={expandedSections.info}>
                <List sx={{ pt: 1 }}>
                  {groupedResults.info.map(renderValidationItem)}
                </List>
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* 无问题状态 */}
        {groupedResults.all.length === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>配置正常</AlertTitle>
            当前配置没有发现任何冲突或问题，可以正常执行任务。
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default ValidationPanel;