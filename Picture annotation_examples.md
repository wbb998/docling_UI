Picture annotation

Annotate picture with local VLM
Open In Colab

%pip install -q docling[vlm] ipython
Note: you may need to restart the kernel to use updated packages.
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
# The source document
DOC_SOURCE = "https://arxiv.org/pdf/2501.17887"
Describe pictures with Granite Vision
This section will run locally the ibm-granite/granite-vision-3.1-2b-preview model to describe the pictures of the document.

from docling.datamodel.pipeline_options import granite_picture_description

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True
pipeline_options.picture_description_options = (
    granite_picture_description  # <-- the model choice
)
pipeline_options.picture_description_options.prompt = (
    "Describe the image in three sentences. Be consise and accurate."
)
pipeline_options.images_scale = 2.0
pipeline_options.generate_picture_images = True

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
        )
    }
)
doc = converter.convert(DOC_SOURCE).document
Using a slow image processor as `use_fast` is unset and a slow processor was saved with this model. `use_fast=True` will be the default behavior in v4.48, even if the model was saved with a slow processor. This will result in minor differences in outputs. You'll still be able to use a slow processor with `use_fast=False`.
Loading checkpoint shards:   0%|          | 0/2 [00:00<?, ?it/s]
from docling_core.types.doc.document import PictureDescriptionData
from IPython import display

html_buffer = []
# display the first 5 pictures and their captions and annotations:
for pic in doc.pictures[:5]:
    html_item = (
        f"<h3>Picture <code>{pic.self_ref}</code></h3>"
        f'<img src="{pic.image.uri!s}" /><br />'
        f"<h4>Caption</h4>{pic.caption_text(doc=doc)}<br />"
    )
    for annotation in pic.annotations:
        if not isinstance(annotation, PictureDescriptionData):
            continue
        html_item += (
            f"<h4>Annotations ({annotation.provenance})</h4>{annotation.text}<br />\n"
        )
    html_buffer.append(html_item)
display.HTML("<hr />".join(html_buffer))
Picture #/pictures/0
No description has been provided for this image
Caption
Figure 1: Sketch of Docling's pipelines and usage model. Both PDF pipeline and simple pipeline build up a DoclingDocument representation, which can be further enriched. Downstream applications can utilize Docling's API to inspect, export, or chunk the document for various purposes.
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a poster with some text and images.
Picture #/pictures/1
No description has been provided for this image
Caption
Figure 2: Dataset categories and sample counts for documents and pages.
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a pie chart. In the pie chart we can see the categories and the number of documents in each category.
Picture #/pictures/2
No description has been provided for this image
Caption
Figure 3: Distribution of conversion times for all documents, ordered by number of pages in a document, on all system configurations. Every dot represents one document. Log/log scale is used to even the spacing, since both number of pages and conversion times have long-tail distributions.
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a graph. On the x-axis we can see the number of pages. On the y-axis we can see the seconds.
Picture #/pictures/3
No description has been provided for this image
Caption
Figure 4: Contributions of PDF backend and AI models to the conversion time of a page (in seconds per page). Lower is better. Left: Ranges of time contributions for each model to pages it was applied on (i.e., OCR was applied only on pages with bitmaps, table structure was applied only on pages with tables). Right: Average time contribution to a page in the benchmark dataset (factoring in zero-time contribution for OCR and table structure models on pages without bitmaps or tables) .
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a bar chart and a line chart. In the bar chart we can see the values of Pdf Parse, OCR, Layout, Table Structure, Page Total and Page. In the line chart we can see the values of Pdf Parse, OCR, Layout, Table Structure, Page Total and Page.
Picture #/pictures/4
No description has been provided for this image
Caption
Figure 5: Conversion time in seconds per page on our dataset in three scenarios, across all assets and system configurations. Lower bars are better. The configuration includes OCR and table structure recognition ( fast table option on Docling and MinerU, hi res in unstructured, as shown in table 1).
Annotations (ibm-granite/granite-vision-3.1-2b-preview)
In this image we can see a bar chart. In the chart we can see the CPU, Max, GPU, and sec/page.
Describe pictures with SmolVLM
This section will run locally the HuggingFaceTB/SmolVLM-256M-Instruct model to describe the pictures of the document.

