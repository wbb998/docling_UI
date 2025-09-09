import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  convertDocuments, 
  getJobStatus, 
  cancelJob, 
  downloadResult,
  validateConfig 
} from '../services/api'
import { ConversionConfig } from '../types/config'

// Mock fetch
global.fetch = vi.fn()

describe('API Service Integration Tests', () => {
  const mockConfig: ConversionConfig = {
    from_formats: ['pdf', 'docx'],
    to_formats: ['markdown', 'json'],
    ocr_enabled: true,
    generate_picture_images: true,
    chunking_enabled: true,
    extraction_enabled: true,
    vlm_enabled: false,
    vlm_model: '',
    vlm_endpoint: '',
    chunking_config: {
      chunker: 'by_title',
      max_tokens: 512
    },
    extraction_config: {
      extract_tables: true,
      extract_figures: true,
      extract_text: true
    }
  }

  const mockFiles = [
    new File(['test content'], 'test1.pdf', { type: 'application/pdf' }),
    new File(['test content'], 'test2.docx', { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    })
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('convertDocuments', () => {
    it('sends correct request for document conversion', async () => {
      const mockResponse = {
        job_id: 'test-job-123',
        status: 'running',
        message: '任务已开始'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await convertDocuments(mockFiles, mockConfig)

      expect(global.fetch).toHaveBeenCalledWith('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"from_formats":["pdf","docx"]')
      })

      expect(result).toEqual(mockResponse)
    })

    it('handles API errors correctly', async () => {
      const errorResponse = {
        error: 'Invalid configuration',
        details: '输入格式不支持'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(errorResponse)
      })

      await expect(convertDocuments(mockFiles, mockConfig))
        .rejects.toThrow('Invalid configuration')
    })

    it('handles network errors correctly', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(convertDocuments(mockFiles, mockConfig))
        .rejects.toThrow('Network error')
    })

    it('includes file information in request', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ job_id: 'test-job-123' })
      })

      await convertDocuments(mockFiles, mockConfig)

      const requestBody = JSON.parse(
        (global.fetch as any).mock.calls[0][1].body
      )

      expect(requestBody.files).toHaveLength(2)
      expect(requestBody.files[0]).toMatchObject({
        filename: 'test1.pdf',
        size: expect.any(Number),
        type: 'application/pdf'
      })
    })

    it('handles empty file list', async () => {
      await expect(convertDocuments([], mockConfig))
        .rejects.toThrow('至少需要选择一个文件')
    })

    it('validates file types correctly', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      await expect(convertDocuments([invalidFile], mockConfig))
        .rejects.toThrow('不支持的文件类型')
    })

    it('validates file size limits', async () => {
      // Create a mock large file (100MB)
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      })
      
      await expect(convertDocuments([largeFile], mockConfig))
        .rejects.toThrow('文件大小超过限制')
    })
  })

  describe('getJobStatus', () => {
    it('fetches job status correctly', async () => {
      const mockStatus = {
        job_id: 'test-job-123',
        status: 'running',
        progress: 50,
        processed_files: 1,
        total_files: 2,
        failed_files: 0,
        start_time: '2024-01-01T10:00:00Z',
        estimated_completion: '2024-01-01T10:05:00Z'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStatus)
      })

      const result = await getJobStatus('test-job-123')

      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/test-job-123/status')
      expect(result).toEqual(mockStatus)
    })

    it('handles job not found error', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Job not found' })
      })

      await expect(getJobStatus('invalid-job-id'))
        .rejects.toThrow('Job not found')
    })

    it('handles completed job status', async () => {
      const completedStatus = {
        job_id: 'test-job-123',
        status: 'completed',
        progress: 100,
        processed_files: 2,
        total_files: 2,
        failed_files: 0,
        results: [
          {
            filename: 'test1.pdf',
            output_path: '/output/test1.md',
            processing_time: 2.5
          },
          {
            filename: 'test2.docx',
            output_path: '/output/test2.md',
            processing_time: 1.8
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(completedStatus)
      })

      const result = await getJobStatus('test-job-123')
      expect(result.status).toBe('completed')
      expect(result.results).toHaveLength(2)
    })

    it('handles failed job status', async () => {
      const failedStatus = {
        job_id: 'test-job-123',
        status: 'failed',
        progress: 25,
        processed_files: 0,
        total_files: 2,
        failed_files: 2,
        error: '处理文件时发生错误',
        errors: [
          {
            filename: 'test1.pdf',
            error: 'OCR识别失败'
          },
          {
            filename: 'test2.docx',
            error: '文件格式不支持'
          }
        ]
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(failedStatus)
      })

      const result = await getJobStatus('test-job-123')
      expect(result.status).toBe('failed')
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('cancelJob', () => {
    it('cancels job correctly', async () => {
      const mockResponse = {
        job_id: 'test-job-123',
        status: 'cancelled',
        message: '任务已取消'
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await cancelJob('test-job-123')

      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/test-job-123/cancel', {
        method: 'POST'
      })
      expect(result).toEqual(mockResponse)
    })

    it('handles already completed job cancellation', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Cannot cancel completed job',
          message: '任务已完成，无法取消'
        })
      })

      await expect(cancelJob('test-job-123'))
        .rejects.toThrow('Cannot cancel completed job')
    })

    it('handles job not found during cancellation', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Job not found' })
      })

      await expect(cancelJob('invalid-job-id'))
        .rejects.toThrow('Job not found')
    })
  })

  describe('downloadResult', () => {
    it('downloads result file correctly', async () => {
      const mockBlob = new Blob(['file content'], { type: 'application/zip' })
      
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Map([
          ['content-disposition', 'attachment; filename="results.zip"']
        ])
      })

      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()
      
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
        style: { display: '' }
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      await downloadResult('test-job-123')

      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/test-job-123/download')
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('results.zip')
    })

    it('handles download error correctly', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Results not found' })
      })

      await expect(downloadResult('test-job-123'))
        .rejects.toThrow('Results not found')
    })

    it('handles empty result download', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 204,
        json: () => Promise.resolve({ message: 'No results available' })
      })

      await expect(downloadResult('test-job-123'))
        .rejects.toThrow('No results available')
    })
  })

  describe('validateConfig', () => {
    it('validates valid configuration', () => {
      const result = validateConfig(mockConfig)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('validates missing input formats', () => {
      const invalidConfig = {
        ...mockConfig,
        from_formats: []
      }

      const result = validateConfig(invalidConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('请至少选择一种输入格式')
    })

    it('validates missing output formats', () => {
      const invalidConfig = {
        ...mockConfig,
        to_formats: []
      }

      const result = validateConfig(invalidConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('请至少选择一种输出格式')
    })

    it('validates VLM configuration when enabled', () => {
      const invalidVLMConfig = {
        ...mockConfig,
        vlm_enabled: true,
        vlm_model: '',
        vlm_endpoint: ''
      }

      const result = validateConfig(invalidVLMConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('启用VLM时必须选择模型')
      expect(result.errors).toContain('启用VLM时必须提供API端点')
    })

    it('validates chunking configuration when enabled', () => {
      const invalidChunkingConfig = {
        ...mockConfig,
        chunking_enabled: true,
        chunking_config: {
          chunker: '',
          max_tokens: 50
        }
      }

      const result = validateConfig(invalidChunkingConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('启用分块时必须选择分块方式')
      expect(result.errors).toContain('Token数必须在100-4096之间')
    })

    it('validates extraction configuration when enabled', () => {
      const invalidExtractionConfig = {
        ...mockConfig,
        extraction_enabled: true,
        extraction_config: {
          extract_tables: false,
          extract_figures: false,
          extract_text: false
        }
      }

      const result = validateConfig(invalidExtractionConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('启用提取时至少需要选择一种提取类型')
    })

    it('validates URL format for VLM endpoint', () => {
      const invalidURLConfig = {
        ...mockConfig,
        vlm_enabled: true,
        vlm_model: 'gpt-4-vision',
        vlm_endpoint: 'invalid-url'
      }

      const result = validateConfig(invalidURLConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('API端点必须是有效的URL')
    })

    it('validates supported format combinations', () => {
      const unsupportedConfig = {
        ...mockConfig,
        from_formats: ['pdf'],
        to_formats: ['unsupported_format']
      }

      const result = validateConfig(unsupportedConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('不支持的输出格式')
    })
  })

  describe('Error Handling', () => {
    it('handles timeout errors', async () => {
      vi.useFakeTimers()
      
      ;(global.fetch as any).mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({})
          }), 30000)
        })
      )

      const promise = convertDocuments(mockFiles, mockConfig)
      
      vi.advanceTimersByTime(30000)
      
      await expect(promise).rejects.toThrow('请求超时')
      
      vi.useRealTimers()
    })

    it('handles server errors with Chinese messages', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Internal Server Error',
          message: '服务器内部错误，请稍后重试'
        })
      })

      await expect(convertDocuments(mockFiles, mockConfig))
        .rejects.toThrow('服务器内部错误，请稍后重试')
    })

    it('handles rate limiting errors', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          error: 'Too Many Requests',
          message: '请求过于频繁，请稍后重试',
          retry_after: 60
        })
      })

      await expect(convertDocuments(mockFiles, mockConfig))
        .rejects.toThrow('请求过于频繁，请稍后重试')
    })

    it('handles malformed JSON responses', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.reject(new Error('Invalid JSON'))
      })

      await expect(convertDocuments(mockFiles, mockConfig))
        .rejects.toThrow('响应格式错误')
    })
  })

  describe('Request Retry Logic', () => {
    it('retries failed requests up to 3 times', async () => {
      ;(global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ job_id: 'test-job-123' })
        })

      const result = await convertDocuments(mockFiles, mockConfig)
      
      expect(global.fetch).toHaveBeenCalledTimes(3)
      expect(result.job_id).toBe('test-job-123')
    })

    it('fails after maximum retry attempts', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(convertDocuments(mockFiles, mockConfig))
        .rejects.toThrow('Network error')
      
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })
  })
})