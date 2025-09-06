# Docling 后端 API 接口文档

本文档为 Docling 前端开发团队提供后端 API 的详细说明。当前后端的核心功能通过一个统一的 `convert` 接口暴露。

## 基础 URL

- **`http://127.0.0.1:8000/api`** (示例)

## 认证

- 当前版本 API 无需认证。

---

## 接口: `/convert`

- **Method**: `POST`
- **Content-Type**: `application/json`
- **Description**: 提交一个文档转换任务。该接口是异步的，会立即返回一个任务ID，客户端需要通过轮询或WebSocket来获取任务状态和结果。

### 请求体 (Request Body)

#### 极简请求示例 (Minimal Request)
当用户使用“简单模式”时，前端只需发送最基本的信息。

```json
{
  "input_sources": [
    "/path/to/server/temp/document.pdf"
  ]
}
```
**说明**: 在这种情况下，后端将采用所有默认配置：
- `to_formats`: `["MARKDOWN"]`
- `pipeline`: `"STANDARD"`
- `ocr`: `true`
- ...以及其他所有参数的默认值。

#### 完整请求示例 (Advanced Request)
当用户使用“高级模式”时，可以包含所有自定义参数。

##### 自定义转换示例 (Custom Conversion)
将PDF转换为带引用图片的HTML。
```json
{
  "output_mode": "CONVERSION",
  "input_sources": ["/path/to/server/temp/report.pdf"],
  "to_formats": ["HTML"],
  "image_export_mode": "REFERENCED"
}
```

##### 批量转换示例 (Batch Conversion)
转换整个目录中的文件，并将结果保存到指定的输出目录。
```json
{
  "output_mode": "CONVERSION",
  "input_sources": ["/path/to/server/temp/my_documents/"],
  "output": "/path/to/server/output/converted_files"
}
```

##### 按格式转换示例 (Run with Formats)
仅转换目录中的PDF和图片文件，并同时生成JSON和HTML两种格式。
```json
{
  "output_mode": "CONVERSION",
  "input_sources": ["/path/to/server/temp/mixed_files/"],
  "from_formats": ["PDF", "IMAGE"],
  "to_formats": ["JSON", "HTML"],
  "output": "/path/to/server/output/results"
}
```

##### 序列化与分块示例 (Serialization & Chunking)
将文档按元素分块，并在输出中排除图片和表格。
```json
{
  "output_mode": "CHUNKING",
  "input_sources": ["/path/to/server/temp/long_document.pdf"],
  "chunking_strategy": "by_element",
  "exclude": ["picture", "table"]
}
```

##### 信息提取示例 (Information Extraction)
使用VLM流水线和JSON Schema从文档中提取发票信息。
```json
{
  "output_mode": "EXTRACTION",
  "input_sources": ["/path/to/server/temp/invoice.pdf"],
  "pipeline": "VLM",
  "extraction_schema": {
    "type": "object",
    "properties": {
      "invoice_id": {
        "type": "string",
        "description": "The invoice number"
      },
      "total_amount": {
        "type": "number",
        "description": "The total amount due"
      },
      "due_date": {
        "type": "string",
        "format": "date",
        "description": "The payment due date"
      }
    },
    "required": ["invoice_id", "total_amount"]
  }
}
```

##### 转换为DOCTAGS示例
```json
{
  "output_mode": "CONVERSION",
  "input_sources": ["/path/to/server/temp/document.pdf"],
  "to_doctags": "doctags.json"
}
```

##### 转换为TEXT示例
```json
{
  "output_mode": "CONVERSION",
  "input_sources": ["/path/to/server/temp/document.pdf"],
  "to_text": "document.txt"
}
```

##### 转换为HTML分页示例
```json
{
  "output_mode": "CONVERSION",
  "input_sources": ["/path/to/server/temp/document.pdf"],
  "to_html_split_pages": "output_dir"
}
```

##### 图片描述示例 (本地模型)
使用本地的 Granite Vision 模型为图片生成描述。
```json
{
  "input_sources": ["/path/to/server/temp/document.pdf"],
  "do_picture_description": true,
  "picture_description_options": {
    "repo_id": "ibm-granite/granite-vision-3.1-2b-preview",
    "prompt": "Describe the image in three sentences. Be consise and accurate."
  }
}
```

##### 图片描述示例 (远程API)
通过一个在本地 LM Studio 运行的服务为图片生成描述。
```json
{
  "input_sources": ["/path/to/server/temp/document.pdf"],
  "enable_remote_services": true,
  "do_picture_description": true,
  "picture_description_options": {
    "url": "http://localhost:1234/v1/chat/completions",
    "params": {
      "model": "smolvlm-256m-instruct",
      "max_completion_tokens": 200
    },
    "prompt": "Describe the image in three sentences. Be consise and accurate."
  }
}
```

