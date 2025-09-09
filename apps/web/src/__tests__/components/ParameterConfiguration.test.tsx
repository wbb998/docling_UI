import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import ParameterConfiguration from '../components/Configuration/ParameterConfiguration'
import { ConversionConfig } from '../types/config'

const theme = createTheme()
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('ParameterConfiguration Component', () => {
  const defaultConfig: ConversionConfig = {
    from_formats: ['pdf'],
    to_formats: ['markdown'],
    ocr_enabled: false,
    generate_picture_images: false,
    chunking_enabled: false,
    extraction_enabled: false,
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

  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all configuration sections', () => {
    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    expect(screen.getByText('参数配置')).toBeInTheDocument()
    expect(screen.getByText('基础设置')).toBeInTheDocument()
    expect(screen.getByText('高级功能')).toBeInTheDocument()
    expect(screen.getByText('输入格式')).toBeInTheDocument()
    expect(screen.getByText('输出格式')).toBeInTheDocument()
  })

  it('handles input format selection correctly', () => {
    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    // Select DOCX format
    const docxCheckbox = screen.getByLabelText('DOCX')
    fireEvent.click(docxCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      from_formats: ['pdf', 'docx']
    })
  })

  it('handles output format selection correctly', () => {
    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    // Select JSON format
    const jsonCheckbox = screen.getByLabelText('JSON')
    fireEvent.click(jsonCheckbox)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      to_formats: ['markdown', 'json']
    })
  })

  it('handles OCR toggle correctly', () => {
    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    const ocrSwitch = screen.getByRole('checkbox', { name: /启用OCR/ })
    fireEvent.click(ocrSwitch)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      ocr_enabled: true
    })
  })

  it('handles picture generation toggle correctly', () => {
    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    const pictureSwitch = screen.getByRole('checkbox', { name: /生成图片/ })
    fireEvent.click(pictureSwitch)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      generate_picture_images: true
    })
  })

  it('shows chunking configuration when enabled', () => {
    const configWithChunking = {
      ...defaultConfig,
      chunking_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithChunking}
        onChange={mockOnChange}
      />
    )
    
    const chunkingSwitch = screen.getByRole('checkbox', { name: /启用分块/ })
    expect(chunkingSwitch).toBeChecked()
    
    expect(screen.getByText('分块方式')).toBeInTheDocument()
    expect(screen.getByText('最大Token数')).toBeInTheDocument()
  })

  it('handles chunking configuration changes', () => {
    const configWithChunking = {
      ...defaultConfig,
      chunking_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithChunking}
        onChange={mockOnChange}
      />
    )
    
    // Change chunking method
    const chunkingSelect = screen.getByDisplayValue('by_title')
    fireEvent.mouseDown(chunkingSelect)
    
    const byPageOption = screen.getByText('按页分块')
    fireEvent.click(byPageOption)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configWithChunking,
      chunking_config: {
        ...configWithChunking.chunking_config,
        chunker: 'by_page'
      }
    })
  })

  it('handles max tokens input correctly', () => {
    const configWithChunking = {
      ...defaultConfig,
      chunking_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithChunking}
        onChange={mockOnChange}
      />
    )
    
    const maxTokensInput = screen.getByDisplayValue('512')
    fireEvent.change(maxTokensInput, { target: { value: '1024' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configWithChunking,
      chunking_config: {
        ...configWithChunking.chunking_config,
        max_tokens: 1024
      }
    })
  })

  it('shows extraction configuration when enabled', () => {
    const configWithExtraction = {
      ...defaultConfig,
      extraction_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithExtraction}
        onChange={mockOnChange}
      />
    )
    
    const extractionSwitch = screen.getByRole('checkbox', { name: /启用提取/ })
    expect(extractionSwitch).toBeChecked()
    
    expect(screen.getByText('提取表格')).toBeInTheDocument()
    expect(screen.getByText('提取图片')).toBeInTheDocument()
    expect(screen.getByText('提取文本')).toBeInTheDocument()
  })

  it('handles extraction options correctly', () => {
    const configWithExtraction = {
      ...defaultConfig,
      extraction_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithExtraction}
        onChange={mockOnChange}
      />
    )
    
    // Toggle extract tables
    const extractTablesSwitch = screen.getByRole('checkbox', { name: /提取表格/ })
    fireEvent.click(extractTablesSwitch)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configWithExtraction,
      extraction_config: {
        ...configWithExtraction.extraction_config,
        extract_tables: false
      }
    })
  })

  it('shows VLM configuration when enabled', () => {
    const configWithVLM = {
      ...defaultConfig,
      vlm_enabled: true,
      vlm_model: 'gpt-4-vision',
      vlm_endpoint: 'https://api.openai.com/v1'
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithVLM}
        onChange={mockOnChange}
      />
    )
    
    const vlmSwitch = screen.getByRole('checkbox', { name: /启用VLM/ })
    expect(vlmSwitch).toBeChecked()
    
    expect(screen.getByText('VLM模型')).toBeInTheDocument()
    expect(screen.getByText('API端点')).toBeInTheDocument()
  })

  it('handles VLM model selection correctly', () => {
    const configWithVLM = {
      ...defaultConfig,
      vlm_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithVLM}
        onChange={mockOnChange}
      />
    )
    
    const modelSelect = screen.getByLabelText('VLM模型')
    fireEvent.mouseDown(modelSelect)
    
    const gpt4Option = screen.getByText('GPT-4 Vision')
    fireEvent.click(gpt4Option)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configWithVLM,
      vlm_model: 'gpt-4-vision'
    })
  })

  it('handles VLM endpoint input correctly', () => {
    const configWithVLM = {
      ...defaultConfig,
      vlm_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithVLM}
        onChange={mockOnChange}
      />
    )
    
    const endpointInput = screen.getByLabelText('API端点')
    fireEvent.change(endpointInput, { 
      target: { value: 'https://api.openai.com/v1' } 
    })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...configWithVLM,
      vlm_endpoint: 'https://api.openai.com/v1'
    })
  })

  it('validates required fields correctly', () => {
    const invalidConfig = {
      ...defaultConfig,
      from_formats: [],
      to_formats: []
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={invalidConfig}
        onChange={mockOnChange}
      />
    )
    
    // Should show validation errors
    expect(screen.getByText(/请至少选择一种输入格式/)).toBeInTheDocument()
    expect(screen.getByText(/请至少选择一种输出格式/)).toBeInTheDocument()
  })

  it('validates VLM configuration when enabled', () => {
    const invalidVLMConfig = {
      ...defaultConfig,
      vlm_enabled: true,
      vlm_model: '',
      vlm_endpoint: ''
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={invalidVLMConfig}
        onChange={mockOnChange}
      />
    )
    
    expect(screen.getByText(/请选择VLM模型/)).toBeInTheDocument()
    expect(screen.getByText(/请输入API端点/)).toBeInTheDocument()
  })

  it('validates max tokens range correctly', () => {
    const configWithChunking = {
      ...defaultConfig,
      chunking_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={configWithChunking}
        onChange={mockOnChange}
      />
    )
    
    const maxTokensInput = screen.getByDisplayValue('512')
    
    // Test invalid value (too low)
    fireEvent.change(maxTokensInput, { target: { value: '50' } })
    expect(screen.getByText(/Token数必须在100-4096之间/)).toBeInTheDocument()
    
    // Test invalid value (too high)
    fireEvent.change(maxTokensInput, { target: { value: '5000' } })
    expect(screen.getByText(/Token数必须在100-4096之间/)).toBeInTheDocument()
  })

  it('handles preset configurations correctly', () => {
    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    // Select quick preset
    const quickPresetButton = screen.getByText('快速转换')
    fireEvent.click(quickPresetButton)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      ocr_enabled: false,
      generate_picture_images: false,
      chunking_enabled: false,
      extraction_enabled: false,
      vlm_enabled: false
    })
  })

  it('handles advanced preset correctly', () => {
    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    // Select advanced preset
    const advancedPresetButton = screen.getByText('高级处理')
    fireEvent.click(advancedPresetButton)

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultConfig,
      ocr_enabled: true,
      generate_picture_images: true,
      chunking_enabled: true,
      extraction_enabled: true,
      vlm_enabled: false
    })
  })

  it('resets configuration correctly', () => {
    const modifiedConfig = {
      ...defaultConfig,
      ocr_enabled: true,
      generate_picture_images: true,
      chunking_enabled: true
    }

    renderWithTheme(
      <ParameterConfiguration 
        config={modifiedConfig}
        onChange={mockOnChange}
      />
    )
    
    const resetButton = screen.getByText('重置')
    fireEvent.click(resetButton)

    expect(mockOnChange).toHaveBeenCalledWith(defaultConfig)
  })

  it('exports configuration correctly', async () => {
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

    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    const exportButton = screen.getByText('导出配置')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled()
      expect(mockLink.download).toBe('docling-config.json')
    })
  })

  it('imports configuration correctly', async () => {
    const importedConfig = {
      ...defaultConfig,
      ocr_enabled: true,
      chunking_enabled: true
    }

    // Mock file input
    const mockFile = new File(
      [JSON.stringify(importedConfig)], 
      'config.json', 
      { type: 'application/json' }
    )

    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    const importButton = screen.getByText('导入配置')
    fireEvent.click(importButton)

    const fileInput = screen.getByLabelText(/选择配置文件/)
    
    // Mock FileReader
    const mockFileReader = {
      readAsText: vi.fn(),
      result: JSON.stringify(importedConfig),
      onload: null as any
    }
    
    global.FileReader = vi.fn(() => mockFileReader) as any

    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Simulate file read completion
    mockFileReader.onload({ target: mockFileReader })

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(importedConfig)
    })
  })

  it('handles invalid import file correctly', async () => {
    const mockFile = new File(['invalid json'], 'config.json', { type: 'application/json' })

    renderWithTheme(
      <ParameterConfiguration 
        config={defaultConfig}
        onChange={mockOnChange}
      />
    )
    
    const importButton = screen.getByText('导入配置')
    fireEvent.click(importButton)

    const fileInput = screen.getByLabelText(/选择配置文件/)
    
    const mockFileReader = {
      readAsText: vi.fn(),
      result: 'invalid json',
      onload: null as any
    }
    
    global.FileReader = vi.fn(() => mockFileReader) as any

    fireEvent.change(fileInput, { target: { files: [mockFile] } })
    mockFileReader.onload({ target: mockFileReader })

    await waitFor(() => {
      expect(screen.getByText(/配置文件格式错误/)).toBeInTheDocument()
    })
  })
})