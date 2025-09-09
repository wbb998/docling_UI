import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import ExecutionControlPanel from '../components/TaskExecution/ExecutionControlPanel'
import { TaskStatus, FileStatus } from '../types/task'

// Mock EventSource
class MockEventSource {
  url: string
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState: number = 1
  
  constructor(url: string) {
    this.url = url
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 100)
  }
  
  close() {
    this.readyState = 2
  }
  
  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data)
      })
      this.onmessage(event)
    }
  }
  
  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }
}

// Mock fetch
global.fetch = vi.fn()

// Mock EventSource
global.EventSource = MockEventSource as any

const theme = createTheme()
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('ExecutionControlPanel Component', () => {
  const mockFiles = [
    {
      id: '1',
      filename: 'test1.pdf',
      size: 1024,
      type: 'application/pdf',
      status: FileStatus.PENDING,
      progress: 0
    },
    {
      id: '2',
      filename: 'test2.docx',
      size: 2048,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      status: FileStatus.PENDING,
      progress: 0
    }
  ]

  const mockConfig = {
    from_formats: ['pdf', 'docx'],
    to_formats: ['markdown'],
    ocr_enabled: false,
    generate_picture_images: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
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

  it('renders initial state correctly', () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    expect(screen.getByText('任务执行控制')).toBeInTheDocument()
    expect(screen.getByText('开始执行')).toBeInTheDocument()
    expect(screen.getByText('IDLE')).toBeInTheDocument()
  })

  it('starts task execution correctly', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('pdf')
      })
    })
  })

  it('handles SSE connection and events', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument()
    })

    // Simulate SSE events
    const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
    
    // Simulate progress event
    eventSource.simulateMessage({
      type: 'progress',
      progress: 50
    })

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    // Simulate completion event
    eventSource.simulateMessage({
      type: 'complete',
      status: 'completed'
    })

    await waitFor(() => {
      expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    })
  })

  it('handles SSE connection errors and falls back to polling', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument()
    })

    // Simulate SSE error
    const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
    eventSource.simulateError()

    // Should show fallback message
    await waitFor(() => {
      expect(screen.getByText(/已切换到轮询模式/)).toBeInTheDocument()
    })

    // Mock polling response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: 'running',
        progress: 75,
        processed_files: 1,
        failed_files: 0
      })
    })

    // Should start polling
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/test-job-123/status')
    }, { timeout: 3000 })
  })

  it('cancels task correctly', async () => {
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ job_id: 'test-job-123', status: 'running' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'cancelled' })
      })

    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    // Start task
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('取消')).toBeInTheDocument()
    })

    // Cancel task
    const cancelButton = screen.getByText('取消')
    fireEvent.click(cancelButton)

    // Confirm cancellation
    const confirmButton = screen.getByText('确认取消')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/jobs/test-job-123/cancel', {
        method: 'POST'
      })
    })
  })

  it('resets task state correctly', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    // Start and complete a task first
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('RUNNING')).toBeInTheDocument()
    })

    // Simulate completion
    const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
    eventSource.simulateMessage({
      type: 'complete',
      status: 'completed'
    })

    await waitFor(() => {
      expect(screen.getByText('重置')).toBeInTheDocument()
    })

    // Reset task
    const resetButton = screen.getByText('重置')
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(screen.getByText('IDLE')).toBeInTheDocument()
      expect(screen.getByText('开始执行')).toBeInTheDocument()
    })
  })

  it('displays file processing details correctly', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    // Start task
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    // Show file details
    const fileDetailsButton = screen.getByText('文件详情')
    fireEvent.click(fileDetailsButton)

    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument()
      expect(screen.getByText('test2.docx')).toBeInTheDocument()
    })

    // Simulate file processing events
    const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
    
    eventSource.simulateMessage({
      type: 'file_start',
      data: { filename: 'test1.pdf' }
    })

    await waitFor(() => {
      expect(screen.getByText('PROCESSING')).toBeInTheDocument()
    })

    eventSource.simulateMessage({
      type: 'file_complete',
      data: { 
        filename: 'test1.pdf',
        output_path: '/output/test1.md',
        processing_time: 2.5
      }
    })

    await waitFor(() => {
      expect(screen.getByText('COMPLETED')).toBeInTheDocument()
      expect(screen.getByText(/2.5/)).toBeInTheDocument()
    })
  })

  it('handles task errors correctly', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    // Start task
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    // Simulate error event
    const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
    eventSource.simulateMessage({
      type: 'error',
      message: '处理文件时发生错误'
    })

    await waitFor(() => {
      expect(screen.getByText('FAILED')).toBeInTheDocument()
      expect(screen.getByText(/处理文件时发生错误/)).toBeInTheDocument()
    })
  })

  it('displays real-time logs correctly', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    // Show logs
    const logsButton = screen.getByText('实时日志')
    fireEvent.click(logsButton)

    // Start task
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    // Simulate log events
    const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
    
    eventSource.simulateMessage({
      type: 'log',
      message: '开始处理文档...'
    })

    eventSource.simulateMessage({
      type: 'log',
      message: '正在执行OCR识别...'
    })

    await waitFor(() => {
      expect(screen.getByText('开始处理文档...')).toBeInTheDocument()
      expect(screen.getByText('正在执行OCR识别...')).toBeInTheDocument()
    })
  })

  it('validates configuration before starting', async () => {
    const invalidConfig = {
      from_formats: [],
      to_formats: ['markdown'],
      ocr_enabled: false
    }

    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={invalidConfig}
        onConfigChange={() => {}}
      />
    )
    
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/请选择输入格式/)).toBeInTheDocument()
    })

    // Should not make API call
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
  })

  it('updates progress indicators correctly', async () => {
    renderWithTheme(
      <ExecutionControlPanel 
        files={mockFiles} 
        config={mockConfig}
        onConfigChange={() => {}}
      />
    )
    
    const startButton = screen.getByText('开始执行')
    fireEvent.click(startButton)

    const eventSource = new MockEventSource('/api/jobs/test-job-123/events')
    
    // Test different progress values
    const progressValues = [10, 25, 50, 75, 90, 100]
    
    for (const progress of progressValues) {
      eventSource.simulateMessage({
        type: 'progress',
        progress
      })

      await waitFor(() => {
        expect(screen.getByText(`${progress}%`)).toBeInTheDocument()
      })
    }
  })
})