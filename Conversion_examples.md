🔀 Conversion

Simple conversion
from docling.document_converter import DocumentConverter
source = "https://arxiv.org/pdf/2408.09869"  # document per local path or URL
converter = DocumentConverter()
doc = converter.convert(source).document
print(doc.export_to_markdown())
# output: ## Docling Technical Report [...]"

Custom conversion
import json
import logging
import time
from pathlib import Path
from docling.datamodel.accelerator_options import AcceleratorDevice, AcceleratorOptions
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
_log = logging.getLogger(__name__)
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    ###########################################################################

    # The following sections contain a combination of PipelineOptions
    # and PDF Backends for various configurations.
    # Uncomment one section at the time to see the differences in the output.

    # PyPdfium without EasyOCR
    # --------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = False
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = False

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(
    #             pipeline_options=pipeline_options, backend=PyPdfiumDocumentBackend
    #         )
    #     }
    # )

    # PyPdfium with EasyOCR
    # -----------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(
    #             pipeline_options=pipeline_options, backend=PyPdfiumDocumentBackend
    #         )
    #     }
    # )

    # Docling Parse without EasyOCR
    # -------------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = False
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with EasyOCR
    # ----------------------
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True
    pipeline_options.ocr_options.lang = ["es"]
    pipeline_options.accelerator_options = AcceleratorOptions(
        num_threads=4, device=AcceleratorDevice.AUTO
    )

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    # Docling Parse with EasyOCR (CPU only)
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.ocr_options.use_gpu = False  # <-- set this.
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with Tesseract
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True
    # pipeline_options.ocr_options = TesseractOcrOptions()

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with Tesseract CLI
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True
    # pipeline_options.ocr_options = TesseractCliOcrOptions()

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    # Docling Parse with ocrmac(Mac only)
    # ----------------------
    # pipeline_options = PdfPipelineOptions()
    # pipeline_options.do_ocr = True
    # pipeline_options.do_table_structure = True
    # pipeline_options.table_structure_options.do_cell_matching = True
    # pipeline_options.ocr_options = OcrMacOptions()

    # doc_converter = DocumentConverter(
    #     format_options={
    #         InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    #     }
    # )

    ###########################################################################

    start_time = time.time()
    conv_result = doc_converter.convert(input_doc_path)
    end_time = time.time() - start_time

    _log.info(f"Document converted in {end_time:.2f} seconds.")

    ## Export results
    output_dir = Path("scratch")
    output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = conv_result.input.file.stem

    # Export Deep Search document JSON format:
    with (output_dir / f"{doc_filename}.json").open("w", encoding="utf-8") as fp:
        fp.write(json.dumps(conv_result.document.export_to_dict()))

    # Export Text format:
    with (output_dir / f"{doc_filename}.txt").open("w", encoding="utf-8") as fp:
        fp.write(conv_result.document.export_to_text())

    # Export Markdown format:
    with (output_dir / f"{doc_filename}.md").open("w", encoding="utf-8") as fp:
        fp.write(conv_result.document.export_to_markdown())

    # Export Document Tags format:
    with (output_dir / f"{doc_filename}.doctags").open("w", encoding="utf-8") as fp:
        fp.write(conv_result.document.export_to_document_tokens())
if __name__ == "__main__":
    main()



    Batch conversion
import json
import logging
import time
from collections.abc import Iterable
from pathlib import Path
import yaml
from docling_core.types.doc import ImageRefMode
from docling.backend.docling_parse_v4_backend import DoclingParseV4DocumentBackend
from docling.datamodel.base_models import ConversionStatus, InputFormat
from docling.datamodel.document import ConversionResult
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
_log = logging.getLogger(__name__)
USE_V2 = True
USE_LEGACY = False
def export_documents(
    conv_results: Iterable[ConversionResult],
    output_dir: Path,
):
    output_dir.mkdir(parents=True, exist_ok=True)

    success_count = 0
    failure_count = 0
    partial_success_count = 0

    for conv_res in conv_results:
        if conv_res.status == ConversionStatus.SUCCESS:
            success_count += 1
            doc_filename = conv_res.input.file.stem

            if USE_V2:
                conv_res.document.save_as_json(
                    output_dir / f"{doc_filename}.json",
                    image_mode=ImageRefMode.PLACEHOLDER,
                )
                conv_res.document.save_as_html(
                    output_dir / f"{doc_filename}.html",
                    image_mode=ImageRefMode.EMBEDDED,
                )
                conv_res.document.save_as_document_tokens(
                    output_dir / f"{doc_filename}.doctags.txt"
                )
                conv_res.document.save_as_markdown(
                    output_dir / f"{doc_filename}.md",
                    image_mode=ImageRefMode.PLACEHOLDER,
                )
                conv_res.document.save_as_markdown(
                    output_dir / f"{doc_filename}.txt",
                    image_mode=ImageRefMode.PLACEHOLDER,
                    strict_text=True,
                )

                # Export Docling document format to YAML:
                with (output_dir / f"{doc_filename}.yaml").open("w") as fp:
                    fp.write(yaml.safe_dump(conv_res.document.export_to_dict()))

                # Export Docling document format to doctags:
                with (output_dir / f"{doc_filename}.doctags.txt").open("w") as fp:
                    fp.write(conv_res.document.export_to_document_tokens())

                # Export Docling document format to markdown:
                with (output_dir / f"{doc_filename}.md").open("w") as fp:
                    fp.write(conv_res.document.export_to_markdown())

                # Export Docling document format to text:
                with (output_dir / f"{doc_filename}.txt").open("w") as fp:
                    fp.write(conv_res.document.export_to_markdown(strict_text=True))

            if USE_LEGACY:
                # Export Deep Search document JSON format:
                with (output_dir / f"{doc_filename}.legacy.json").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(json.dumps(conv_res.legacy_document.export_to_dict()))

                # Export Text format:
                with (output_dir / f"{doc_filename}.legacy.txt").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(
                        conv_res.legacy_document.export_to_markdown(strict_text=True)
                    )

                # Export Markdown format:
                with (output_dir / f"{doc_filename}.legacy.md").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(conv_res.legacy_document.export_to_markdown())

                # Export Document Tags format:
                with (output_dir / f"{doc_filename}.legacy.doctags.txt").open(
                    "w", encoding="utf-8"
                ) as fp:
                    fp.write(conv_res.legacy_document.export_to_document_tokens())

        elif conv_res.status == ConversionStatus.PARTIAL_SUCCESS:
            _log.info(
                f"Document {conv_res.input.file} was partially converted with the following errors:"
            )
            for item in conv_res.errors:
                _log.info(f"\t{item.error_message}")
            partial_success_count += 1
        else:
            _log.info(f"Document {conv_res.input.file} failed to convert.")
            failure_count += 1

    _log.info(
        f"Processed {success_count + partial_success_count + failure_count} docs, "
        f"of which {failure_count} failed "
        f"and {partial_success_count} were partially converted."
    )
    return success_count, partial_success_count, failure_count
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_paths = [
        data_folder / "pdf/2206.01062.pdf",
        data_folder / "pdf/2203.01017v2.pdf",
        data_folder / "pdf/2305.03393v1.pdf",
        data_folder / "pdf/redp5110_sampled.pdf",
    ]

    # buf = BytesIO((data_folder / "pdf/2206.01062.pdf").open("rb").read())
    # docs = [DocumentStream(name="my_doc.pdf", stream=buf)]
    # input = DocumentConversionInput.from_streams(docs)

    # # Turn on inline debug visualizations:
    # settings.debug.visualize_layout = True
    # settings.debug.visualize_ocr = True
    # settings.debug.visualize_tables = True
    # settings.debug.visualize_cells = True

    pipeline_options = PdfPipelineOptions()
    pipeline_options.generate_page_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options, backend=DoclingParseV4DocumentBackend
            )
        }
    )

    start_time = time.time()

    conv_results = doc_converter.convert_all(
        input_doc_paths,
        raises_on_error=False,  # to let conversion run through all and examine results at the end
    )
    success_count, partial_success_count, failure_count = export_documents(
        conv_results, output_dir=Path("scratch")
    )

    end_time = time.time() - start_time

    _log.info(f"Document conversion complete in {end_time:.2f} seconds.")

    if failure_count > 0:
        raise RuntimeError(
            f"The example failed converting {failure_count} on {len(input_doc_paths)}."
        )
