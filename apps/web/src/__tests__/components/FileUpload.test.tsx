import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import FileUpload from '../components/FileManagement/FileUpload'

// Mock file for testing
const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

// Theme provider wrapper
const theme = createTheme()
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('FileUpload Component', () => {
  const mockOnFilesChange = vi.fn()
  
  beforeEach(() => {
    mockOnFilesChange.mockClear()
  })

  it('renders upload area correctly', () => {
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    expect(screen.getByText('拖拽文件到此处')).toBeInTheDocument()
    expect(screen.getByText('或点击选择文件')).toBeInTheDocument()
  })

  it('handles file drop correctly', async () => {
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    const dropZone = screen.getByTestId('file-drop-zone')
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile]
      }
    })

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          file: mockFile,
          filename: 'test.pdf',
          size: mockFile.size,
          type: 'application/pdf'
        })
      ])
    })
  })

  it('validates file size limits', async () => {
    const largeFile = new File(['x'.repeat(100 * 1024 * 1024 + 1)], 'large.pdf', { 
      type: 'application/pdf' 
    })
    
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    const dropZone = screen.getByTestId('file-drop-zone')
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [largeFile]
      }
    })

    await waitFor(() => {
      expect(screen.getByText(/文件大小超过限制/)).toBeInTheDocument()
    })
  })

  it('validates file type restrictions', async () => {
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-executable' })
    
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    const dropZone = screen.getByTestId('file-drop-zone')
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [invalidFile]
      }
    })

    await waitFor(() => {
      expect(screen.getByText(/不支持的文件格式/)).toBeInTheDocument()
    })
  })

  it('handles multiple file upload', async () => {
    const file1 = new File(['content1'], 'test1.pdf', { type: 'application/pdf' })
    const file2 = new File(['content2'], 'test2.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    const dropZone = screen.getByTestId('file-drop-zone')
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file1, file2]
      }
    })

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([
        expect.objectContaining({ filename: 'test1.pdf' }),
        expect.objectContaining({ filename: 'test2.docx' })
      ])
    })
  })

  it('shows upload progress for large files', async () => {
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.pdf', { 
      type: 'application/pdf' 
    })
    
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    const dropZone = screen.getByTestId('file-drop-zone')
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [largeFile]
      }
    })

    // Should show progress indicator
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('handles URL upload', async () => {
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    const urlInput = screen.getByPlaceholderText('输入文件URL')
    const addButton = screen.getByText('添加URL')
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com/test.pdf' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockOnFilesChange).toHaveBeenCalledWith([
        expect.objectContaining({
          filename: 'test.pdf',
          url: 'https://example.com/test.pdf',
          type: 'url'
        })
      ])
    })
  })

  it('validates URL format', async () => {
    renderWithTheme(<FileUpload files={[]} onFilesChange={mockOnFilesChange} />)
    
    const urlInput = screen.getByPlaceholderText('输入文件URL')
    const addButton = screen.getByText('添加URL')
    
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/请输入有效的URL/)).toBeInTheDocument()
    })
  })

  it('removes files correctly', async () => {
    const existingFiles = [
      { id: '1', filename: 'test1.pdf', size: 1024, type: 'application/pdf' },
      { id: '2', filename: 'test2.docx', size: 2048, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    ]
    
    renderWithTheme(<FileUpload files={existingFiles} onFilesChange={mockOnFilesChange} />)
    
    const removeButtons = screen.getAllByLabelText('删除文件')
    fireEvent.click(removeButtons[0])

    expect(mockOnFilesChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: '2', filename: 'test2.docx' })
    ])
  })

  it('handles batch operations', async () => {
    const existingFiles = [
      { id: '1', filename: 'test1.pdf', size: 1024, type: 'application/pdf' },
      { id: '2', filename: 'test2.docx', size: 2048, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
    ]
    
    renderWithTheme(<FileUpload files={existingFiles} onFilesChange={mockOnFilesChange} />)
    
    // Select all files
    const selectAllCheckbox = screen.getByLabelText('全选')
    fireEvent.click(selectAllCheckbox)
    
    // Remove selected files
    const removeSelectedButton = screen.getByText('删除选中')
    fireEvent.click(removeSelectedButton)

    expect(mockOnFilesChange).toHaveBeenCalledWith([])
  })
})