##### 包含所有参数的完整示例
```json
{
  "input_sources": [
    "path/to/local/file.pdf",
    "https://example.com/online/document.docx"
  ],
  "from_formats": ["PDF"],
  "to_formats": ["MARKDOWN", "HTML"],
  "show_layout": false,
  "image_export_mode": "EMBEDDED",
  "pipeline": "STANDARD",
  "vlm_model": "SMOLDOCLING",
  "asr_model": "WHISPER_TINY",
  "ocr": true,
  "force_ocr": false,
  "ocr_engine": "easyocr",
  "ocr_lang": "en,ch_sim",
  "pdf_backend": "DLPARSE_V2",
  "table_mode": "ACCURATE",
  "enrich_code": false,
  "enrich_formula": false,
  "enrich_picture_classes": false,
  "enrich_picture_description": false,
  "abort_on_error": false,
  "document_timeout": 300,
  "num_threads": 4,
  "device": "AUTO",
  "page_batch_size": 8
}
```

### 参数说明

| 参数名 | 类型 | 必选 | 描述 |
| --- | --- | --- | --- |
| `input_sources` | `Array[string]` | 是 | 输入源列表。可以是本地文件路径或URL。前端应将本地文件上传，并替换为服务器上的临时路径。 |
| `output_mode` | `string` | 否 | 输出模式。可选: `CONVERSION`, `CHUNKING`, `EXTRACTION`。默认为 `CONVERSION`。决定了任务的核心目标。 |
| `from_formats` | `Array[string]` | 否 | 指定输入格式。可选值见 `InputFormat`。默认为所有支持的格式。 |
| `to_formats` | `Array[string]` | 否 | 指定输出格式。在 `CONVERSION` 模式下使用。在 `CHUNKING` 和 `EXTRACTION` 模式下，输出固定为 `JSON`。默认为 `MARKDOWN`。 |
| `to_doctags` | `string` | 否 | 将输出保存为 DOCTAGS 格式到指定文件路径。与 `to_formats` 互斥。 |
| `to_text` | `string` | 否 | 将输出保存为 TEXT 格式到指定文件路径。与 `to_formats` 互斥。 |
| `to_html_split_pages` | `string` | 否 | 将输出保存为分页的 HTML 到指定目录。与 `to_formats` 互斥。 |
| `show_layout` | `boolean` | 否 | 是否在HTML输出中显示布局边界框。默认为 `false`。 |
| `image_export_mode` | `string` | 否 | 图像导出模式。可选: `EMBEDDED`, `REFERENCED`, `PLACEHOLDER`。默认为 `EMBEDDED`。 |
| `pipeline` | `string` | 否 | 处理流水线。可选: `STANDARD`, `VLM`, `ASR`。默认为 `STANDARD`。 |
| `vlm_model` | `string` | 否 | VLM模型类型。当 `pipeline` 为 `VLM` 时使用。默认为 `SMOLDOCLING`。 |
| `asr_model` | `string` | 否 | ASR模型类型。当 `pipeline` 为 `ASR` 时使用。默认为 `WHISPER_TINY`。 |
| `ocr` | `boolean` | 否 | 是否启用OCR。默认为 `true`。 |
| `force_ocr` | `boolean` | 否 | 是否强制对整个页面进行OCR。默认为 `false`。 |
| `ocr_engine` | `string` | 否 | OCR引擎名称。默认为 `easyocr`。 |
| `ocr_lang` | `string` | 否 | OCR语言，逗号分隔。例如: `"en,ch_sim"`。 |
| `pdf_backend` | `string` | 否 | PDF后端。可选: `DLPARSE_V1`, `DLPARSE_V2`, `PYPDFIUM2`。默认为 `DLPARSE_V2`。 |
| `table_mode` | `string` | 否 | 表格识别模式。可选: `ACCURATE`, `FAST`。默认为 `ACCURATE`。 |
| `enrich_code` | `boolean` | 否 | 是否启用代码增强。默认为 `false`。 |
| `enrich_formula` | `boolean` | 否 | 是否启用公式增强。默认为 `false`。 |
| `enrich_picture_classes` | `boolean` | 否 | 是否启用图片分类增强。默认为 `false`。 |
| `enrich_picture_description` | `boolean` | 否 | **[已废弃]** 请改用 `do_picture_description` 和 `picture_description_options`。 |
| `do_picture_description` | `boolean` | 否 | 是否启用图片描述生成功能。默认为 `false`。 |
| `enable_remote_services` | `boolean` | 否 | 是否允许为图片描述等功能调用远程API服务。默认为 `false`。 |
| `picture_description_options` | `Object` | 否 | 图片描述功能的详细配置对象。见下方 **Picture Description Options** 说明。 |
| `abort_on_error` | `boolean` | 否 | 是否在遇到第一个错误时中止任务。默认为 `false`。 |
| `document_timeout` | `number` | 否 | 单个文档处理超时时间（秒）。 |
| `num_threads` | `number` | 否 | 使用的线程数。默认为 4。 |
| `device` | `string` | 否 | 计算设备。可选: `AUTO`, `CPU`, `CUDA`, `MPS`。默认为 `AUTO`。 |
| `page_batch_size` | `number` | 否 | 页面批处理大小。 |
| `output` | `string` | 否 | 输出目录的路径。如果未提供，结果将保存在源文件各自的目录中。 |
| `chunking_strategy` | `string` | 否 | 文档分块策略。在 `CHUNKING` 模式下使用。例如: `by_element`。 |
| `exclude` | `Array[string]` | 否 | 在 `CONVERSION` 或 `CHUNKING` 模式下，序列化输出时要排除的元素类型列表。例如: `["picture", "table"]`。 |
| `extraction_schema` | `Object` | 否 | 一个JSON Schema对象，用于定义要从文档中提取的信息的结构。在 `EXTRACTION` 模式下使用。 |

