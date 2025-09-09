# Docling 后端 API 接口文档 (V1.1)

**版本更新说明 (2025/09/09):**
- **接口状态**: 明确所有核心接口均已实现并通过测试。
- **SSE事件流**: 补充说明当前SSE端点为功能演示的简化实现，用于实时反馈，实际生产中可进一步增强。
- **参数与错误码**: 与`功能清单.md`对齐，确认所有新增参数已包含在内，并更新了错误码的实现状态。

---

## 📋 实现状态更新 (2025/09/09)

**已实现的接口：**
- ✅ `POST /api/convert` - 任务创建接口（JSON格式，参数校验）
- ✅ `GET /api/jobs/{job_id}/status` - 任务状态查询
- ✅ `GET /api/jobs/{job_id}/result` - 任务结果获取
- ✅ `GET /api/jobs/{job_id}/events` - SSE事件流端点（**说明**: 当前为简化实现，用于演示实时进度，可按需增强）
- ✅ `GET /healthz` - 健康检查端点

**参数校验已实现：**
- ✅ 必须参数校验（input_sources）
- ✅ 参数组合冲突校验（extraction_schema/chunking_strategy 与 to_formats）
- ✅ 远程服务依赖校验（enable_remote_services）
- ✅ 中文错误提示

**前后端联调状态：**
- ✅ API代理配置（前端5173 → 后端8000）
- ✅ 任务创建与状态轮询/SSE事件流正常
- ✅ 错误码中文化映射
- ✅ 前端渲染与状态同步问题已修复

**当前运行状态：**
- 后端API服务器：http://localhost:8000 ✅ 运行中
- 前端开发服务器：http://localhost:5173 ✅ 运行中
- API文档：http://localhost:8000/docs ✅ 可访问

---

## 1. 核心端点

- **Endpoint**: `POST /convert`
- **Content-Type**: `application/json`
- **Description**: 提交一个文档处理任务。所有功能，包括转换、分块、提取和增强，都通过这一个端点实现，具体行为由请求体中的参数决定。

## 2. 核心概念：任务模式

尽管API只有一个端点，但可以根据参数组合实现三种核心任务模式，前端界面应围绕这些模式组织：

1.  **文档转换 (Conversion)**: 主要目标是生成可读的文档格式。通过设置 `to_formats` 参数来激活。
2.  **文档分块 (Chunking)**: 主要目标是为RAG生成结构化数据块。通过设置 `chunking_strategy` 参数来激活。
3.  **信息提取 (Extraction)**: 主要目标是根据Schema提取信息。通过设置 `extraction_schema` 参数来激活。

**注意**: 这些模式可以与附加功能（如图片描述、产物导出）组合使用。

## 3. 请求参数 (Request Body)

参数被组织成与《项目需求文档》对应的逻辑块。

### 3.1 输入与输出 (Global)

| 参数名 | 类型 | 必须 | 描述 |
| :--- | :--- | :--- | :--- |
| `input_sources` | `Array[string]` | 是 | 输入源列表。可以是本地文件路径、目录路径或URL。 |
| `from_formats` | `Array[string]` | 否 | 限定处理的输入文件格式 (如 `["PDF", "IMAGE"]`)。如果为空，则处理所有支持的格式。 |
| `output` | `string` | 否 | 输出目录的路径。如果为空，结果将保存在源文件各自的目录中。 |
| `image_export_mode` | `string` | 否 | 图像处理模式。可选值: `embedded`, `referenced` (默认), `placeholder`。 |
| `enable_remote_services` | `boolean` | 否 | **总开关**。是否允许使用任何需要网络访问的远程服务（如远程VLM、远程图片描述API）。默认为 `false`。 |

### 3.2 处理流水线 (Pipeline)

| 参数名 | 类型 | 必须 | 描述 |
| :--- | :--- | :--- | :--- |
| `pipeline` | `string` | 否 | 选择处理流水线。可选值: `STANDARD` (默认), `VLM`, `ASR`。 |
| `pdf_backend` | `string` | 否 | (Standard流水线) PDF处理后端。可选值: `DoclingParseV4` (默认), `PyPdfium2`。 |
| `ocr` | `boolean` | 否 | (Standard流水线) 是否启用OCR。默认为 `false`。 |
| `ocr_options` | `Object` | 否 | (Standard流水线) OCR的详细配置。仅在 `ocr: true` 时生效。 |
| `enrich_options` | `Object` | 否 | (Standard流水线) 内容增强选项。 |
| `vlm_options` | `Object` | 否 | (VLM流水线) VLM模型的配置。 |
| `asr_model` | `string` | 否 | (ASR流水线) ASR模型的名称 (如 `whisper_base`)。 |

### 3.3 任务目标 (Target)