from docling.datamodel.pipeline_options import smolvlm_picture_description

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True
pipeline_options.picture_description_options = (
    smolvlm_picture_description  # <-- the model choice
)
pipeline_options.picture_description_options.prompt = (
    "Describe the image in three sentences. Be consise and accurate."
)
pipeline_options.images_scale = 2.0
pipeline_options.generate_picture_images = True

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
        )
    }
)
doc = converter.convert(DOC_SOURCE).document
from docling_core.types.doc.document import PictureDescriptionData
from IPython import display

html_buffer = []
# display the first 5 pictures and their captions and annotations:
for pic in doc.pictures[:5]:
    html_item = (
        f"<h3>Picture <code>{pic.self_ref}</code></h3>"
        f'<img src="{pic.image.uri!s}" /><br />'
        f"<h4>Caption</h4>{pic.caption_text(doc=doc)}<br />"
    )
    for annotation in pic.annotations:
        if not isinstance(annotation, PictureDescriptionData):
            continue
        html_item += (
            f"<h4>Annotations ({annotation.provenance})</h4>{annotation.text}<br />\n"
        )
    html_buffer.append(html_item)
display.HTML("<hr />".join(html_buffer))
Picture #/pictures/0
No description has been provided for this image
Caption
Figure 1: Sketch of Docling's pipelines and usage model. Both PDF pipeline and simple pipeline build up a DoclingDocument representation, which can be further enriched. Downstream applications can utilize Docling's API to inspect, export, or chunk the document for various purposes.
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
This is a page that has different types of documents on it.
Picture #/pictures/1
No description has been provided for this image
Caption
Figure 2: Dataset categories and sample counts for documents and pages.
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
Here is a page-by-page list of documents per category: - Science - Articles - Law and Regulations - Articles - Misc.
Picture #/pictures/2
No description has been provided for this image
Caption
Figure 3: Distribution of conversion times for all documents, ordered by number of pages in a document, on all system configurations. Every dot represents one document. Log/log scale is used to even the spacing, since both number of pages and conversion times have long-tail distributions.
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
The image is a bar chart that shows the number of pages of a website as a function of the number of pages of the website. The x-axis represents the number of pages, ranging from 100 to 10,000. The y-axis represents the number of pages, ranging from 100 to 10,000. The chart is labeled "Number of pages" and has a legend at the top of the chart that indicates the number of pages. The chart shows a clear trend: as the number of pages increases, the number of pages decreases. This is evident from the following points: - The number of pages increases from 100 to 1000. - The number of pages decreases from 1000 to 10,000. - The number of pages increases from 10,000 to 10,000.
Picture #/pictures/3
No description has been provided for this image
Caption
Figure 4: Contributions of PDF backend and AI models to the conversion time of a page (in seconds per page). Lower is better. Left: Ranges of time contributions for each model to pages it was applied on (i.e., OCR was applied only on pages with bitmaps, table structure was applied only on pages with tables). Right: Average time contribution to a page in the benchmark dataset (factoring in zero-time contribution for OCR and table structure models on pages without bitmaps or tables) .
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
bar chart with different colored bars representing different data points.
Picture #/pictures/4
No description has been provided for this image
Caption
Figure 5: Conversion time in seconds per page on our dataset in three scenarios, across all assets and system configurations. Lower bars are better. The configuration includes OCR and table structure recognition ( fast table option on Docling and MinerU, hi res in unstructured, as shown in table 1).
Annotations (HuggingFaceTB/SmolVLM-256M-Instruct)
A bar chart with the following information: - The x-axis represents the number of pages, ranging from 0 to 14. - The y-axis represents the page count, ranging from 0 to 14. - The chart has three categories: Marker, Unstructured, and Detailed. - The x-axis is labeled "see/page." - The y-axis is labeled "Page Count." - The chart shows that the Marker category has the highest number of pages, followed by the Unstructured category, and then the Detailed category.
Use other vision models
The examples above can also be reproduced using other vision model. The Docling options PictureDescriptionVlmOptions allows to specify your favorite vision model from the Hugging Face Hub.

from docling.datamodel.pipeline_options import PictureDescriptionVlmOptions