if __name__ == "__main__":
    main()



    Multi-format conversion
import json
import logging
from pathlib import Path
import yaml
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
from docling.datamodel.base_models import InputFormat
from docling.document_converter import (
    DocumentConverter,
    PdfFormatOption,
    WordFormatOption,
)
from docling.pipeline.simple_pipeline import SimplePipeline
from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline
_log = logging.getLogger(__name__)
def main():
    input_paths = [
        Path("README.md"),
        Path("tests/data/html/wiki_duck.html"),
        Path("tests/data/docx/word_sample.docx"),
        Path("tests/data/docx/lorem_ipsum.docx"),
        Path("tests/data/pptx/powerpoint_sample.pptx"),
        Path("tests/data/2305.03393v1-pg9-img.png"),
        Path("tests/data/pdf/2206.01062.pdf"),
        Path("tests/data/asciidoc/test_01.asciidoc"),
    ]

    ## for defaults use:
    # doc_converter = DocumentConverter()

    ## to customize use:

    doc_converter = (
        DocumentConverter(  # all of the below is optional, has internal defaults.
            allowed_formats=[
                InputFormat.PDF,
                InputFormat.IMAGE,
                InputFormat.DOCX,
                InputFormat.HTML,
                InputFormat.PPTX,
                InputFormat.ASCIIDOC,
                InputFormat.CSV,
                InputFormat.MD,
            ],  # whitelist formats, non-matching files are ignored.
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_cls=StandardPdfPipeline, backend=PyPdfiumDocumentBackend
                ),
                InputFormat.DOCX: WordFormatOption(
                    pipeline_cls=SimplePipeline  # , backend=MsWordDocumentBackend
                ),
            },
        )
    )

    conv_results = doc_converter.convert_all(input_paths)

    for res in conv_results:
        out_path = Path("scratch")
        print(
            f"Document {res.input.file.name} converted."
            f"\nSaved markdown output to: {out_path!s}"
        )
        _log.debug(res.document._export_to_indented_text(max_text_len=16))
        # Export Docling document format to markdowndoc:
        with (out_path / f"{res.input.file.stem}.md").open("w") as fp:
            fp.write(res.document.export_to_markdown())

        with (out_path / f"{res.input.file.stem}.json").open("w") as fp:
            fp.write(json.dumps(res.document.export_to_dict()))

        with (out_path / f"{res.input.file.stem}.yaml").open("w") as fp:
            fp.write(yaml.safe_dump(res.document.export_to_dict()))
if __name__ == "__main__":
    main()



    VLM pipeline with SmolDocling
from docling.datamodel import vlm_model_specs
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
source = "https://arxiv.org/pdf/2501.17887"
USING SIMPLE DEFAULT VALUES
SmolDocling model
Using the transformers framework
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_cls=VlmPipeline,
        ),
    }
)
doc = converter.convert(source=source).document
print(doc.export_to_markdown())
USING MACOS MPS ACCELERATOR
For more options see the compare_vlm_models.py example.

pipeline_options = VlmPipelineOptions(
    vlm_options=vlm_model_specs.SMOLDOCLING_MLX,
)
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_cls=VlmPipeline,
            pipeline_options=pipeline_options,
        ),
    }
)
doc = converter.convert(source=source).document
print(doc.export_to_markdown())




VLM pipeline with remote model
import json
import logging
import os
from pathlib import Path
from typing import Optional
import requests
from docling_core.types.doc.page import SegmentedPage
from dotenv import load_dotenv
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.datamodel.pipeline_options_vlm_model import ApiVlmOptions, ResponseFormat
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
Example of ApiVlmOptions definitions
Using LM Studio
def lms_vlm_options(model: str, prompt: str, format: ResponseFormat):
    options = ApiVlmOptions(
        url="http://localhost:1234/v1/chat/completions",  # the default LM Studio
        params=dict(
            model=model,
        ),
        prompt=prompt,
        timeout=90,
        scale=1.0,
        response_format=format,
    )
    return options
Using LM Studio with OlmOcr model
def lms_olmocr_vlm_options(model: str):
    class OlmocrVlmOptions(ApiVlmOptions):
        def build_prompt(self, page: Optional[SegmentedPage]) -> str:
            if page is None:
                return self.prompt.replace("#RAW_TEXT#", "")

            anchor = [
                f"Page dimensions: {int(page.dimension.width)}x{int(page.dimension.height)}"
            ]

            for text_cell in page.textline_cells:
                if not text_cell.text.strip():
                    continue
                bbox = text_cell.rect.to_bounding_box().to_bottom_left_origin(
                    page.dimension.height
                )
                anchor.append(f"[{int(bbox.l)}x{int(bbox.b)}] {text_cell.text}")

            for image_cell in page.bitmap_resources:
                bbox = image_cell.rect.to_bounding_box().to_bottom_left_origin(
                    page.dimension.height
                )
                anchor.append(
                    f"[Image {int(bbox.l)}x{int(bbox.b)} to {int(bbox.r)}x{int(bbox.t)}]"
                )

            if len(anchor) == 1:
                anchor.append(
                    f"[Image 0x0 to {int(page.dimension.width)}x{int(page.dimension.height)}]"
                )

            # Original prompt uses cells sorting. We are skipping it for simplicity.

            raw_text = "\n".join(anchor)

            return self.prompt.replace("#RAW_TEXT#", raw_text)

        def decode_response(self, text: str) -> str:
            # OlmOcr trained to generate json response with language, rotation and other info
            try:
                generated_json = json.loads(text)
            except json.decoder.JSONDecodeError:
                return ""

            return generated_json["natural_text"]

    options = OlmocrVlmOptions(
        url="http://localhost:1234/v1/chat/completions",
        params=dict(
            model=model,
        ),
        prompt=(
            "Below is the image of one page of a document, as well as some raw textual"
            " content that was previously extracted for it. Just return the plain text"
            " representation of this document as if you were reading it naturally.\n"
            "Do not hallucinate.\n"
            "RAW_TEXT_START\n#RAW_TEXT#\nRAW_TEXT_END"
        ),
        timeout=90,
        scale=1.0,
        max_size=1024,  # from OlmOcr pipeline
        response_format=ResponseFormat.MARKDOWN,
    )
    return options
Using Ollama
def ollama_vlm_options(model: str, prompt: str):
    options = ApiVlmOptions(
        url="http://localhost:11434/v1/chat/completions",  # the default Ollama endpoint
        params=dict(
            model=model,
        ),
        prompt=prompt,
        timeout=90,
        scale=1.0,
        response_format=ResponseFormat.MARKDOWN,
    )
    return options