| 参数名 | 类型 | 必须 | 描述 |
| :--- | :--- | :--- | :--- |
| `to_formats` | `Array[string]` | 否 | **(转换模式)** 目标输出格式列表 (如 `["markdown", "html", "json"]`)。 |
| `chunking_strategy` | `string` | 否 | **(分块模式)** 文档分块策略。目前支持 `by_element`。设置此项时，输出自动为JSON。 |
| `serialization_options`| `Object` | 否 | **(分块模式)** 序列化选项，如排除某些元素。 |
| `extraction_schema` | `Object` or `string` | 否 | **(提取模式)** 用于定义提取规则的JSON Schema对象或其字符串表示。设置此项时，输出自动为JSON。 |

### 3.4 附加功能 (Add-ons)

| 参数名 | 类型 | 必须 | 描述 |
| :--- | :--- | :--- | :--- |
| `do_picture_description` | `boolean` | 否 | 是否启用图片描述生成功能。默认为 `false`。 |
| `picture_description_options` | `Object` | 否 | 图片描述功能的详细配置。仅在 `do_picture_description: true` 时生效。 |
| `export_artifacts` | `Array[string]` | 否 | 需要额外导出的产物列表。可选值: `tables_csv`, `tables_html`, `pages_png`, `pictures_png`, `multimodal_parquet`。 |
| `post_processing_options` | `Object` | 否 | 文档后处理选项，如翻译。 |

### 3.5 性能与调试

| 参数名 | 类型 | 必须 | 描述 |
| :--- | :--- | :--- | :--- |
| `device` | `string` | 否 | 计算设备。可选值: `auto` (默认), `cpu`, `cuda`, `mps`。 |
| `num_threads` | `number` | 否 | 使用的线程数。 |
| `abort_on_error`| `boolean` | 否 | 遇到错误时是否立即中止。默认为 `false`。 |
| `document_timeout`| `number` | 否 | 处理单个文档的超时时间（秒）。 |

### 3.6 扩展参数

| 参数名 | 类型 | 必须 | 描述 |
| :--- | :--- | :--- | :--- |
| `page_batch_size` | `number` | 否 | 每批次处理的页面数量（配合大文档分页并行）。 |
| `verbosity` | `string` | 否 | 日志级别：`error`/`warn`/`info`/`debug`，默认 `info`。 |
| `allow_external_plugins` | `boolean` | 否 | 是否允许加载外部插件。 |
| `show_external_plugins` | `boolean` | 否 | 是否返回可用外部插件列表。 |
| `images_scale` | `number` | 否 | 图片描述时的图像缩放倍数（影响质量与耗时），示例默认 `2.0`。仅在 `do_picture_description=true` 时生效。 |
| `generate_picture_images` | `boolean` | 否 | 是否生成图片文件用于预览/导出，默认 `true`。仅在 `do_picture_description=true` 时生效。 |

---

## 4. 详细对象结构

### 4.1 `ocr_options`

```json
{
  "engine": "tesseract",
  "lang": "en+ch_sim",
  "force_ocr": false,
  "lang_auto": true
}
```

### 4.2 `enrich_options`

```json
{
  "code": true,
  "formula": true,
  "picture_classes": false
}
```

### 4.3 `vlm_options` (本地模型示例)

```json
{
    "type": "local",
    "model": "smoldocling",
    "inference_engine": "Transformers"
}
```

### 4.4 `vlm_options` (远程API示例)

```json
{
    "type": "remote",
    "api_options": {
        "url": "http://localhost:1234/v1/chat/completions",
        "model": "lm-studio-model",
        "prompt_template": "..."
    }
}
```

### 4.5 `serialization_options`

```json
{
  "exclude": ["picture", "metadata"]
}
```

### 4.6 `picture_description_options` (本地模型示例)

```json
{
    "type": "local",
    "repo_id": "ibm-granite/granite-vision-3.1-2b-preview",
    "prompt": "Describe the image in one sentence."
}
```

### 4.7 `picture_description_options` (远程API示例)

```json
{
    "type": "remote",
    "api_options": {
        "url": "http://localhost:8000/v1/chat/completions",
        "params": {
            "model": "ibm-granite-vision-3.3-2b",
            "max_completion_tokens": 100
        },
        "headers": {
            "Authorization": "Bearer YOUR_API_KEY"
        },
        "prompt": "Describe the image concisely."
    }
}
```

---

## 5. 完整请求示例

### 示例1: 高级转换 (OCR + 图片描述 + 导出表格)

**目标**: 将一个PDF转换为Markdown和HTML，同时启用中文OCR，使用远程API为图片生成描述，并把所有表格导出为CSV文件。

