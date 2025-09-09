import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import App from '../App'

// Mock EventSource
class MockEventSource {
  url: string
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState: number = 1
  
  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }
  
  close() {
    this.readyState = 2
  }
  
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      })
      this.onmessage(event)
    }
  }
  
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

// Mock fetch
global.fetch = vi.fn()
global.EventSource = MockEventSource as any

const theme = createTheme()
const renderApp = () => {
  return render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  )
}

describe('End-to-End Conversion Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses by default
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        job_id: 'test-job-123',
        status: 'running'
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Conversion Workflow', () => {
    it('completes full PDF to Markdown conversion workflow', async () => {
      renderApp()

      // Step 1: Upload files
      const fileInput = screen.getByLabelText(/选择文件或拖拽到此处/)
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })

      // Step 2: Configure parameters
      const markdownCheckbox = screen.getByLabelText('Markdown')
      expect(markdownCheckbox).toBeChecked() // Default selection

      // Enable OCR
      const ocrSwitch = screen.getByRole('checkbox', { name: /启用OCR/ })
      fireEvent.click(ocrSwitch)

      // Step 3: Start conversion
      const startButton = screen.getByText('开始执行')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('RUNNING')).toBeInTheDocument()
      })

      // Step 4: Simulate progress events
      const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
      
      // Progress updates
      eventSource.simulateMessage({
        type: 'progress',
        progress: 25
      })

      await waitFor(() => {
        expect(screen.getByText('25%')).toBeInTheDocument()
      })

      eventSource.simulateMessage({
        type: 'log',
        message: '开始处理 test.pdf...'
      })

      eventSource.simulateMessage({
        type: 'progress',
        progress: 75
      })

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument()
      })

      // Step 5: Complete conversion
      eventSource.simulateMessage({
        type: 'complete',
        status: 'completed',
        results: [
          {
            filename: 'test.pdf',
            output_path: '/output/test.md',
            processing_time: 2.5
          }
        ]
      })

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument()
        expect(screen.getByText('下载结果')).toBeInTheDocument()
      })

      // Step 6: Download results
      const downloadButton = screen.getByText('下载结果')
      
      // Mock download response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['result content'])),
        headers: new Map([['content-disposition', 'attachment; filename="results.zip"']])
      })

      // Mock download functionality
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
        style: { display: '' }
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled()
      })
    })

    it('handles batch file conversion workflow', async () => {
      renderApp()

      // Upload multiple files
      const fileInput = screen.getByLabelText(/选择文件或拖拽到此处/)
      const files = [
        new File(['content1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'doc2.docx', { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        }),
        new File(['content3'], 'doc3.pdf', { type: 'application/pdf' })
      ]
      
      fireEvent.change(fileInput, { target: { files } })

      await waitFor(() => {
        expect(screen.getByText('doc1.pdf')).toBeInTheDocument()
        expect(screen.getByText('doc2.docx')).toBeInTheDocument()
        expect(screen.getByText('doc3.pdf')).toBeInTheDocument()
      })

      // Configure for batch processing
      const jsonCheckbox = screen.getByLabelText('JSON')
      fireEvent.click(jsonCheckbox)

      // Enable chunking for batch processing
      const chunkingSwitch = screen.getByRole('checkbox', { name: /启用分块/ })
      fireEvent.click(chunkingSwitch)

      // Start batch conversion
      const startButton = screen.getByText('开始执行')
      fireEvent.click(startButton)

      // Simulate batch processing events
      const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
      
      // File 1 processing
      eventSource.simulateMessage({
        type: 'file_start',
        data: { filename: 'doc1.pdf' }
      })

      eventSource.simulateMessage({
        type: 'progress',
        progress: 33
      })

      eventSource.simulateMessage({
        type: 'file_complete',
        data: { 
          filename: 'doc1.pdf',
          output_path: '/output/doc1.json'
        }
      })

      // File 2 processing
      eventSource.simulateMessage({
        type: 'file_start',
        data: { filename: 'doc2.docx' }
      })

      eventSource.simulateMessage({
        type: 'progress',
        progress: 66
      })

      eventSource.simulateMessage({
        type: 'file_complete',
        data: { 
          filename: 'doc2.docx',
          output_path: '/output/doc2.json'
        }
      })

      // File 3 processing
      eventSource.simulateMessage({
        type: 'file_start',
        data: { filename: 'doc3.pdf' }
      })

      eventSource.simulateMessage({
        type: 'progress',
        progress: 100
      })

      eventSource.simulateMessage({
        type: 'complete',
        status: 'completed',
        results: [
          { filename: 'doc1.pdf', output_path: '/output/doc1.json' },
          { filename: 'doc2.docx', output_path: '/output/doc2.json' },
          { filename: 'doc3.pdf', output_path: '/output/doc3.json' }
        ]
      })

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument()
        expect(screen.getByText('3/3 文件处理完成')).toBeInTheDocument()
      })
    })

    it('handles advanced processing workflow with VLM', async () => {
      renderApp()

      // Upload file
      const fileInput = screen.getByLabelText(/选择文件或拖拽到此处/)
      const testFile = new File(['test content'], 'document.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      // Configure advanced settings
      const vlmSwitch = screen.getByRole('checkbox', { name: /启用VLM/ })
      fireEvent.click(vlmSwitch)

      // Configure VLM model
      const modelSelect = screen.getByLabelText('VLM模型')
      fireEvent.mouseDown(modelSelect)
      const gpt4Option = screen.getByText('GPT-4 Vision')
      fireEvent.click(gpt4Option)

      // Set API endpoint
      const endpointInput = screen.getByLabelText('API端点')
      fireEvent.change(endpointInput, { 
        target: { value: 'https://api.openai.com/v1' } 
      })

      // Enable extraction
      const extractionSwitch = screen.getByRole('checkbox', { name: /启用提取/ })
      fireEvent.click(extractionSwitch)

      // Start advanced processing
      const startButton = screen.getByText('开始执行')
      fireEvent.click(startButton)

      // Simulate advanced processing events
      const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
      
      eventSource.simulateMessage({
        type: 'log',
        message: '开始VLM图像分析...'
      })

      eventSource.simulateMessage({
        type: 'progress',
        progress: 25
      })

      eventSource.simulateMessage({
        type: 'log',
        message: '正在提取表格数据...'
      })

      eventSource.simulateMessage({
        type: 'progress',
        progress: 50
      })

      eventSource.simulateMessage({
        type: 'log',
        message: '正在提取图片内容...'
      })

      eventSource.simulateMessage({
        type: 'progress',
        progress: 75
      })

      eventSource.simulateMessage({
        type: 'complete',
        status: 'completed',
        results: [
          {
            filename: 'document.pdf',
            output_path: '/output/document.md',
            extracted_tables: 3,
            extracted_figures: 2,
            vlm_descriptions: 5
          }
        ]
      })

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument()
        expect(screen.getByText(/提取了 3 个表格/)).toBeInTheDocument()
        expect(screen.getByText(/提取了 2 个图片/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Workflows', () => {
    it('handles conversion failure gracefully', async () => {
      renderApp()

      // Upload file
      const fileInput = screen.getByLabelText(/选择文件或拖拽到此处/)
      const testFile = new File(['test content'], 'corrupted.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      // Start conversion
      const startButton = screen.getByText('开始执行')
      fireEvent.click(startButton)

      // Simulate error
      const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
      
      eventSource.simulateMessage({
        type: 'error',
        message: 'PDF文件损坏，无法处理',
        filename: 'corrupted.pdf'
      })

      await waitFor(() => {
        expect(screen.getByText('FAILED')).toBeInTheDocument()
        expect(screen.getByText(/PDF文件损坏，无法处理/)).toBeInTheDocument()
      })

      // Should show retry option
      expect(screen.getByText('重试')).toBeInTheDocument()
    })

    it('handles network disconnection and reconnection', async () => {
      renderApp()

      // Upload and start conversion
      const fileInput = screen.getByLabelText(/选择文件或拖拽到此处/)
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      const startButton = screen.getByText('开始执行')
      fireEvent.click(startButton)

      // Simulate SSE connection error
      const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
      eventSource.simulateError()

      await waitFor(() => {
        expect(screen.getByText(/连接中断/)).toBeInTheDocument()
        expect(screen.getByText(/已切换到轮询模式/)).toBeInTheDocument()
      })

      // Mock polling responses
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'running',
          progress: 50
        })
      })

      // Should continue with polling
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles task cancellation workflow', async () => {
      renderApp()

      // Upload and start conversion
      const fileInput = screen.getByLabelText(/选择文件或拖拽到此处/)
      const testFile = new File(['test content'], 'large-file.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      const startButton = screen.getByText('开始执行')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('取消')).toBeInTheDocument()
      })

      // Cancel the task
      const cancelButton = screen.getByText('取消')
      fireEvent.click(cancelButton)

      // Confirm cancellation
      const confirmButton = screen.getByText('确认取消')
      fireEvent.click(confirmButton)

      // Mock cancellation response
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'cancelled',
          message: '任务已取消'
        })
      })

      await waitFor(() => {
        expect(screen.getByText('CANCELLED')).toBeInTheDocument()
        expect(screen.getByText(/任务已取消/)).toBeInTheDocument()
      })
    })
  })

  describe('Configuration Workflows', () => {
    it('handles configuration import/export workflow', async () => {
      renderApp()

      // Export current configuration
      const exportButton = screen.getByText('导出配置')
      
      // Mock export functionality
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
        style: { display: '' }
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      fireEvent.click(exportButton)

      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('docling-config.json')

      // Import configuration
      const importButton = screen.getByText('导入配置')
      fireEvent.click(importButton)

      const configData = {
        from_formats: ['pdf', 'docx'],
        to_formats: ['json'],
        ocr_enabled: true,
        chunking_enabled: true
      }

      const mockFile = new File(
        [JSON.stringify(configData)], 
        'config.json', 
        { type: 'application/json' }
      )

      const fileInput = screen.getByLabelText(/选择配置文件/)
      
      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        result: JSON.stringify(configData),
        onload: null as any
      }
      global.FileReader = vi.fn(() => mockFileReader) as any

      fireEvent.change(fileInput, { target: { files: [mockFile] } })
      mockFileReader.onload({ target: mockFileReader })

      await waitFor(() => {
        expect(screen.getByLabelText('JSON')).toBeChecked()
        expect(screen.getByRole('checkbox', { name: /启用OCR/ })).toBeChecked()
      })
    })

    it('handles preset configuration workflow', async () => {
      renderApp()

      // Apply quick preset
      const quickPresetButton = screen.getByText('快速转换')
      fireEvent.click(quickPresetButton)

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /启用OCR/ })).not.toBeChecked()
        expect(screen.getByRole('checkbox', { name: /启用分块/ })).not.toBeChecked()
      })

      // Apply advanced preset
      const advancedPresetButton = screen.getByText('高级处理')
      fireEvent.click(advancedPresetButton)

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /启用OCR/ })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: /启用分块/ })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: /启用提取/ })).toBeChecked()
      })
    })
  })

  describe('Real-time Updates Workflow', () => {
    it('displays real-time logs during processing', async () => {
      renderApp()

      // Upload file and start conversion
      const fileInput = screen.getByLabelText(/选择文件或拖拽到此处/)
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      fireEvent.change(fileInput, { target: { files: [testFile] } })

      // Show logs panel
      const logsButton = screen.getByText('实时日志')
      fireEvent.click(logsButton)

      const startButton = screen.getByText('开始执行')
      fireEvent.click(startButton)

      // Simulate detailed log events
      const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
      
      const logMessages = [
        '初始化转换引擎...',
        '开始处理 test.pdf',
        '正在解析PDF结构...',
        '检测到 5 页内容',
        '开始OCR识别...',
        '第1页处理完成',
        '第2页处理完成',
        '第3页处理完成',
        '第4页处理完成',
        '第5页处理完成',
        '生成Markdown格式...',
        '转换完成'
      ]

      for (let i = 0; i < logMessages.length; i++) {
        eventSource.simulateMessage({
          type: 'log',
          message: logMessages[i],
          timestamp: new Date().toISOString()
        })

        eventSource.simulateMessage({
          type: 'progress',
          progress: Math.round((i + 1) / logMessages.length * 100)
        })

        await waitFor(() => {
          expect(screen.getByText(logMessages[i])).toBeInTheDocument()
        })
      }

      // Complete the process
      eventSource.simulateMessage({
        type: 'complete',
        status: 'completed'
      })

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument()
      })
    })
  })
})