Using a cloud service like IBM watsonx.ai
def watsonx_vlm_options(model: str, prompt: str):
    load_dotenv()
    api_key = os.environ.get("WX_API_KEY")
    project_id = os.environ.get("WX_PROJECT_ID")

    def _get_iam_access_token(api_key: str) -> str:
        res = requests.post(
            url="https://iam.cloud.ibm.com/identity/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data=f"grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey={api_key}",
        )
        res.raise_for_status()
        api_out = res.json()
        print(f"{api_out=}")
        return api_out["access_token"]

    options = ApiVlmOptions(
        url="https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29",
        params=dict(
            model_id=model,
            project_id=project_id,
            parameters=dict(
                max_new_tokens=400,
            ),
        ),
        headers={
            "Authorization": "Bearer " + _get_iam_access_token(api_key=api_key),
        },
        prompt=prompt,
        timeout=60,
        response_format=ResponseFormat.MARKDOWN,
    )
    return options
Usage and conversion
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2305.03393v1-pg9.pdf"

    pipeline_options = VlmPipelineOptions(
        enable_remote_services=True  # <-- this is required!
    )

    # The ApiVlmOptions() allows to interface with APIs supporting
    # the multi-modal chat interface. Here follow a few example on how to configure those.

    # One possibility is self-hosting model, e.g. via LM Studio, Ollama or others.

    # Example using the SmolDocling model with LM Studio:
    # (uncomment the following lines)
    pipeline_options.vlm_options = lms_vlm_options(
        model="smoldocling-256m-preview-mlx-docling-snap",
        prompt="Convert this page to docling.",
        format=ResponseFormat.DOCTAGS,
    )

    # Example using the Granite Vision model with LM Studio:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = lms_vlm_options(
    #     model="granite-vision-3.2-2b",
    #     prompt="OCR the full page to markdown.",
    #     format=ResponseFormat.MARKDOWN,
    # )

    # Example using the OlmOcr (dynamic prompt) model with LM Studio:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = lms_olmocr_vlm_options(
    #     model="hf.co/lmstudio-community/olmOCR-7B-0225-preview-GGUF",
    # )

    # Example using the Granite Vision model with Ollama:
    # (uncomment the following lines)
    # pipeline_options.vlm_options = ollama_vlm_options(
    #     model="granite3.2-vision:2b",
    #     prompt="OCR the full page to markdown.",
    # )

    # Another possibility is using online services, e.g. watsonx.ai.
    # Using requires setting the env variables WX_API_KEY and WX_PROJECT_ID.
    # (uncomment the following lines)
    # pipeline_options.vlm_options = watsonx_vlm_options(
    #     model="ibm/granite-vision-3-2-2b", prompt="OCR the full page to markdown."
    # )

    # Create the DocumentConverter and launch the conversion.
    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
                pipeline_cls=VlmPipeline,
            )
        }
    )
    result = doc_converter.convert(input_doc_path)
    print(result.document.export_to_markdown())
if __name__ == "__main__":
    main()




    Compare VLM models
This example runs the VLM pipeline with different vision-language models. Their runtime as well output quality is compared.

import json
import sys
import time
from pathlib import Path
from docling_core.types.doc import DocItemLabel, ImageRefMode
from docling_core.types.doc.document import DEFAULT_EXPORT_LABELS
from tabulate import tabulate
from docling.datamodel import vlm_model_specs
from docling.datamodel.accelerator_options import AcceleratorDevice
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    VlmPipelineOptions,
)
from docling.datamodel.pipeline_options_vlm_model import (
    InferenceFramework,
    InlineVlmOptions,
    ResponseFormat,
    TransformersModelType,
    TransformersPromptStyle,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.pipeline.vlm_pipeline import VlmPipeline
def convert(sources: list[Path], converter: DocumentConverter):
    model_id = pipeline_options.vlm_options.repo_id.replace("/", "_")
    framework = pipeline_options.vlm_options.inference_framework
    for source in sources:
        print("================================================")
        print("Processing...")
        print(f"Source: {source}")
        print("---")
        print(f"Model: {model_id}")
        print(f"Framework: {framework}")
        print("================================================")
        print("")

        res = converter.convert(source)

        print("")

        fname = f"{res.input.file.stem}-{model_id}-{framework}"

        inference_time = 0.0
        for i, page in enumerate(res.pages):
            inference_time += page.predictions.vlm_response.generation_time
            print("")
            print(
                f" ---------- Predicted page {i} in {pipeline_options.vlm_options.response_format} in {page.predictions.vlm_response.generation_time} [sec]:"
            )
            print(page.predictions.vlm_response.text)
            print(" ---------- ")

        print("===== Final output of the converted document =======")

        with (out_path / f"{fname}.json").open("w") as fp:
            fp.write(json.dumps(res.document.export_to_dict()))

        res.document.save_as_json(
            out_path / f"{fname}.json",
            image_mode=ImageRefMode.PLACEHOLDER,
        )
        print(f" => produced {out_path / fname}.json")

        res.document.save_as_markdown(
            out_path / f"{fname}.md",
            image_mode=ImageRefMode.PLACEHOLDER,
        )
        print(f" => produced {out_path / fname}.md")

        res.document.save_as_html(
            out_path / f"{fname}.html",
            image_mode=ImageRefMode.EMBEDDED,
            labels=[*DEFAULT_EXPORT_LABELS, DocItemLabel.FOOTNOTE],
            split_page_view=True,
        )
        print(f" => produced {out_path / fname}.html")

        pg_num = res.document.num_pages()
        print("")
        print(
            f"Total document prediction time: {inference_time:.2f} seconds, pages: {pg_num}"
        )
        print("====================================================")

        return [
            source,
            model_id,
            str(framework),
            pg_num,
            inference_time,
        ]
if __name__ == "__main__":
    sources = [
        "tests/data/pdf/2305.03393v1-pg9.pdf",
    ]

    out_path = Path("scratch")
    out_path.mkdir(parents=True, exist_ok=True)

    ## Definiton of more inline models
    llava_qwen = InlineVlmOptions(
        repo_id="llava-hf/llava-interleave-qwen-0.5b-hf",
        # prompt="Read text in the image.",
        prompt="Convert this page to markdown. Do not miss any text and only output the bare markdown!",
        # prompt="Parse the reading order of this document.",
        response_format=ResponseFormat.MARKDOWN,
        inference_framework=InferenceFramework.TRANSFORMERS,
        transformers_model_type=TransformersModelType.AUTOMODEL_IMAGETEXTTOTEXT,
        supported_devices=[AcceleratorDevice.CUDA, AcceleratorDevice.CPU],
        scale=2.0,
        temperature=0.0,
    )

    # Note that this is not the expected way of using the Dolphin model, but it shows the usage of a raw prompt.
    dolphin_oneshot = InlineVlmOptions(
        repo_id="ByteDance/Dolphin",
        prompt="<s>Read text in the image. <Answer/>",
        response_format=ResponseFormat.MARKDOWN,
        inference_framework=InferenceFramework.TRANSFORMERS,
        transformers_model_type=TransformersModelType.AUTOMODEL_IMAGETEXTTOTEXT,
        transformers_prompt_style=TransformersPromptStyle.RAW,
        supported_devices=[AcceleratorDevice.CUDA, AcceleratorDevice.CPU],
        scale=2.0,
        temperature=0.0,
    )

    ## Use VlmPipeline
    pipeline_options = VlmPipelineOptions()
    pipeline_options.generate_page_images = True

    ## On GPU systems, enable flash_attention_2 with CUDA:
    # pipeline_options.accelerator_options.device = AcceleratorDevice.CUDA
    # pipeline_options.accelerator_options.cuda_use_flash_attention2 = True

    vlm_models = [
        ## DocTags / SmolDocling models
        vlm_model_specs.SMOLDOCLING_MLX,
        vlm_model_specs.SMOLDOCLING_TRANSFORMERS,
        ## Markdown models (using MLX framework)
        vlm_model_specs.QWEN25_VL_3B_MLX,
        vlm_model_specs.PIXTRAL_12B_MLX,
        vlm_model_specs.GEMMA3_12B_MLX,
        ## Markdown models (using Transformers framework)
        vlm_model_specs.GRANITE_VISION_TRANSFORMERS,
        vlm_model_specs.PHI4_TRANSFORMERS,
        vlm_model_specs.PIXTRAL_12B_TRANSFORMERS,
        ## More inline models
        dolphin_oneshot,
        llava_qwen,
    ]

    # Remove MLX models if not on Mac
    if sys.platform != "darwin":
        vlm_models = [
            m for m in vlm_models if m.inference_framework != InferenceFramework.MLX
        ]

    rows = []
    for vlm_options in vlm_models:
        pipeline_options.vlm_options = vlm_options

        ## Set up pipeline for PDF or image inputs
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_cls=VlmPipeline,
                    pipeline_options=pipeline_options,
                ),
                InputFormat.IMAGE: PdfFormatOption(
                    pipeline_cls=VlmPipeline,
                    pipeline_options=pipeline_options,
                ),
            },
        )

        row = convert(sources=sources, converter=converter)
        rows.append(row)

        print(
            tabulate(
                rows, headers=["source", "model_id", "framework", "num_pages", "time"]
            )
        )

        print("see if memory gets released ...")
        time.sleep(10)




        ASR pipeline with Whisper