pipeline_options = PdfPipelineOptions()
pipeline_options.do_picture_description = True
pipeline_options.picture_description_options = PictureDescriptionVlmOptions(
    repo_id="",  # <-- add here the Hugging Face repo_id of your favorite VLM
    prompt="Describe the image in three sentences. Be consise and accurate.",
)
pipeline_options.images_scale = 2.0
pipeline_options.generate_picture_images = True

converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(
            pipeline_options=pipeline_options,
        )
    }
)

# Uncomment to run:
# doc = converter.convert(DOC_SOURCE).document




Annotate picture with remote VLM
import logging
import os
from pathlib import Path
import requests
from docling_core.types.doc import PictureItem
from dotenv import load_dotenv
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    PictureDescriptionApiOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
Example of PictureDescriptionApiOptions definitions
Using vLLM
Models can be launched via: $ vllm serve MODEL_NAME

def vllm_local_options(model: str):
    options = PictureDescriptionApiOptions(
        url="http://localhost:8000/v1/chat/completions",
        params=dict(
            model=model,
            seed=42,
            max_completion_tokens=200,
        ),
        prompt="Describe the image in three sentences. Be consise and accurate.",
        timeout=90,
    )
    return options
Using LM Studio
def lms_local_options(model: str):
    options = PictureDescriptionApiOptions(
        url="http://localhost:1234/v1/chat/completions",
        params=dict(
            model=model,
            seed=42,
            max_completion_tokens=200,
        ),
        prompt="Describe the image in three sentences. Be consise and accurate.",
        timeout=90,
    )
    return options
Using a cloud service like IBM watsonx.ai
def watsonx_vlm_options():
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

    options = PictureDescriptionApiOptions(
        url="https://us-south.ml.cloud.ibm.com/ml/v1/text/chat?version=2023-05-29",
        params=dict(
            model_id="ibm/granite-vision-3-2-2b",
            project_id=project_id,
            parameters=dict(
                max_new_tokens=400,
            ),
        ),
        headers={
            "Authorization": "Bearer " + _get_iam_access_token(api_key=api_key),
        },
        prompt="Describe the image in three sentences. Be consise and accurate.",
        timeout=60,
    )
    return options
Usage and conversion
def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = Path(__file__).parent / "../../tests/data"
    input_doc_path = data_folder / "pdf/2206.01062.pdf"

    pipeline_options = PdfPipelineOptions(
        enable_remote_services=True  # <-- this is required!
    )
    pipeline_options.do_picture_description = True

    # The PictureDescriptionApiOptions() allows to interface with APIs supporting
    # the multi-modal chat interface. Here follow a few example on how to configure those.
    #
    # One possibility is self-hosting model, e.g. via VLLM.
    # $ vllm serve MODEL_NAME
    # Then PictureDescriptionApiOptions can point to the localhost endpoint.

    # Example for the Granite Vision model:
    # (uncomment the following lines)
    # pipeline_options.picture_description_options = vllm_local_options(
    #     model="ibm-granite/granite-vision-3.3-2b"
    # )

    # Example for the SmolVLM model:
    # (uncomment the following lines)
    # pipeline_options.picture_description_options = vllm_local_options(
    #     model="HuggingFaceTB/SmolVLM-256M-Instruct"
    # )

    # For using models on LM Studio using the built-in GGUF or MLX runtimes, e.g. the SmolVLM model:
    # (uncomment the following lines)
    pipeline_options.picture_description_options = lms_local_options(
        model="smolvlm-256m-instruct"
    )

    # Another possibility is using online services, e.g. watsonx.ai.
    # Using requires setting the env variables WX_API_KEY and WX_PROJECT_ID.
    # (uncomment the following lines)
    # pipeline_options.picture_description_options = watsonx_vlm_options()

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
            )
        }
    )
    result = doc_converter.convert(input_doc_path)

    for element, _level in result.document.iterate_items():
        if isinstance(element, PictureItem):
            print(
                f"Picture {element.self_ref}\n"
                f"Caption: {element.caption_text(doc=result.document)}\n"
                f"Annotations: {element.annotations}"
            )
if __name__ == "__main__":
    main()