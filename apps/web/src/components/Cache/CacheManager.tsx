import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Memory as MemoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useCacheService, useCacheStatus, useCacheData } from '../../services/cacheService';

// 缓存管理器组件属性
interface CacheManagerProps {
  // 是否显示详细信息
  showDetails?: boolean;
  // 是否显示在对话框中
  inDialog?: boolean;
  // 对话框关闭回调
  onClose?: () => void;
}

const CacheManager: React.FC<CacheManagerProps> = ({
  showDetails = true,
  inDialog = false,
  onClose
}) => {
  // 状态管理
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [autoCleanup, setAutoCleanup] = useState(true);
  
  // 缓存服务和状态
  const cacheService = useCacheService();
  const cacheStatus = useCacheStatus();
  const cacheData = useCacheData();

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 计算缓存使用率
  const getCacheUsagePercent = (): number => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return (cacheStatus.size / maxSize) * 100;
  };

  // 获取过期状态
  const getExpiryStatus = (): { status: 'valid' | 'warning' | 'expired'; message: string } => {
    if (!cacheStatus.expiresAt) {
      return { status: 'valid', message: '无过期时间' };
    }

    const now = Date.now();
    const timeLeft = cacheStatus.expiresAt - now;
    
    if (timeLeft <= 0) {
      return { status: 'expired', message: '已过期' };
    }
    
    if (timeLeft < 60 * 60 * 1000) { // 小于1小时
      const minutes = Math.floor(timeLeft / (60 * 1000));
      return { status: 'warning', message: `${minutes}分钟后过期` };
    }
    
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    return { status: 'valid', message: `${hours}小时后过期` };
  };

  // 处理清除缓存
  const handleClearCache = () => {
    cacheService.clearCache();
    setConfirmDialog(false);
    console.log('缓存已手动清除');
  };

  // 处理刷新缓存状态
  const handleRefresh = () => {
    // 触发状态更新
    window.location.reload();
  };

  // 处理设置过期时间
  const handleSetExpiry = (hours: number) => {
    cacheService.setExpiry(hours * 60 * 60 * 1000);
    console.log(`缓存过期时间已设置为${hours}小时`);
  };

  const expiryStatus = getExpiryStatus();
  const usagePercent = getCacheUsagePercent();

  // 渲染内容
  const renderContent = () => (
    <Box>
      {/* 缓存状态概览 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StorageIcon color="primary" />
              缓存状态
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="刷新状态">
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="清除缓存">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => setConfirmDialog(true)}
                  disabled={!cacheStatus.hasCache}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* 状态指示器 */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={cacheStatus.hasCache ? <CheckCircleIcon /> : <WarningIcon />}
              label={cacheStatus.hasCache ? '缓存可用' : '无缓存'}
              color={cacheStatus.hasCache ? 'success' : 'default'}
              size="small"
            />
            <Chip
              icon={<MemoryIcon />}
              label={`大小: ${formatSize(cacheStatus.size)}`}
              color={usagePercent > 80 ? 'warning' : 'default'}
              size="small"
            />
            <Chip
              icon={<ScheduleIcon />}
              label={expiryStatus.message}
              color={expiryStatus.status === 'expired' ? 'error' : 
                     expiryStatus.status === 'warning' ? 'warning' : 'default'}
              size="small"
            />
          </Box>

          {/* 使用率进度条 */}
          {cacheStatus.hasCache && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  存储使用率
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {usagePercent.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(usagePercent, 100)}
                color={usagePercent > 80 ? 'warning' : 'primary'}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 详细信息 */}
      {showDetails && cacheStatus.hasCache && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="primary" />
              详细信息
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="最后更新"
                  secondary={formatTime(cacheStatus.lastUpdated)}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText
                  primary="过期时间"
                  secondary={formatTime(cacheStatus.expiresAt)}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText
                  primary="缓存版本"
                  secondary={cacheStatus.version || '未知'}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      )}

      {/* 缓存内容预览 */}
      {showDetails && cacheData && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              缓存内容
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {cacheData.formData.targetModeConfig && (
                <Chip label="目标模式配置" size="small" variant="outlined" />
              )}
              {cacheData.formData.pipelineConfig && (
                <Chip label="流水线配置" size="small" variant="outlined" />
              )}
              {cacheData.formData.additionalFeaturesConfig && (
                <Chip label="附加功能配置" size="small" variant="outlined" />
              )}
              {Object.keys(cacheData.uiState.scrollPositions).length > 0 && (
                <Chip 
                  label={`滚动位置 (${Object.keys(cacheData.uiState.scrollPositions).length})`} 
                  size="small" 
                  variant="outlined" 
                />
              )}
              {Object.keys(cacheData.uiState.expandedSections).length > 0 && (
                <Chip 
                  label={`展开状态 (${Object.keys(cacheData.uiState.expandedSections).length})`} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            快速操作
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSetExpiry(1)}
            >
              1小时后过期
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSetExpiry(24)}
            >
              24小时后过期
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleSetExpiry(7 * 24)}
            >
              7天后过期
            </Button>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={autoCleanup}
                onChange={(e) => setAutoCleanup(e.target.checked)}
                size="small"
              />
            }
            label="自动清理过期缓存"
          />
        </CardContent>
      </Card>

      {/* 无缓存提示 */}
      {!cacheStatus.hasCache && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <AlertTitle>暂无缓存数据</AlertTitle>
          开始使用应用后，系统会自动保存您的配置和状态信息。
        </Alert>
      )}
    </Box>
  );

  // 如果在对话框中显示
  if (inDialog) {
    return (
      <>
        {renderContent()}
        
        {/* 确认清除对话框 */}
        <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
          <DialogTitle>确认清除缓存</DialogTitle>
          <DialogContent>
            <Typography>
              确定要清除所有缓存数据吗？这将删除：
            </Typography>
            <List dense sx={{ mt: 1 }}>
              <ListItem>
                <ListItemText primary="• 所有表单配置数据" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• 界面状态和滚动位置" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• 组件展开/折叠状态" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• 任务执行状态" />
              </ListItem>
            </List>
            <Alert severity="warning" sx={{ mt: 2 }}>
              此操作不可撤销，清除后需要重新配置。
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog(false)}>
              取消
            </Button>
            <Button onClick={handleClearCache} color="error" variant="contained">
              确认清除
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // 普通显示模式
  return (
    <Box>
      {renderContent()}
      
      {/* 确认清除对话框 */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>确认清除缓存</DialogTitle>
        <DialogContent>
          <Typography>
            确定要清除所有缓存数据吗？这将删除：
          </Typography>
          <List dense sx={{ mt: 1 }}>
            <ListItem>
              <ListItemText primary="• 所有表单配置数据" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• 界面状态和滚动位置" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• 组件展开/折叠状态" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• 任务执行状态" />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            此操作不可撤销，清除后需要重新配置。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            取消
          </Button>
          <Button onClick={handleClearCache} color="error" variant="contained">
            确认清除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CacheManager;