from pathlib import Path
from docling_core.types.doc import DoclingDocument
from docling.datamodel import asr_model_specs
from docling.datamodel.base_models import ConversionStatus, InputFormat
from docling.datamodel.document import ConversionResult
from docling.datamodel.pipeline_options import AsrPipelineOptions
from docling.document_converter import AudioFormatOption, DocumentConverter
from docling.pipeline.asr_pipeline import AsrPipeline
def get_asr_converter():
    """Create a DocumentConverter configured for ASR with whisper_turbo model."""
    pipeline_options = AsrPipelineOptions()
    pipeline_options.asr_options = asr_model_specs.WHISPER_TURBO

    converter = DocumentConverter(
        format_options={
            InputFormat.AUDIO: AudioFormatOption(
                pipeline_cls=AsrPipeline,
                pipeline_options=pipeline_options,
            )
        }
    )
    return converter
def asr_pipeline_conversion(audio_path: Path) -> DoclingDocument:
    """ASR pipeline conversion using whisper_turbo"""
    # Check if the test audio file exists
    assert audio_path.exists(), f"Test audio file not found: {audio_path}"

    converter = get_asr_converter()

    # Convert the audio file
    result: ConversionResult = converter.convert(audio_path)

    # Verify conversion was successful
    assert result.status == ConversionStatus.SUCCESS, (
        f"Conversion failed with status: {result.status}"
    )
    return result.document
if __name__ == "__main__":
    audio_path = Path("tests/data/audio/sample_10s.mp3")

    doc = asr_pipeline_conversion(audio_path=audio_path)
    print(doc.export_to_markdown())

    # Expected output:
    #
    # [time: 0.0-4.0]  Shakespeare on Scenery by Oscar Wilde
    #
    # [time: 5.28-9.96]  This is a LibriVox recording. All LibriVox recordings are in the public domain.




    Figure export
import logging
import time
from pathlib import Path
from docling_core.types.doc import ImageRefMode, PictureItem, TableItem
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
_log = logging.getLogger(__name__)
IMAGE_RESOLUTION_SCALE = 2.0
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    # Important: For operating with page images, we must keep them, otherwise the DocumentConverter
    # will destroy them for cleaning up memory.
    # This is done by setting PdfPipelineOptions.images_scale, which also defines the scale of images.
    # scale=1 correspond of a standard 72 DPI image
    # The PdfPipelineOptions.generate_* are the selectors for the document elements which will be enriched
    # with the image field
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.generate_page_images = True
    pipeline_options.generate_picture_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    start_time = time.time()

    conv_res = doc_converter.convert(input_doc_path)

    output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = conv_res.input.file.stem

    # Save page images
    for page_no, page in conv_res.document.pages.items():
        page_no = page.page_no
        page_image_filename = output_dir / f"{doc_filename}-{page_no}.png"
        with page_image_filename.open("wb") as fp:
            page.image.pil_image.save(fp, format="PNG")

    # Save images of figures and tables
    table_counter = 0
    picture_counter = 0
    for element, _level in conv_res.document.iterate_items():
        if isinstance(element, TableItem):
            table_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-table-{table_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(conv_res.document).save(fp, "PNG")

        if isinstance(element, PictureItem):
            picture_counter += 1
            element_image_filename = (
                output_dir / f"{doc_filename}-picture-{picture_counter}.png"
            )
            with element_image_filename.open("wb") as fp:
                element.get_image(conv_res.document).save(fp, "PNG")

    # Save markdown with embedded pictures
    md_filename = output_dir / f"{doc_filename}-with-images.md"
    conv_res.document.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)

    # Save markdown with externally referenced pictures
    md_filename = output_dir / f"{doc_filename}-with-image-refs.md"
    conv_res.document.save_as_markdown(md_filename, image_mode=ImageRefMode.REFERENCED)

    # Save HTML with externally referenced pictures
    html_filename = output_dir / f"{doc_filename}-with-image-refs.html"
    conv_res.document.save_as_html(html_filename, image_mode=ImageRefMode.REFERENCED)

    end_time = time.time() - start_time

    _log.info(f"Document converted and figures exported in {end_time:.2f} seconds.")
if __name__ == "__main__":
    main()



    Table export
import logging
import time
from pathlib import Path
import pandas as pd
from docling.document_converter import DocumentConverter
_log = logging.getLogger(__name__)
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    doc_converter = DocumentConverter()

    start_time = time.time()

    conv_res = doc_converter.convert(input_doc_path)

    output_dir.mkdir(parents=True, exist_ok=True)

    doc_filename = conv_res.input.file.stem

    # Export tables
    for table_ix, table in enumerate(conv_res.document.tables):
        table_df: pd.DataFrame = table.export_to_dataframe()
        print(f"## Table {table_ix}")
        print(table_df.to_markdown())

        # Save the table as csv
        element_csv_filename = output_dir / f"{doc_filename}-table-{table_ix + 1}.csv"
        _log.info(f"Saving CSV table to {element_csv_filename}")
        table_df.to_csv(element_csv_filename)

        # Save the table as html
        element_html_filename = output_dir / f"{doc_filename}-table-{table_ix + 1}.html"
        _log.info(f"Saving HTML table to {element_html_filename}")
        with element_html_filename.open("w") as fp:
            fp.write(table.export_to_html(doc=conv_res.document))

    end_time = time.time() - start_time

    _log.info(f"Document converted and tables exported in {end_time:.2f} seconds.")
if __name__ == "__main__":
    main()


    Multimodal export
