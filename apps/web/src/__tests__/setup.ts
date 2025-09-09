import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock File and FileReader
global.File = class MockFile {
  name: string
  size: number
  type: string
  lastModified: number
  
  constructor(bits: BlobPart[], filename: string, options?: FilePropertyBag) {
    this.name = filename
    this.size = bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.size || 0), 0)
    this.type = options?.type || ''
    this.lastModified = options?.lastModified || Date.now()
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size))
  }
  
  slice(): Blob {
    return new Blob()
  }
  
  stream(): ReadableStream {
    return new ReadableStream()
  }
  
  text(): Promise<string> {
    return Promise.resolve('')
  }
} as any

global.FileReader = class MockFileReader {
  result: string | ArrayBuffer | null = null
  error: DOMException | null = null
  readyState: number = 0
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null
  onabort: ((event: ProgressEvent<FileReader>) => void) | null = null
  onloadstart: ((event: ProgressEvent<FileReader>) => void) | null = null
  onloadend: ((event: ProgressEvent<FileReader>) => void) | null = null
  onprogress: ((event: ProgressEvent<FileReader>) => void) | null = null
  
  readAsText(file: Blob): void {
    this.readyState = 1
    setTimeout(() => {
      this.readyState = 2
      this.result = 'mock file content'
      if (this.onload) {
        this.onload({ target: this } as any)
      }
    }, 0)
  }
  
  readAsDataURL(file: Blob): void {
    this.readyState = 1
    setTimeout(() => {
      this.readyState = 2
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ='
      if (this.onload) {
        this.onload({ target: this } as any)
      }
    }, 0)
  }
  
  readAsArrayBuffer(file: Blob): void {
    this.readyState = 1
    setTimeout(() => {
      this.readyState = 2
      this.result = new ArrayBuffer(8)
      if (this.onload) {
        this.onload({ target: this } as any)
      }
    }, 0)
  }
  
  abort(): void {
    this.readyState = 2
    if (this.onabort) {
      this.onabort({ target: this } as any)
    }
  }
  
  addEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }
  
  removeEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }
  
  dispatchEvent(event: Event): boolean {
    return true
  }
  
  static readonly EMPTY = 0
  static readonly LOADING = 1
  static readonly DONE = 2
  
  readonly EMPTY = 0
  readonly LOADING = 1
  readonly DONE = 2
} as any

// Mock Blob
global.Blob = class MockBlob {
  size: number
  type: string
  
  constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
    this.size = blobParts?.reduce((acc, part) => 
      acc + (typeof part === 'string' ? part.length : part.size || 0), 0
    ) || 0
    this.type = options?.type || ''
  }
  
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(this.size))
  }
  
  slice(): Blob {
    return new MockBlob()
  }
  
  stream(): ReadableStream {
    return new ReadableStream()
  }
  
  text(): Promise<string> {
    return Promise.resolve('mock blob content')
  }
} as any

// Mock EventSource
global.EventSource = class MockEventSource {
  url: string
  readyState: number = 1
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSED = 2
  
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSED = 2
  
  constructor(url: string) {
    this.url = url
  }
  
  close(): void {
    this.readyState = 2
  }
  
  addEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }
  
  removeEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }
  
  dispatchEvent(event: Event): boolean {
    return true
  }
} as any

// Setup global test utilities
global.testUtils = {
  // Helper to create mock files
  createMockFile: (name: string, type: string, size: number = 1024) => {
    return new File(['x'.repeat(size)], name, { type })
  },
  
  // Helper to create mock config
  createMockConfig: (overrides = {}) => ({
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
    },
    ...overrides
  }),
  
  // Helper to wait for async operations
  waitFor: async (condition: () => boolean, timeout: number = 5000) => {
    const start = Date.now()
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`)
    }
  },
  
  // Helper to simulate drag and drop
  simulateDragDrop: (element: HTMLElement, files: File[]) => {
    const dataTransfer = {
      files,
      items: files.map(file => ({
        kind: 'file',
        type: file.type,
        getAsFile: () => file
      })),
      types: ['Files']
    }
    
    const dragEvent = new Event('drop', { bubbles: true })
    Object.defineProperty(dragEvent, 'dataTransfer', {
      value: dataTransfer
    })
    
    element.dispatchEvent(dragEvent)
  }
}

// Extend global types
declare global {
  var testUtils: {
    createMockFile: (name: string, type: string, size?: number) => File
    createMockConfig: (overrides?: any) => any
    waitFor: (condition: () => boolean, timeout?: number) => Promise<void>
    simulateDragDrop: (element: HTMLElement, files: File[]) => void
  }
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  sessionStorageMock.clear()
})