### Picture Description Options (`picture_description_options`)

当 `do_picture_description` 为 `true` 时，此对象用于配置图片描述功能。它支持两种模式：本地VLM和远程API。

#### 1. 本地模型 (`PictureDescriptionVlmOptions`)

使用本地运行的 Hugging Face 模型。

```json
{
  "picture_description_options": {
    "repo_id": "HuggingFaceTB/SmolVLM-256M-Instruct",
    "prompt": "Describe the image in three sentences. Be consise and accurate."
  }
}
```

- **`repo_id`** (`string`, 必选): Hugging Face Hub 上的模型仓库ID。
- **`prompt`** (`string`, 可选): 指导模型生成内容的提示词。

#### 2. 远程 API (`PictureDescriptionApiOptions`)

调用一个兼容OpenAI聊天格式的外部API。使用此功能需要同时设置 `"enable_remote_services": true`。

```json
{
  "picture_description_options": {
    "url": "http://localhost:1234/v1/chat/completions",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    },
    "params": {
      "model": "smolvlm-256m-instruct",
      "seed": 42,
      "max_completion_tokens": 200
    },
    "prompt": "Describe the image in three sentences. Be consise and accurate.",
    "timeout": 90
  }
}
```

- **`url`** (`string`, 必选): API的端点URL。
- **`headers`** (`Object`, 可选): HTTP请求头，用于认证等。
- **`params`** (`Object`, 可选): API请求体中的额外参数。
- **`prompt`** (`string`, 可选): 提示词。
- **`timeout`** (`number`, 可选): 请求超时时间（秒）。

### 响应格式

#### 成功响应 (HTTP 202 Accepted)

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "pending",
  "message": "任务已成功提交，正在排队等待处理。"
}
```

#### 错误响应 (HTTP 400 Bad Request)

- 当请求参数验证失败时返回。

```json
{
  "error": "InvalidParameters",
  "message": "请求参数 'pipeline' 的值 'INVALID_PIPELINE' 是无效的。",
  "details": {
    "field": "pipeline",
    "value": "INVALID_PIPELINE",
    "allowed_values": ["STANDARD", "VLM", "ASR"]
  }
}
```

#### 错误响应 (HTTP 500 Internal Server Error)

- 当服务器内部发生未知错误时返回。

```json
{
  "error": "InternalServerError",
  "message": "服务器在处理您的请求时遇到内部错误。"
}
```

---

## 附录: 枚举值

### `InputFormat`

- `PDF`
- `IMAGE` (包括 PNG, JPG, BMP, WEBP, TIFF)
- `AUDIO` (包括 WAV, MP3, FLAC)
- `METS_GBS`
- `DOCX`
- `PPTX`
- `XLSX`
- `HTML`
- `MD`
- `TEXT`
- ... (其他后端支持的格式)

### `OutputFormat`

- `JSON`
- `HTML`
- `HTML_SPLIT_PAGE`
- `MARKDOWN`
- `TEXT`
- `DOCTAGS`

---

## 任务状态轮询接口 (建议)

为了获取异步任务的结果，前端需要一个接口来查询任务状态。

### 接口: `/tasks/{task_id}`

- **Method**: `GET`
- **Description**: 查询指定任务ID的状态和结果。

### 响应格式

#### 任务进行中 (HTTP 200 OK)

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "processing",
  "progress": {
    "total_files": 10,
    "processed_files": 3,
    "current_file": "document_4.pdf"
  },
  "logs": [
    "INFO: Processing document_3.pdf...",
    "INFO: OCR completed for page 5."
  ]
}
```

#### 任务完成 (HTTP 200 OK)

```json
{
  "task_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "completed",
  "summary": {
    "success_count": 9,
    "failure_count": 1
  },
  "results": [
    {
      "input_file": "document_1.pdf",
      "status": "success",
      "outputs": {
        "MARKDOWN": "/results/a1b2c3d4.../document_1.md",
        "HTML": "/results/a1b2c3d4.../document_1.html"
      }
    },
    {
      "input_file": "document_2.pdf",
      "status": "failure",
      "error": {
        "component": "OCR",
        "message": "Timeout while processing page."
      }
    }
    // ... 其他文件结果
  ]
}
```

#### 任务未找到 (HTTP 404 Not Found)

```json
{
  "error": "NotFound",
  "message": "任务ID '...' 不存在。"
}