import datetime
import logging
import time
from pathlib import Path
import pandas as pd
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.utils.export import generate_multimodal_pages
from docling.utils.utils import create_hash
_log = logging.getLogger(__name__)
IMAGE_RESOLUTION_SCALE = 2.0
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    # Important: For operating with page images, we must keep them, otherwise the DocumentConverter
    # will destroy them for cleaning up memory.
    # This is done by setting AssembleOptions.images_scale, which also defines the scale of images.
    # scale=1 correspond of a standard 72 DPI image
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.generate_page_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    start_time = time.time()

    conv_res = doc_converter.convert(input_doc_path)

    output_dir.mkdir(parents=True, exist_ok=True)

    rows = []
    for (
        content_text,
        content_md,
        content_dt,
        page_cells,
        page_segments,
        page,
    ) in generate_multimodal_pages(conv_res):
        dpi = page._default_image_scale * 72

        rows.append(
            {
                "document": conv_res.input.file.name,
                "hash": conv_res.input.document_hash,
                "page_hash": create_hash(
                    conv_res.input.document_hash + ":" + str(page.page_no - 1)
                ),
                "image": {
                    "width": page.image.width,
                    "height": page.image.height,
                    "bytes": page.image.tobytes(),
                },
                "cells": page_cells,
                "contents": content_text,
                "contents_md": content_md,
                "contents_dt": content_dt,
                "segments": page_segments,
                "extra": {
                    "page_num": page.page_no + 1,
                    "width_in_points": page.size.width,
                    "height_in_points": page.size.height,
                    "dpi": dpi,
                },
            }
        )

    # Generate one parquet from all documents
    df_result = pd.json_normalize(rows)
    now = datetime.datetime.now()
    output_filename = output_dir / f"multimodal_{now:%Y-%m-%d_%H%M%S}.parquet"
    df_result.to_parquet(output_filename)

    end_time = time.time() - start_time

    _log.info(
        f"Document converted and multimodal pages generated in {end_time:.2f} seconds."
    )

    # This block demonstrates how the file can be opened with the HF datasets library
    # from datasets import Dataset
    # from PIL import Image
    # multimodal_df = pd.read_parquet(output_filename)

    # # Convert pandas DataFrame to Hugging Face Dataset and load bytes into image
    # dataset = Dataset.from_pandas(multimodal_df)
    # def transforms(examples):
    #     examples["image"] = Image.frombytes('RGB', (examples["image.width"], examples["image.height"]), examples["image.bytes"], 'raw')
    #     return examples
    # dataset = dataset.map(transforms)
if __name__ == "__main__":
    main()



    Force full page OCR
from pathlib import Path
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    TesseractCliOcrOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
def main():
    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True

    # Any of the OCR options can be used:EasyOcrOptions, TesseractOcrOptions, TesseractCliOcrOptions, OcrMacOptions(Mac only), RapidOcrOptions
    # ocr_options = EasyOcrOptions(force_full_page_ocr=True)
    # ocr_options = TesseractOcrOptions(force_full_page_ocr=True)
    # ocr_options = OcrMacOptions(force_full_page_ocr=True)
    # ocr_options = RapidOcrOptions(force_full_page_ocr=True)
    ocr_options = TesseractCliOcrOptions(force_full_page_ocr=True)
    pipeline_options.ocr_options = ocr_options

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )

    doc = converter.convert(input_doc_path).document
    md = doc.export_to_markdown()
    print(md)
if __name__ == "__main__":
    main()



    Automatic OCR language detection with tesseract
from pathlib import Path
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    TesseractCliOcrOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
def main():
    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    # Set lang=["auto"] with a tesseract OCR engine: TesseractOcrOptions, TesseractCliOcrOptions
    # ocr_options = TesseractOcrOptions(lang=["auto"])
    ocr_options = TesseractCliOcrOptions(lang=["auto"])

    pipeline_options = PdfPipelineOptions(
        do_ocr=True, force_full_page_ocr=True, ocr_options=ocr_options
    )

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )

    doc = converter.convert(input_doc_path).document
    md = doc.export_to_markdown()
    print(md)
if __name__ == "__main__":
    main()



    RapidOCR with custom OCR models
import os
from modelscope import snapshot_download
from docling.datamodel.pipeline_options import PdfPipelineOptions, RapidOcrOptions
from docling.document_converter import (
    ConversionResult,
    DocumentConverter,
    InputFormat,
    PdfFormatOption,
)
def main():
    # Source document to convert
    source = "https://arxiv.org/pdf/2408.09869v4"

    # Download RappidOCR models from HuggingFace
    print("Downloading RapidOCR models")
    download_path = snapshot_download(repo_id="RapidAI/RapidOCR")

    # Setup RapidOcrOptions for english detection
    det_model_path = os.path.join(
        download_path, "onnx", "PP-OCRv5", "det", "ch_PP-OCRv5_server_det.onnx"
    )
    rec_model_path = os.path.join(
        download_path, "onnx", "PP-OCRv5", "rec", "ch_PP-OCRv5_rec_server_infer.onnx"
    )
    cls_model_path = os.path.join(
        download_path, "onnx", "PP-OCRv4", "cls", "ch_ppocr_mobile_v2.0_cls_infer.onnx"
    )
    ocr_options = RapidOcrOptions(
        det_model_path=det_model_path,
        rec_model_path=rec_model_path,
        cls_model_path=cls_model_path,
    )

    pipeline_options = PdfPipelineOptions(
        ocr_options=ocr_options,
    )

    # Convert the document
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            ),
        },
    )

    conversion_result: ConversionResult = converter.convert(source=source)
    doc = conversion_result.document
    md = doc.export_to_markdown()
    print(md)
if __name__ == "__main__":
    main()



    Accelerator options
from pathlib import Path
from docling.datamodel.accelerator_options import AcceleratorDevice, AcceleratorOptions
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
)
from docling.datamodel.settings import settings
from docling.document_converter import DocumentConverter, PdfFormatOption
def main():
    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    # Explicitly set the accelerator
    # accelerator_options = AcceleratorOptions(
    #     num_threads=8, device=AcceleratorDevice.AUTO
    # )
    accelerator_options = AcceleratorOptions(
        num_threads=8, device=AcceleratorDevice.CPU
    )
    # accelerator_options = AcceleratorOptions(
    #     num_threads=8, device=AcceleratorDevice.MPS
    # )
    # accelerator_options = AcceleratorOptions(
    #     num_threads=8, device=AcceleratorDevice.CUDA
    # )

    # easyocr doesnt support cuda:N allocation, defaults to cuda:0
    # accelerator_options = AcceleratorOptions(num_threads=8, device="cuda:1")

    pipeline_options = PdfPipelineOptions()
    pipeline_options.accelerator_options = accelerator_options
    pipeline_options.do_ocr = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )

    # Enable the profiling to measure the time spent
    settings.debug.profile_pipeline_timings = True

    # Convert the document
    conversion_result = converter.convert(input_doc_path)
    doc = conversion_result.document

    # List with total time per document
    doc_conversion_secs = conversion_result.timings["pipeline_total"].times

    md = doc.export_to_markdown()
    print(md)
    print(f"Conversion secs: {doc_conversion_secs}")
if __name__ == "__main__":
    main()



    Simple translation
import logging
from pathlib import Path
from docling_core.types.doc import ImageRefMode, TableItem, TextItem
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
_log = logging.getLogger(__name__)
IMAGE_RESOLUTION_SCALE = 2.0
# FIXME: put in your favorite translation code ....
def translate(text: str, src: str = "en", dest: str = "de"):
    _log.warning("!!! IMPLEMENT HERE YOUR FAVORITE TRANSLATION CODE!!!")
    # from googletrans import Translator

    # Initialize the translator
    # translator = Translator()

    # Translate text from English to German
    # text = "Hello, how are you?"
    # translated = translator.translate(text, src="en", dest="de")

    return text
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"
    output_dir = Path("scratch")

    # Important: For operating with page images, we must keep them, otherwise the DocumentConverter
    # will destroy them for cleaning up memory.
    # This is done by setting PdfPipelineOptions.images_scale, which also defines the scale of images.
    # scale=1 correspond of a standard 72 DPI image
    # The PdfPipelineOptions.generate_* are the selectors for the document elements which will be enriched
    # with the image field
    pipeline_options = PdfPipelineOptions()
    pipeline_options.images_scale = IMAGE_RESOLUTION_SCALE
    pipeline_options.generate_page_images = True
    pipeline_options.generate_picture_images = True

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    conv_res = doc_converter.convert(input_doc_path)
    conv_doc = conv_res.document
    doc_filename = conv_res.input.file.name

    # Save markdown with embedded pictures in original text
    md_filename = output_dir / f"{doc_filename}-with-images-orig.md"
    conv_doc.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)

    for element, _level in conv_res.document.iterate_items():
        if isinstance(element, TextItem):
            element.orig = element.text
            element.text = translate(text=element.text)

        elif isinstance(element, TableItem):
            for cell in element.data.table_cells:
                cell.text = translate(text=cell.text)

    # Save markdown with embedded pictures in translated text
    md_filename = output_dir / f"{doc_filename}-with-images-translated.md"
    conv_doc.save_as_markdown(md_filename, image_mode=ImageRefMode.EMBEDDED)