```json
{
  "input_sources": ["./path/to/my_document.pdf"],
  "output": "./output/advanced_conversion",
  "enable_remote_services": true,
  "pipeline": "STANDARD",
  "ocr": true,
  "ocr_options": {
    "engine": "tesseract",
    "lang": "ch_sim"
  },
  "to_formats": ["markdown", "html"],
  "do_picture_description": true,
  "picture_description_options": {
    "type": "remote",
    "api_options": {
      "url": "http://localhost:1234/v1/chat/completions",
      "params": { "model": "llava-v1.5-7b" },
      "prompt": "Describe this image for a technical document."
    }
  },
  "export_artifacts": ["tables_csv"]
}
```

### 示例2: VLM信息提取

**目标**: 使用本地的VLM模型从一个扫描的PDF中提取发票信息。

```json
{
  "input_sources": ["./scanned_invoices/invoice_123.pdf"],
  "output": "./output/extracted_data",
  "pipeline": "VLM",
  "vlm_options": {
    "type": "local",
    "model": "smoldocling"
  },
  "extraction_schema": {
    "type": "object",
    "properties": {
      "invoice_id": { "type": "string", "description": "The invoice number" },
      "vendor_name": { "type": "string", "description": "The name of the vendor" },
      "total_amount": { "type": "number", "description": "The total amount due" }
    },
    "required": ["invoice_id", "total_amount"]
  }
}
```

### 示例3: 为RAG进行文档分块

**目标**: 将一个充满代码的文档进行分块，但在分块结果中排除所有图片元素。

```json
{
  "input_sources": ["./docs/api_reference.docx"],
  "output": "./output/rag_chunks",
  "pipeline": "STANDARD",
  "enrich_options": {
    "code": true
  },
  "chunking_strategy": "by_element",
  "serialization_options": {
    "exclude": ["picture"]
  }
}
```

## 6. 响应格式

API响应将包含任务的状态和结果。

```json
{
  "status": "completed",
  "results": [
    {
      "input_source": "./path/to/my_document.pdf",
      "status": "success",
      "outputs": {
        "markdown": "./output/advanced_conversion/my_document.md",
        "html": "./output/advanced_conversion/my_document.html",
        "artifacts": {
          "tables_csv": [
            "./output/advanced_conversion/my_document/table_0.csv",
            "./output/advanced_conversion/my_document/table_1.csv"
          ]
        }
      }
    }
  ],
  "errors": []
}
```

---

## 7. 参数约束

- 当 `extraction_schema` 或 `chunking_strategy` 存在时：输出强制为 `JSON`；若同时传入 `to_formats`，服务端返回 400 错误（`E001_INVALID_INPUT`）。
- 当 `picture_description_options.type=remote` 且 `enable_remote_services` 不为 `true` 时：返回 400（`E001_INVALID_INPUT`）。
- `image_export_mode` 仅对富文本输出（Markdown/HTML）生效；仅 JSON 输出且未选择 `pages_png/pictures_png` 产物导出时，该设置对结果无可见影响。

## 8. 错误码与错误响应结构

### 8.1 统一错误结构
```json
{
  "code": "E001_INVALID_INPUT",
  "message": "参数组合冲突：已选择信息提取，输出格式固定为 JSON，请移除 to_formats。",
  "details": { "conflicts": ["extraction_schema", "to_formats"] }
}
```

### 8.2 已实现的错误码
- ✅ `E001_INVALID_INPUT`：非法参数/组合冲突
  - 缺少必须参数：input_sources
  - 参数组合冲突：extraction_schema/chunking_strategy 与 to_formats
  - 远程服务依赖：picture_description_options.type=remote 需要 enable_remote_services
- ✅ `E404_JOB_NOT_FOUND`：任务不存在
- ✅ `E400_JOB_NOT_COMPLETED`：任务尚未完成
- ✅ `E5XX_INTERNAL`：系统内部错误

### 8.3 计划实现的错误码
- `E101_DOWNLOAD_FAILED`：URL 下载失败/超时
- `E201_OCR_FAILED`：OCR 引擎错误
- `E301_VLM_REMOTE_AUTH`：远程 VLM 认证/权限错误
- `E302_VLM_REMOTE_TIMEOUT`：远程 VLM 超时
- `E401_TIMEOUT`：文档处理超时（`document_timeout`）

### 8.4 错误信息规范
- ✅ 错误信息中文可读提示
- ✅ 日志与第三方错误信息放入 `details`
- ✅ 敏感信息脱敏处理

## 9. 异步任务接口

- `POST /convert` → `{ job_id }`
- `GET /jobs/{id}/status` → `{ progress, current_file, state }`
- `GET /jobs/{id}/result` → 汇总输出与错误
- `SSE /jobs/{id}/events` → 实时日志/进度事件流
- 建议前端请求头包含：`X-Request-Id`、`Idempotency-Key`，后端支持幂等重试。

## 10. 命名统一说明

- “HTML 分页”参数标准命名：`to_html_split_pages`（与前端/配置一致）。如需在说明中展示格式名与参数名差异，请明确映射关系。
- `to_formats` 的值统一使用小写：`markdown/html/json/yaml/text/doctags`。