if __name__ == "__main__":
    main()




    Conversion of CSV files
This example shows how to convert CSV files to a structured Docling Document.

Multiple delimiters are supported: , ; | [tab]
Additional CSV dialect settings are detected automatically (e.g. quotes, line separator, escape character)
Example Code
from pathlib import Path

from docling.document_converter import DocumentConverter

# Convert CSV to Docling document
converter = DocumentConverter()
result = converter.convert(Path("../../tests/data/csv/csv-comma.csv"))
output = result.document.export_to_markdown()
This code generates the following output:

Index	Customer Id	First Name	Last Name	Company	City	Country	Phone 1	Phone 2	Email	Subscription Date	Website
1	DD37Cf93aecA6Dc	Sheryl	Baxter	Rasmussen Group	East Leonard	Chile	229.077.5154	397.884.0519x718	zunigavanessa@smith.info	2020-08-24	http://www.stephenson.com/
2	1Ef7b82A4CAAD10	Preston	Lozano, Dr	Vega-Gentry	East Jimmychester	Djibouti	5153435776	686-620-1820x944	vmata@colon.com	2021-04-23	http://www.hobbs.com/
3	6F94879bDAfE5a6	Roy	Berry	Murillo-Perry	Isabelborough	Antigua and Barbuda	+1-539-402-0259	(496)978-3969x58947	beckycarr@hogan.com	2020-03-25	http://www.lawrence.com/
4	5Cef8BFA16c5e3c	Linda	Olsen	Dominguez, Mcmillan and Donovan	Bensonview	Dominican Republic	001-808-617-6467x12895	+1-813-324-8756	stanleyblackwell@benson.org	2020-06-02	http://www.good-lyons.com/
5	053d585Ab6b3159	Joanna	Bender	Martin, Lang and Andrade	West Priscilla	Slovakia (Slovak Republic)	001-234-203-0635x76146	001-199-446-3860x3486	colinalvarado@miles.net	2021-04-17	https://goodwin-ingram.com/




Conversion of custom XML
Step	Tech	Execution
Embedding	Hugging Face / Sentence Transformers	💻 Local
Vector store	Milvus	💻 Local
Gen AI	Hugging Face Inference API	🌐 Remote
Overview
This is an example of using Docling for converting structured data (XML) into a unified document representation format, DoclingDocument, and leverage its riched structured content for RAG applications.

Data used in this example consist of patents from the United States Patent and Trademark Office (USPTO) and medical articles from PubMed Central® (PMC).

In this notebook, we accomplish the following:

Simple conversion of supported XML files in a nutshell
An end-to-end application using public collections of XML files supported by Docling
Setup the API access for generative AI
Fetch the data from USPTO and PubMed Central® sites, using Docling custom backends
Parse, chunk, and index the documents in a vector database
Perform RAG using LlamaIndex Docling extension
For more details on document chunking with Docling, refer to the Chunking documentation. For RAG with Docling and LlamaIndex, also check the example RAG with LlamaIndex.

Simple conversion
The XML file format defines and stores data in a format that is both human-readable and machine-readable. Because of this flexibility, Docling requires custom backend processors to interpret XML definitions and convert them into DoclingDocument objects.

Some public data collections in XML format are already supported by Docling (USTPO patents and PMC articles). In these cases, the document conversion is straightforward and the same as with any other supported format, such as PDF or HTML. The execution example in Simple Conversion is the recommended usage of Docling for a single file:

from docling.document_converter import DocumentConverter

# a sample PMC article:
source = "../../tests/data/jats/elife-56337.nxml"
converter = DocumentConverter()
result = converter.convert(source)
print(result.status)
ConversionStatus.SUCCESS
Once the document is converted, it can be exported to any format supported by Docling. For instance, to markdown (showing here the first lines only):

md_doc = result.document.export_to_markdown()

delim = "\n"
print(delim.join(md_doc.split(delim)[:8]))
# KRAB-zinc finger protein gene expansion in response to active retrotransposons in the murine lineage

Gernot Wolf, Alberto de Iaco, Ming-An Sun, Melania Bruno, Matthew Tinkham, Don Hoang, Apratim Mitra, Sherry Ralls, Didier Trono, Todd S Macfarlan

The Eunice Kennedy Shriver National Institute of Child Health and Human Development, The National Institutes of Health, Bethesda, United States; School of Life Sciences, École Polytechnique Fédérale de Lausanne (EPFL), Lausanne, Switzerland

## Abstract

If the XML file is not supported, a ConversionError message will be raised.

from io import BytesIO

from docling.datamodel.base_models import DocumentStream
from docling.exceptions import ConversionError

xml_content = (
    b'<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE docling_test SYSTEM '
    b'"test.dtd"><docling>Random content</docling>'
)
stream = DocumentStream(name="docling_test.xml", stream=BytesIO(xml_content))
try:
    result = converter.convert(stream)
except ConversionError as ce:
    print(ce)
Input document docling_test.xml does not match any allowed format.
File format not allowed: docling_test.xml
You can always refer to the Usage documentation page for a list of supported formats.

End-to-end application
This section describes a step-by-step application for processing XML files from supported public collections and use them for question-answering.

Setup
Requirements can be installed as shown below. The --no-warn-conflicts argument is meant for Colab's pre-populated Python environment, feel free to remove for stricter usage.

%pip install -q --progress-bar off --no-warn-conflicts llama-index-core llama-index-readers-docling llama-index-node-parser-docling llama-index-embeddings-huggingface llama-index-llms-huggingface-api llama-index-vector-stores-milvus llama-index-readers-file python-dotenv
Note: you may need to restart the kernel to use updated packages.
This notebook uses HuggingFace's Inference API. For an increased LLM quota, a token can be provided via the environment variable HF_TOKEN.

If you're running this notebook in Google Colab, make sure you add your API key as a secret.

import os
from warnings import filterwarnings

from dotenv import load_dotenv


def _get_env_from_colab_or_os(key):
    try:
        from google.colab import userdata

        try:
            return userdata.get(key)
        except userdata.SecretNotFoundError:
            pass
    except ImportError:
        pass
    return os.getenv(key)


load_dotenv()

filterwarnings(action="ignore", category=UserWarning, module="pydantic")
We can now define the main parameters:

from pathlib import Path
from tempfile import mkdtemp

from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.huggingface_api import HuggingFaceInferenceAPI

EMBED_MODEL_ID = "BAAI/bge-small-en-v1.5"
EMBED_MODEL = HuggingFaceEmbedding(model_name=EMBED_MODEL_ID)
TEMP_DIR = Path(mkdtemp())
MILVUS_URI = str(TEMP_DIR / "docling.db")
GEN_MODEL = HuggingFaceInferenceAPI(
    token=_get_env_from_colab_or_os("HF_TOKEN"),
    model_name="mistralai/Mixtral-8x7B-Instruct-v0.1",
)
embed_dim = len(EMBED_MODEL.get_text_embedding("hi"))
# https://github.com/huggingface/transformers/issues/5486:
os.environ["TOKENIZERS_PARALLELISM"] = "false"
Fetch the data
In this notebook we will use XML data from collections supported by Docling:

Medical articles from the PubMed Central® (PMC). They are available in an FTP server as .tar.gz files. Each file contains the full article data in XML format, among other supplementary files like images or spreadsheets.
Patents from the United States Patent and Trademark Office. They are available in the Bulk Data Storage System (BDSS) as zip files. Each zip file may contain several patents in XML format.
The raw files will be downloaded form the source and saved in a temporary directory.

PMC articles
The OA file is a manifest file of all the PMC articles, including the URL path to download the source files. In this notebook we will use as example the article Pathogens spread by high-altitude windborne mosquitoes, which is available in the archive file PMC11703268.tar.gz.

import tarfile
from io import BytesIO

import requests

# PMC article PMC11703268
url: str = "https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_package/e3/6b/PMC11703268.tar.gz"

print(f"Downloading {url}...")
buf = BytesIO(requests.get(url).content)
print("Extracting and storing the XML file containing the article text...")
with tarfile.open(fileobj=buf, mode="r:gz") as tar_file:
    for tarinfo in tar_file:
        if tarinfo.isreg():
            file_path = Path(tarinfo.name)
            if file_path.suffix == ".nxml":
                with open(TEMP_DIR / file_path.name, "wb") as file_obj:
                    file_obj.write(tar_file.extractfile(tarinfo).read())
                print(f"Stored XML file {file_path.name}")
Downloading https://ftp.ncbi.nlm.nih.gov/pub/pmc/oa_package/e3/6b/PMC11703268.tar.gz...
Extracting and storing the XML file containing the article text...
Stored XML file nihpp-2024.12.26.630351v1.nxml
USPTO patents
Since each USPTO file is a concatenation of several patents, we need to split its content into valid XML pieces. The following code downloads a sample zip file, split its content in sections, and dumps each section as an XML file. For simplicity, this pipeline is shown here in a sequential manner, but it could be parallelized.

import zipfile

# Patent grants from December 17-23, 2024
url: str = (
    "https://bulkdata.uspto.gov/data/patent/grant/redbook/fulltext/2024/ipg241217.zip"
)
XML_SPLITTER: str = '<?xml version="1.0"'
doc_num: int = 0

print(f"Downloading {url}...")
buf = BytesIO(requests.get(url).content)
print("Parsing zip file, splitting into XML sections, and exporting to files...")
with zipfile.ZipFile(buf) as zf:
    res = zf.testzip()
    if res:
        print("Error validating zip file")
    else:
        with zf.open(zf.namelist()[0]) as xf:
            is_patent = False
            patent_buffer = BytesIO()
            for xf_line in xf:
                decoded_line = xf_line.decode(errors="ignore").rstrip()
                xml_index = decoded_line.find(XML_SPLITTER)
                if xml_index != -1:
                    if (
                        xml_index > 0
                    ):  # cases like </sequence-cwu><?xml version="1.0"...
                        patent_buffer.write(xf_line[:xml_index])
                        patent_buffer.write(b"\r\n")
                        xf_line = xf_line[xml_index:]
                    if patent_buffer.getbuffer().nbytes > 0 and is_patent:
                        doc_num += 1
                        patent_id = f"ipg241217-{doc_num}"
                        with open(TEMP_DIR / f"{patent_id}.xml", "wb") as file_obj:
                            file_obj.write(patent_buffer.getbuffer())
                    is_patent = False
                    patent_buffer = BytesIO()
                elif decoded_line.startswith("<!DOCTYPE"):
                    is_patent = True
                patent_buffer.write(xf_line)
Downloading https://bulkdata.uspto.gov/data/patent/grant/redbook/fulltext/2024/ipg241217.zip...
Parsing zip file, splitting into XML sections, and exporting to files...
print(f"Fetched and exported {doc_num} documents.")
Fetched and exported 4014 documents.
Using the backend converter (optional)
The custom backend converters PubMedDocumentBackend and PatentUsptoDocumentBackend aim at handling the parsing of PMC articles and USPTO patents, respectively.
As any other backends, you can leverage the function is_valid() to check if the input document is supported by the this backend.
Note that some XML sections in the original USPTO zip file may not represent patents, like sequence listings, and therefore they will show as invalid by the backend.
from tqdm.notebook import tqdm

from docling.backend.xml.jats_backend import JatsDocumentBackend
from docling.backend.xml.uspto_backend import PatentUsptoDocumentBackend
from docling.datamodel.base_models import InputFormat
from docling.datamodel.document import InputDocument

# check PMC
in_doc = InputDocument(
    path_or_stream=TEMP_DIR / "nihpp-2024.12.26.630351v1.nxml",
    format=InputFormat.XML_JATS,
    backend=JatsDocumentBackend,
)
backend = JatsDocumentBackend(
    in_doc=in_doc, path_or_stream=TEMP_DIR / "nihpp-2024.12.26.630351v1.nxml"
)
print(f"Document {in_doc.file.name} is a valid PMC article? {backend.is_valid()}")

# check USPTO
in_doc = InputDocument(
    path_or_stream=TEMP_DIR / "ipg241217-1.xml",
    format=InputFormat.XML_USPTO,
    backend=PatentUsptoDocumentBackend,
)
backend = PatentUsptoDocumentBackend(
    in_doc=in_doc, path_or_stream=TEMP_DIR / "ipg241217-1.xml"
)
print(f"Document {in_doc.file.name} is a valid patent? {backend.is_valid()}")

patent_valid = 0
pbar = tqdm(TEMP_DIR.glob("*.xml"), total=doc_num)
for in_path in pbar:
    in_doc = InputDocument(
        path_or_stream=in_path,
        format=InputFormat.XML_USPTO,
        backend=PatentUsptoDocumentBackend,
    )
    backend = PatentUsptoDocumentBackend(in_doc=in_doc, path_or_stream=in_path)
    patent_valid += int(backend.is_valid())

print(f"Found {patent_valid} patents out of {doc_num} XML files.")
Document nihpp-2024.12.26.630351v1.nxml is a valid PMC article? True
Document ipg241217-1.xml is a valid patent? True
  0%|          | 0/4014 [00:00<?, ?it/s]
Found 3928 patents out of 4014 XML files.
Calling the function convert() will convert the input document into a DoclingDocument

doc = backend.convert()

claims_sec = next(item for item in doc.texts if item.text == "CLAIMS")
print(f'Patent "{doc.texts[0].text}" has {len(claims_sec.children)} claims')
Patent "Semiconductor package" has 19 claims
✏️ Tip: in general, there is no need to use the backend converters to parse USPTO or JATS (PubMed) XML files. The generic DocumentConverter object tries to guess the input document format and applies the corresponding backend parser. The conversion shown in Simple Conversion is the recommended usage for the supported XML files.

Parse, chunk, and index
The DoclingDocument format of the converted patents has a rich hierarchical structure, inherited from the original XML document and preserved by the Docling custom backend. In this notebook, we will leverage:

The SimpleDirectoryReader pattern to iterate over the exported XML files created in section Fetch the data.
The LlamaIndex extensions, DoclingReader and DoclingNodeParser, to ingest the patent chunks into a Milvus vector store.
The HierarchicalChunker implementation, which applies a document-based hierarchical chunking, to leverage the patent structures like sections and paragraphs within sections.
Refer to other possible implementations and usage patterns in the Chunking documentation and the RAG with LlamaIndex notebook.

Set the Docling reader and the directory reader
Note that DoclingReader uses Docling's DocumentConverter by default and therefore it will recognize the format of the XML files and leverage the PatentUsptoDocumentBackend automatically.

For demonstration purposes, we limit the scope of the analysis to the first 100 patents.

from llama_index.core import SimpleDirectoryReader
from llama_index.readers.docling import DoclingReader

reader = DoclingReader(export_type=DoclingReader.ExportType.JSON)
dir_reader = SimpleDirectoryReader(
    input_dir=TEMP_DIR,
    exclude=["docling.db", "*.nxml"],
    file_extractor={".xml": reader},
    filename_as_id=True,
    num_files_limit=100,
)
Set the node parser
Note that the HierarchicalChunker is the default chunking implementation of the DoclingNodeParser.

from llama_index.node_parser.docling import DoclingNodeParser

node_parser = DoclingNodeParser()
Set a local Milvus database and run the ingestion
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.vector_stores.milvus import MilvusVectorStore

vector_store = MilvusVectorStore(
    uri=MILVUS_URI,
    dim=embed_dim,
    overwrite=True,
)

index = VectorStoreIndex.from_documents(
    documents=dir_reader.load_data(show_progress=True),
    transformations=[node_parser],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
    embed_model=EMBED_MODEL,
    show_progress=True,
)
Finally, add the PMC article to the vector store directly from the reader.

index.from_documents(
    documents=reader.load_data(TEMP_DIR / "nihpp-2024.12.26.630351v1.nxml"),
    transformations=[node_parser],
    storage_context=StorageContext.from_defaults(vector_store=vector_store),
    embed_model=EMBED_MODEL,
)
<llama_index.core.indices.vector_store.base.VectorStoreIndex at 0x373a7f7d0>
Question-answering with RAG
The retriever can be used to identify highly relevant documents:

retriever = index.as_retriever(similarity_top_k=3)
results = retriever.retrieve("What patents are related to fitness devices?")

for item in results:
    print(item)
Node ID: 5afd36c0-a739-4a88-a51c-6d0f75358db5
Text: The portable fitness monitoring device 102 may be a device such
as, for example, a mobile phone, a personal digital assistant, a music
file player (e.g. and MP3 player), an intelligent article for wearing
(e.g. a fitness monitoring garment, wrist band, or watch), a dongle
(e.g. a small hardware device that protects software) that includes a
fitn...
Score:  0.772

Node ID: f294b5fd-9089-43cb-8c4e-d1095a634ff1
Text: US Patent Application US 20120071306 entitled “Portable
Multipurpose Whole Body Exercise Device” discloses a portable
multipurpose whole body exercise device which can be used for general
fitness, Pilates-type, core strengthening, therapeutic, and
rehabilitative exercises as well as stretching and physical therapy
and which includes storable acc...
Score:  0.749

Node ID: 8251c7ef-1165-42e1-8c91-c99c8a711bf7
Text: Program products, methods, and systems for providing fitness
monitoring services of the present invention can include any software
application executed by one or more computing devices. A computing
device can be any type of computing device having one or more
processors. For example, a computing device can be a workstation,
mobile device (e.g., ...
Score:  0.744

With the query engine, we can run the question-answering with the RAG pattern on the set of indexed documents.

First, we can prompt the LLM directly:

from llama_index.core.base.llms.types import ChatMessage, MessageRole
from rich.console import Console
from rich.panel import Panel

console = Console()
query = "Do mosquitoes in high altitude expand viruses over large distances?"

usr_msg = ChatMessage(role=MessageRole.USER, content=query)
response = GEN_MODEL.chat(messages=[usr_msg])

console.print(Panel(query, title="Prompt", border_style="bold red"))
console.print(
    Panel(
        response.message.content.strip(),
        title="Generated Content",
        border_style="bold green",
    )
)
╭──────────────────────────────────────────────────── Prompt ─────────────────────────────────────────────────────╮
│ Do mosquitoes in high altitude expand viruses over large distances?                                             │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────────────────────────────── Generated Content ───────────────────────────────────────────────╮
│ Mosquitoes can be found at high altitudes, but their ability to transmit viruses over long distances is not     │
│ primarily dependent on altitude. Mosquitoes are vectors for various diseases, such as malaria, dengue fever,    │
│ and Zika virus, and their transmission range is more closely related to their movement, the presence of a host, │
│ and environmental conditions that support their survival and reproduction.                                      │
│                                                                                                                 │
│ At high altitudes, the environment can be less suitable for mosquitoes due to factors such as colder            │
│ temperatures, lower humidity, and stronger winds, which can limit their population size and distribution.       │
│ However, some species of mosquitoes have adapted to high-altitude environments and can still transmit diseases  │
│ in these areas.                                                                                                 │
│                                                                                                                 │
│ It is possible for mosquitoes to be transported by wind or human activities to higher altitudes, but this is    │
│ not a significant factor in their ability to transmit viruses over long distances. Instead, long-distance       │
│ transmission of viruses is more often associated with human travel and transportation, which can rapidly spread │
│ infected mosquitoes or humans to new areas, leading to the spread of disease.                                   │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Now, we can compare the response when the model is prompted with the indexed PMC article as supporting context:

from llama_index.core.vector_stores import ExactMatchFilter, MetadataFilters

filters = MetadataFilters(
    filters=[
        ExactMatchFilter(key="filename", value="nihpp-2024.12.26.630351v1.nxml"),
    ]
)

query_engine = index.as_query_engine(llm=GEN_MODEL, filter=filters, similarity_top_k=3)
result = query_engine.query(query)

console.print(
    Panel(
        result.response.strip(),
        title="Generated Content with RAG",
        border_style="bold green",
    )
)
╭────────────────────────────────────────── Generated Content with RAG ───────────────────────────────────────────╮
│ Yes, mosquitoes in high altitude can expand viruses over large distances. A study intercepted 1,017 female      │
│ mosquitoes at altitudes of 120-290 m above ground over Mali and Ghana and screened them for infection with      │
│ arboviruses, plasmodia, and filariae. The study found that 3.5% of the mosquitoes were infected with            │
│ flaviviruses, and 1.1% were infectious. Additionally, the study identified 19 mosquito-borne pathogens,         │
│ including three arboviruses that affect humans (dengue, West Nile, and M’Poko viruses). The study provides      │
│ compelling evidence that mosquito-borne pathogens are often spread by windborne mosquitoes at altitude.         │
╰──────────────────────────────────────────────────────────────────────


https://docling-project.github.io/docling/examples/minimal/
https://docling-project.github.io/docling/examples/custom_convert/
https://docling-project.github.io/docling/examples/batch_convert/
https://docling-project.github.io/docling/examples/run_with_formats/
https://docling-project.github.io/docling/examples/minimal_vlm_pipeline/
https://docling-project.github.io/docling/examples/vlm_pipeline_api_model/
https://docling-project.github.io/docling/examples/compare_vlm_models/
https://docling-project.github.io/docling/examples/minimal_asr_pipeline/
https://docling-project.github.io/docling/examples/export_figures/
https://docling-project.github.io/docling/examples/export_tables/
https://docling-project.github.io/docling/examples/export_multimodal/
https://docling-project.github.io/docling/examples/full_page_ocr/
https://docling-project.github.io/docling/examples/tesseract_lang_detection/
https://docling-project.github.io/docling/examples/rapidocr_with_custom_models/
https://docling-project.github.io/docling/examples/run_with_accelerator/
https://docling-project.github.io/docling/examples/translate/
https://docling-project.github.io/docling/examples/backend_csv/
https://docling-project.github.io/docling/examples/backend_xml_rag/