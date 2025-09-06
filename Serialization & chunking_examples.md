✂️ Serialization & chunking

Serialization
Introduction
A document serializer (AKA simply serializer) is a Docling abstraction that is initialized with a given DoclingDocument and returns a textual representation for that document.

Besides the document serializer, Docling defines similar abstractions for several document subcomponents, for example: text serializer, table serializer, picture serializer, list serializer, inline serializer, and more.

Last but not least, a serializer provider is a wrapper that abstracts the document serialization strategy from the document instance.

Base classes
To enable both flexibility for downstream applications and out-of-the-box utility, Docling defines a serialization class hierarchy, providing:

base types for the above abstractions: BaseDocSerializer, as well as BaseTextSerializer, BaseTableSerializer etc, and BaseSerializerProvider, and
specific subclasses for the above-mentioned base types, e.g. MarkdownDocSerializer.
You can review all methods required to define the above base classes here.

From a client perspective, the most relevant is BaseDocSerializer.serialize(), which returns the textual representation, as well as relevant metadata on which document components contributed to that serialization.

Use in DoclingDocument export methods
Docling provides predefined serializers for Markdown, HTML, and DocTags.

The respective DoclingDocument export methods (e.g. export_to_markdown()) are provided as user shorthands — internally directly instantiating and delegating to respective serializers.

Overview
In this notebook we showcase the usage of Docling serializers.

Setup
%pip install -qU pip docling docling-core~=2.29 rich
Note: you may need to restart the kernel to use updated packages.
DOC_SOURCE = "https://arxiv.org/pdf/2311.18481"

# we set some start-stop cues for defining an excerpt to print
start_cue = "Copyright © 2024"
stop_cue = "Application of NLP to ESG"
from rich.console import Console
from rich.panel import Panel

console = Console(width=210)  # for preventing Markdown table wrapped rendering


def print_in_console(text):
    console.print(Panel(text))
Basic usage
We first convert the document:

from docling.document_converter import DocumentConverter

converter = DocumentConverter()
doc = converter.convert(source=DOC_SOURCE).document
/Users/pva/work/github.com/DS4SD/docling/.venv/lib/python3.13/site-packages/torch/utils/data/dataloader.py:683: UserWarning: 'pin_memory' argument is set as true but not supported on MPS now, then device pinned memory won't be used.
  warnings.warn(warn_msg)
We can now apply any BaseDocSerializer on the produced document.

👉 Note that, to keep the shown output brief, we only print an excerpt.

E.g. below we apply an HTMLDocSerializer:

from docling_core.transforms.serializer.html import HTMLDocSerializer

serializer = HTMLDocSerializer(doc=doc)
ser_result = serializer.serialize()
ser_text = ser_result.text

# we here only print an excerpt to keep the output brief:
print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.</p>                                                                                          │
│ <table><tbody><tr><th>Report</th><th>Question</th><th>Answer</th></tr><tr><td>IBM 2022</td><td>How many hours were spent on employee learning in 2021?</td><td>22.5 million hours</td></tr><tr><td>IBM         │
│ 2022</td><td>What was the rate of fatalities in 2021?</td><td>The rate of fatalities in 2021 was 0.0016.</td></tr><tr><td>IBM 2022</td><td>How many full audits were con- ducted in 2022 in                    │
│ India?</td><td>2</td></tr><tr><td>Starbucks 2022</td><td>What is the percentage of women in the Board of Directors?</td><td>25%</td></tr><tr><td>Starbucks 2022</td><td>What was the total energy con-         │
│ sumption in 2021?</td><td>According to the table, the total energy consumption in 2021 was 2,491,543 MWh.</td></tr><tr><td>Starbucks 2022</td><td>How much packaging material was made from renewable mate-    │
│ rials?</td><td>According to the given data, 31% of packaging materials were made from recycled or renewable materials in FY22.</td></tr></tbody></table>                                                       │
│ <p>Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.</p>                                                                                             │
│ <p>ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the   │
│ response.</p>                                                                                                                                                                                                  │
│ <h2>Related Work</h2>                                                                                                                                                                                          │
│ <p>The DocQA integrates multiple AI technologies, namely:</p>                                                                                                                                                  │
│ <p>Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric     │
│ layout analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et │
│ al. 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .  │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-</p>                        │
│ <figure><figcaption>Figure 1: System architecture: Simplified sketch of document question-answering pipeline.</figcaption></figure>                                                                            │
│ <p>based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).</p>                     │
│ <p>                                                                                                                                                                                                            │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
In the following example, we use a MarkdownDocSerializer:

from docling_core.transforms.serializer.markdown import MarkdownDocSerializer

serializer = MarkdownDocSerializer(doc=doc)
ser_result = serializer.serialize()
ser_text = ser_result.text

print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.                                                                                              │
│                                                                                                                                                                                                                │
│ | Report         | Question                                                         | Answer                                                                                                          |        │
│ |----------------|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|        │
│ | IBM 2022       | How many hours were spent on employee learning in 2021?          | 22.5 million hours                                                                                              |        │
│ | IBM 2022       | What was the rate of fatalities in 2021?                         | The rate of fatalities in 2021 was 0.0016.                                                                      |        │
│ | IBM 2022       | How many full audits were con- ducted in 2022 in India?          | 2                                                                                                               |        │
│ | Starbucks 2022 | What is the percentage of women in the Board of Directors?       | 25%                                                                                                             |        │
│ | Starbucks 2022 | What was the total energy con- sumption in 2021?                 | According to the table, the total energy consumption in 2021 was 2,491,543 MWh.                                 |        │
│ | Starbucks 2022 | How much packaging material was made from renewable mate- rials? | According to the given data, 31% of packaging materials were made from recycled or renewable materials in FY22. |        │
│                                                                                                                                                                                                                │
│ Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.                                                                                                    │
│                                                                                                                                                                                                                │
│ ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the      │
│ response.                                                                                                                                                                                                      │
│                                                                                                                                                                                                                │
│ ## Related Work                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
│ The DocQA integrates multiple AI technologies, namely:                                                                                                                                                         │
│                                                                                                                                                                                                                │
│ Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric layout │
│ analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et al.    │
│ 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .      │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-                            │
│                                                                                                                                                                                                                │
│ Figure 1: System architecture: Simplified sketch of document question-answering pipeline.                                                                                                                      │
│                                                                                                                                                                                                                │
│ <!-- image -->                                                                                                                                                                                                 │
│                                                                                                                                                                                                                │
│ based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).                            │
│                                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Configuring a serializer
Let's now assume we would like to reconfigure the Markdown serialization such that:

it uses a different component serializer, e.g. if we'd prefer tables to be printed in a triplet format (which could potentially improve the vector representation compared to Markdown tables)
it uses specific user-defined parameters, e.g. if we'd prefer a different image placeholder text than the default one
Check out the following configuration and notice the serialization differences in the output further below:

from docling_core.transforms.chunker.hierarchical_chunker import TripletTableSerializer
from docling_core.transforms.serializer.markdown import MarkdownParams

serializer = MarkdownDocSerializer(
    doc=doc,
    table_serializer=TripletTableSerializer(),
    params=MarkdownParams(
        image_placeholder="<!-- demo picture placeholder -->",
        # ...
    ),
)
ser_result = serializer.serialize()
ser_text = ser_result.text

print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.                                                                                              │
│                                                                                                                                                                                                                │
│ IBM 2022, Question = How many hours were spent on employee learning in 2021?. IBM 2022, Answer = 22.5 million hours. IBM 2022, Question = What was the rate of fatalities in 2021?. IBM 2022, Answer = The     │
│ rate of fatalities in 2021 was 0.0016.. IBM 2022, Question = How many full audits were con- ducted in 2022 in India?. IBM 2022, Answer = 2. Starbucks 2022, Question = What is the percentage of women in the  │
│ Board of Directors?. Starbucks 2022, Answer = 25%. Starbucks 2022, Question = What was the total energy con- sumption in 2021?. Starbucks 2022, Answer = According to the table, the total energy consumption  │
│ in 2021 was 2,491,543 MWh.. Starbucks 2022, Question = How much packaging material was made from renewable mate- rials?. Starbucks 2022, Answer = According to the given data, 31% of packaging materials were │
│ made from recycled or renewable materials in FY22.                                                                                                                                                             │
│                                                                                                                                                                                                                │
│ Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.                                                                                                    │
│                                                                                                                                                                                                                │
│ ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the      │
│ response.                                                                                                                                                                                                      │
│                                                                                                                                                                                                                │
│ ## Related Work                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
│ The DocQA integrates multiple AI technologies, namely:                                                                                                                                                         │
│                                                                                                                                                                                                                │
│ Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric layout │
│ analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et al.    │
│ 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .      │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-                            │
│                                                                                                                                                                                                                │
│ Figure 1: System architecture: Simplified sketch of document question-answering pipeline.                                                                                                                      │
│                                                                                                                                                                                                                │
│ <!-- demo picture placeholder -->                                                                                                                                                                              │
│                                                                                                                                                                                                                │
│ based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).                            │
│                                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Creating a custom serializer
In the examples above, we were able to reuse existing implementations for our desired serialization strategy, but let's now assume we want to define a custom serialization logic, e.g. we would like picture serialization to include any available picture description (captioning) annotations.

To that end, we first need to revisit our conversion and include all pipeline options needed for picture description enrichment.

from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    PictureDescriptionVlmOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption

pipeline_options = PdfPipelineOptions(
    do_picture_description=True,
    picture_description_options=PictureDescriptionVlmOptions(
        repo_id="HuggingFaceTB/SmolVLM-256M-Instruct",
        prompt="Describe this picture in three to five sentences. Be precise and concise.",
    ),
    generate_picture_images=True,
    images_scale=2,
)

converter = DocumentConverter(
    format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
)
doc = converter.convert(source=DOC_SOURCE).document
/Users/pva/work/github.com/DS4SD/docling/.venv/lib/python3.13/site-packages/torch/utils/data/dataloader.py:683: UserWarning: 'pin_memory' argument is set as true but not supported on MPS now, then device pinned memory won't be used.
  warnings.warn(warn_msg)
We can then define our custom picture serializer:

from typing import Any, Optional

from docling_core.transforms.serializer.base import (
    BaseDocSerializer,
    SerializationResult,
)
from docling_core.transforms.serializer.common import create_ser_result
from docling_core.transforms.serializer.markdown import (
    MarkdownParams,
    MarkdownPictureSerializer,
)
from docling_core.types.doc.document import (
    DoclingDocument,
    ImageRefMode,
    PictureDescriptionData,
    PictureItem,
)
from typing_extensions import override


class AnnotationPictureSerializer(MarkdownPictureSerializer):
    @override
    def serialize(
        self,
        *,
        item: PictureItem,
        doc_serializer: BaseDocSerializer,
        doc: DoclingDocument,
        separator: Optional[str] = None,
        **kwargs: Any,
    ) -> SerializationResult:
        text_parts: list[str] = []

        # reusing the existing result:
        parent_res = super().serialize(
            item=item,
            doc_serializer=doc_serializer,
            doc=doc,
            **kwargs,
        )
        text_parts.append(parent_res.text)

        # appending annotations:
        for annotation in item.annotations:
            if isinstance(annotation, PictureDescriptionData):
                text_parts.append(f"<!-- Picture description: {annotation.text} -->")

        text_res = (separator or "\n").join(text_parts)
        return create_ser_result(text=text_res, span_source=item)
Last but not least, we define a new doc serializer which leverages our custom picture serializer.

Notice the picture description annotations in the output below:

serializer = MarkdownDocSerializer(
    doc=doc,
    picture_serializer=AnnotationPictureSerializer(),
    params=MarkdownParams(
        image_mode=ImageRefMode.PLACEHOLDER,
        image_placeholder="",
    ),
)
ser_result = serializer.serialize()
ser_text = ser_result.text

print_in_console(ser_text[ser_text.find(start_cue) : ser_text.find(stop_cue)])
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ Copyright © 2024, Association for the Advancement of Artificial Intelligence (www.aaai.org). All rights reserved.                                                                                              │
│                                                                                                                                                                                                                │
│ | Report         | Question                                                         | Answer                                                                                                          |        │
│ |----------------|------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|        │
│ | IBM 2022       | How many hours were spent on employee learning in 2021?          | 22.5 million hours                                                                                              |        │
│ | IBM 2022       | What was the rate of fatalities in 2021?                         | The rate of fatalities in 2021 was 0.0016.                                                                      |        │
│ | IBM 2022       | How many full audits were con- ducted in 2022 in India?          | 2                                                                                                               |        │
│ | Starbucks 2022 | What is the percentage of women in the Board of Directors?       | 25%                                                                                                             |        │
│ | Starbucks 2022 | What was the total energy con- sumption in 2021?                 | According to the table, the total energy consumption in 2021 was 2,491,543 MWh.                                 |        │
│ | Starbucks 2022 | How much packaging material was made from renewable mate- rials? | According to the given data, 31% of packaging materials were made from recycled or renewable materials in FY22. |        │
│                                                                                                                                                                                                                │
│ Table 1: Example question answers from the ESG reports of IBM and Starbucks using Deep Search DocQA system.                                                                                                    │
│                                                                                                                                                                                                                │
│ ESG report in our library via our QA conversational assistant. Our assistant generates answers and also presents the information (paragraph or table), in the ESG report, from which it has generated the      │
│ response.                                                                                                                                                                                                      │
│                                                                                                                                                                                                                │
│ ## Related Work                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
│ The DocQA integrates multiple AI technologies, namely:                                                                                                                                                         │
│                                                                                                                                                                                                                │
│ Document Conversion: Converting unstructured documents, such as PDF files, into a machine-readable format is a challenging task in AI. Early strategies for document conversion were based on geometric layout │
│ analysis (Cattoni et al. 2000; Breuel 2002). Thanks to the availability of large annotated datasets (PubLayNet (Zhong et al. 2019), DocBank (Li et al. 2020), DocLayNet (Pfitzmann et al. 2022; Auer et al.    │
│ 2023), deep learning-based methods are routinely used. Modern approaches for recovering the structure of a document can be broadly divided into two categories: image-based or PDF representation-based .      │
│ Imagebased methods usually employ Transformer or CNN architectures on the images of pages (Zhang et al. 2023; Li et al. 2022; Huang et al. 2022). On the other hand, deep learning-                            │
│                                                                                                                                                                                                                │
│ Figure 1: System architecture: Simplified sketch of document question-answering pipeline.                                                                                                                      │
│ <!-- Picture description: The image depicts a document conversion process. It is a sequence of steps that includes document conversion, information retrieval, and response generation. The document           │
│ conversion step involves converting the document from a text format to a markdown format. The information retrieval step involves retrieving the document from a database or other source. The response        │
│ generation step involves generating a response from the information retrieval step. -->                                                                                                                        │
│                                                                                                                                                                                                                │
│ based language processing methods are applied on the native PDF content (generated by a single PDF printing command) (Auer et al. 2022; Livathinos et al. 2021; Staar et al. 2018).                            │
│                                                                                                                                                                                                                │
│                                                                                                                                                                                                                │
╰───────────────────────────────────────────────────────────────────



Hybrid chunking
Overview
Hybrid chunking applies tokenization-aware refinements on top of document-based hierarchical chunking.

For more details, see here.

Setup
%pip install -qU pip docling transformers
Note: you may need to restart the kernel to use updated packages.
DOC_SOURCE = "../../tests/data/md/wiki.md"
Basic usage
We first convert the document:

from docling.document_converter import DocumentConverter

doc = DocumentConverter().convert(source=DOC_SOURCE).document
For a basic chunking scenario, we can just instantiate a HybridChunker, which will use the default parameters.

from docling.chunking import HybridChunker

chunker = HybridChunker()
chunk_iter = chunker.chunk(dl_doc=doc)
Token indices sequence length is longer than the specified maximum sequence length for this model (531 > 512). Running this sequence through the model will result in indexing errors
👉 NOTE: As you see above, using the HybridChunker can sometimes lead to a warning from the transformers library, however this is a "false alarm" — for details check here.

Note that the text you would typically want to embed is the context-enriched one as returned by the contextualize() method:

for i, chunk in enumerate(chunk_iter):
    print(f"=== {i} ===")
    print(f"chunk.text:\n{f'{chunk.text[:300]}…'!r}")

    enriched_text = chunker.contextualize(chunk=chunk)
    print(f"chunker.contextualize(chunk):\n{f'{enriched_text[:300]}…'!r}")

    print()
=== 0 ===
chunk.text:
'International Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial Aver…'
chunker.contextualize(chunk):
'IBM\nInternational Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial …'

=== 1 ===
chunk.text:
'IBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine (1889);[19] and Willa…'
chunker.contextualize(chunk):
'IBM\n1910s–1950s\nIBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine (1889…'

=== 2 ===
chunk.text:
'Collectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John Henry Patterson,…'
chunker.contextualize(chunk):
'IBM\n1910s–1950s\nCollectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John …'

=== 3 ===
chunk.text:
'In 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.…'
chunker.contextualize(chunk):
'IBM\n1960s–1980s\nIn 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.…'

Configuring tokenization
For more control on the chunking, we can parametrize tokenization as shown below.

In a RAG / retrieval context, it is important to make sure that the chunker and embedding model are using the same tokenizer.

👉 HuggingFace transformers tokenizers can be used as shown in the following example:

from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from transformers import AutoTokenizer

from docling.chunking import HybridChunker

EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"
MAX_TOKENS = 64  # set to a small number for illustrative purposes

tokenizer = HuggingFaceTokenizer(
    tokenizer=AutoTokenizer.from_pretrained(EMBED_MODEL_ID),
    max_tokens=MAX_TOKENS,  # optional, by default derived from `tokenizer` for HF case
)
👉 Alternatively, OpenAI tokenizers can be used as shown in the example below (uncomment to use — requires installing docling-core[chunking-openai]):

# import tiktoken

# from docling_core.transforms.chunker.tokenizer.openai import OpenAITokenizer

# tokenizer = OpenAITokenizer(
#     tokenizer=tiktoken.encoding_for_model("gpt-4o"),
#     max_tokens=128 * 1024,  # context window length required for OpenAI tokenizers
# )
We can now instantiate our chunker:

chunker = HybridChunker(
    tokenizer=tokenizer,
    merge_peers=True,  # optional, defaults to True
)
chunk_iter = chunker.chunk(dl_doc=doc)
chunks = list(chunk_iter)
Points to notice looking at the output chunks below:

Where possible, we fit the limit of 64 tokens for the metadata-enriched serialization form (see chunk 2)
Where needed, we stop before the limit, e.g. see cases of 63 as it would otherwise run into a comma (see chunk 6)
Where possible, we merge undersized peer chunks (see chunk 0)
"Tail" chunks trailing right after merges may still be undersized (see chunk 8)
for i, chunk in enumerate(chunks):
    print(f"=== {i} ===")
    txt_tokens = tokenizer.count_tokens(chunk.text)
    print(f"chunk.text ({txt_tokens} tokens):\n{chunk.text!r}")

    ser_txt = chunker.contextualize(chunk=chunk)
    ser_tokens = tokenizer.count_tokens(ser_txt)
    print(f"chunker.contextualize(chunk) ({ser_tokens} tokens):\n{ser_txt!r}")

    print()
=== 0 ===
chunk.text (55 tokens):
'International Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial Average.'
chunker.contextualize(chunk) (56 tokens):
'IBM\nInternational Business Machines Corporation (using the trademark IBM), nicknamed Big Blue, is an American multinational technology company headquartered in Armonk, New York and present in over 175 countries.\nIt is a publicly traded company and one of the 30 companies in the Dow Jones Industrial Average.'

=== 1 ===
chunk.text (45 tokens):
'IBM is the largest industrial research organization in the world, with 19 research facilities across a dozen countries, having held the record for most annual U.S. patents generated by a business for 29 consecutive years from 1993 to 2021.'
chunker.contextualize(chunk) (46 tokens):
'IBM\nIBM is the largest industrial research organization in the world, with 19 research facilities across a dozen countries, having held the record for most annual U.S. patents generated by a business for 29 consecutive years from 1993 to 2021.'

=== 2 ===
chunk.text (63 tokens):
'IBM was founded in 1911 as the Computing-Tabulating-Recording Company (CTR), a holding company of manufacturers of record-keeping and measuring systems. It was renamed "International Business Machines" in 1924 and soon became the leading manufacturer of punch-card tabulating systems. During the 1960s and 1970s, the'
chunker.contextualize(chunk) (64 tokens):
'IBM\nIBM was founded in 1911 as the Computing-Tabulating-Recording Company (CTR), a holding company of manufacturers of record-keeping and measuring systems. It was renamed "International Business Machines" in 1924 and soon became the leading manufacturer of punch-card tabulating systems. During the 1960s and 1970s, the'

=== 3 ===
chunk.text (44 tokens):
"IBM mainframe, exemplified by the System/360, was the world's dominant computing platform, with the company producing 80 percent of computers in the U.S. and 70 percent of computers worldwide.[11]"
chunker.contextualize(chunk) (45 tokens):
"IBM\nIBM mainframe, exemplified by the System/360, was the world's dominant computing platform, with the company producing 80 percent of computers in the U.S. and 70 percent of computers worldwide.[11]"

=== 4 ===
chunk.text (63 tokens):
'IBM debuted in the microcomputer market in 1981 with the IBM Personal Computer, — its DOS software provided by Microsoft, — which became the basis for the majority of personal computers to the present day.[12] The company later also found success in the portable space with the ThinkPad. Since the 1990s,'
chunker.contextualize(chunk) (64 tokens):
'IBM\nIBM debuted in the microcomputer market in 1981 with the IBM Personal Computer, — its DOS software provided by Microsoft, — which became the basis for the majority of personal computers to the present day.[12] The company later also found success in the portable space with the ThinkPad. Since the 1990s,'

=== 5 ===
chunk.text (61 tokens):
'IBM has concentrated on computer services, software, supercomputers, and scientific research; it sold its microcomputer division to Lenovo in 2005. IBM continues to develop mainframes, and its supercomputers have consistently ranked among the most powerful in the world in the 21st century.'
chunker.contextualize(chunk) (62 tokens):
'IBM\nIBM has concentrated on computer services, software, supercomputers, and scientific research; it sold its microcomputer division to Lenovo in 2005. IBM continues to develop mainframes, and its supercomputers have consistently ranked among the most powerful in the world in the 21st century.'

=== 6 ===
chunk.text (62 tokens):
"As one of the world's oldest and largest technology companies, IBM has been responsible for several technological innovations, including the automated teller machine (ATM), dynamic random-access memory (DRAM), the floppy disk, the hard disk drive, the magnetic stripe card, the relational database, the SQL programming"
chunker.contextualize(chunk) (63 tokens):
"IBM\nAs one of the world's oldest and largest technology companies, IBM has been responsible for several technological innovations, including the automated teller machine (ATM), dynamic random-access memory (DRAM), the floppy disk, the hard disk drive, the magnetic stripe card, the relational database, the SQL programming"

=== 7 ===
chunk.text (63 tokens):
'language, and the UPC barcode. The company has made inroads in advanced computer chips, quantum computing, artificial intelligence, and data infrastructure.[13][14][15] IBM employees and alumni have won various recognitions for their scientific research and inventions, including six Nobel Prizes and six Turing'
chunker.contextualize(chunk) (64 tokens):
'IBM\nlanguage, and the UPC barcode. The company has made inroads in advanced computer chips, quantum computing, artificial intelligence, and data infrastructure.[13][14][15] IBM employees and alumni have won various recognitions for their scientific research and inventions, including six Nobel Prizes and six Turing'

=== 8 ===
chunk.text (5 tokens):
'Awards.[16]'
chunker.contextualize(chunk) (6 tokens):
'IBM\nAwards.[16]'

=== 9 ===
chunk.text (56 tokens):
'IBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine'
chunker.contextualize(chunk) (60 tokens):
'IBM\n1910s–1950s\nIBM originated with several technological innovations developed and commercialized in the late 19th century. Julius E. Pitrap patented the computing scale in 1885;[17] Alexander Dey invented the dial recorder (1888);[18] Herman Hollerith patented the Electric Tabulating Machine'

=== 10 ===
chunk.text (60 tokens):
"(1889);[19] and Willard Bundy invented a time clock to record workers' arrival and departure times on a paper tape (1889).[20] On June 16, 1911, their four companies were amalgamated in New York State by Charles Ranlett Flint forming a fifth company, the"
chunker.contextualize(chunk) (64 tokens):
"IBM\n1910s–1950s\n(1889);[19] and Willard Bundy invented a time clock to record workers' arrival and departure times on a paper tape (1889).[20] On June 16, 1911, their four companies were amalgamated in New York State by Charles Ranlett Flint forming a fifth company, the"

=== 11 ===
chunk.text (59 tokens):
'Computing-Tabulating-Recording Company (CTR) based in Endicott, New York.[1][21] The five companies had 1,300 employees and offices and plants in Endicott and Binghamton, New York; Dayton, Ohio; Detroit, Michigan; Washington,'
chunker.contextualize(chunk) (63 tokens):
'IBM\n1910s–1950s\nComputing-Tabulating-Recording Company (CTR) based in Endicott, New York.[1][21] The five companies had 1,300 employees and offices and plants in Endicott and Binghamton, New York; Dayton, Ohio; Detroit, Michigan; Washington,'

=== 12 ===
chunk.text (13 tokens):
'D.C.; and Toronto, Canada.[22]'
chunker.contextualize(chunk) (17 tokens):
'IBM\n1910s–1950s\nD.C.; and Toronto, Canada.[22]'

=== 13 ===
chunk.text (60 tokens):
'Collectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John Henry Patterson, called'
chunker.contextualize(chunk) (64 tokens):
'IBM\n1910s–1950s\nCollectively, the companies manufactured a wide array of machinery for sale and lease, ranging from commercial scales and industrial time recorders, meat and cheese slicers, to tabulators and punched cards. Thomas J. Watson, Sr., fired from the National Cash Register Company by John Henry Patterson, called'

=== 14 ===
chunk.text (59 tokens):
"on Flint and, in 1914, was offered a position at CTR.[23] Watson joined CTR as general manager and then, 11 months later, was made President when antitrust cases relating to his time at NCR were resolved.[24] Having learned Patterson's pioneering business"
chunker.contextualize(chunk) (63 tokens):
"IBM\n1910s–1950s\non Flint and, in 1914, was offered a position at CTR.[23] Watson joined CTR as general manager and then, 11 months later, was made President when antitrust cases relating to his time at NCR were resolved.[24] Having learned Patterson's pioneering business"

=== 15 ===
chunk.text (23 tokens):
"practices, Watson proceeded to put the stamp of NCR onto CTR's companies.[23]:\n105"
chunker.contextualize(chunk) (27 tokens):
"IBM\n1910s–1950s\npractices, Watson proceeded to put the stamp of NCR onto CTR's companies.[23]:\n105"

=== 16 ===
chunk.text (59 tokens):
'He implemented sales conventions, "generous sales incentives, a focus on customer service, an insistence on well-groomed, dark-suited salesmen and had an evangelical fervor for instilling company pride and loyalty in every worker".[25][26] His favorite slogan,'
chunker.contextualize(chunk) (63 tokens):
'IBM\n1910s–1950s\nHe implemented sales conventions, "generous sales incentives, a focus on customer service, an insistence on well-groomed, dark-suited salesmen and had an evangelical fervor for instilling company pride and loyalty in every worker".[25][26] His favorite slogan,'

=== 17 ===
chunk.text (60 tokens):
'"THINK", became a mantra for each company\'s employees.[25] During Watson\'s first four years, revenues reached $9 million ($158 million today) and the company\'s operations expanded to Europe, South America, Asia and Australia.[25] Watson never liked the'
chunker.contextualize(chunk) (64 tokens):
'IBM\n1910s–1950s\n"THINK", became a mantra for each company\'s employees.[25] During Watson\'s first four years, revenues reached $9 million ($158 million today) and the company\'s operations expanded to Europe, South America, Asia and Australia.[25] Watson never liked the'

=== 18 ===
chunk.text (57 tokens):
'clumsy hyphenated name "Computing-Tabulating-Recording Company" and chose to replace it with the more expansive title "International Business Machines" which had previously been used as the name of CTR\'s Canadian Division;[27] the name was changed on February 14,'
chunker.contextualize(chunk) (61 tokens):
'IBM\n1910s–1950s\nclumsy hyphenated name "Computing-Tabulating-Recording Company" and chose to replace it with the more expansive title "International Business Machines" which had previously been used as the name of CTR\'s Canadian Division;[27] the name was changed on February 14,'

=== 19 ===
chunk.text (21 tokens):
'1924.[28] By 1933, most of the subsidiaries had been merged into one company, IBM.'
chunker.contextualize(chunk) (25 tokens):
'IBM\n1910s–1950s\n1924.[28] By 1933, most of the subsidiaries had been merged into one company, IBM.'

=== 20 ===
chunk.text (22 tokens):
'In 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.'
chunker.contextualize(chunk) (26 tokens):
'IBM\n1960s–1980s\nIn 1961, IBM developed the SABRE reservation system for American Airlines and introduced the highly successful Selectric typewriter.'




Advanced chunking & serialization
Overview
In this notebook we show how to customize the serialization strategies that come into play during chunking.

Setup
We will work with a document that contains some picture annotations:

from docling_core.types.doc.document import DoclingDocument

SOURCE = "./data/2408.09869v3_enriched.json"

doc = DoclingDocument.load_from_json(SOURCE)
Below we define the chunker (for more details check out Hybrid Chunking):

from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling_core.transforms.chunker.tokenizer.base import BaseTokenizer
from docling_core.transforms.chunker.tokenizer.huggingface import HuggingFaceTokenizer
from transformers import AutoTokenizer

EMBED_MODEL_ID = "sentence-transformers/all-MiniLM-L6-v2"

tokenizer: BaseTokenizer = HuggingFaceTokenizer(
    tokenizer=AutoTokenizer.from_pretrained(EMBED_MODEL_ID),
)
chunker = HybridChunker(tokenizer=tokenizer)
print(f"{tokenizer.get_max_tokens()=}")
tokenizer.get_max_tokens()=512
Defining some helper methods:

from typing import Iterable, Optional

from docling_core.transforms.chunker.base import BaseChunk
from docling_core.transforms.chunker.hierarchical_chunker import DocChunk
from docling_core.types.doc.labels import DocItemLabel
from rich.console import Console
from rich.panel import Panel

console = Console(
    width=200,  # for getting Markdown tables rendered nicely
)


def find_n_th_chunk_with_label(
    iter: Iterable[BaseChunk], n: int, label: DocItemLabel
) -> Optional[DocChunk]:
    num_found = -1
    for i, chunk in enumerate(iter):
        doc_chunk = DocChunk.model_validate(chunk)
        for it in doc_chunk.meta.doc_items:
            if it.label == label:
                num_found += 1
                if num_found == n:
                    return i, chunk
    return None, None


def print_chunk(chunks, chunk_pos):
    chunk = chunks[chunk_pos]
    ctx_text = chunker.contextualize(chunk=chunk)
    num_tokens = tokenizer.count_tokens(text=ctx_text)
    doc_items_refs = [it.self_ref for it in chunk.meta.doc_items]
    title = f"{chunk_pos=} {num_tokens=} {doc_items_refs=}"
    console.print(Panel(ctx_text, title=title))
Table serialization
Using the default strategy
Below we inspect the first chunk containing a table — using the default serialization strategy:

chunker = HybridChunker(tokenizer=tokenizer)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.TABLE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
Token indices sequence length is longer than the specified maximum sequence length for this model (652 > 512). Running this sequence through the model will result in indexing errors
╭────────────────────────────────────────────────────────────── chunk_pos=13 num_tokens=426 doc_items_refs=['#/texts/72', '#/tables/0'] ───────────────────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ 4 Performance                                                                                                                                                                                        │
│ Table 1: Runtime characteristics of Docling with the standard model pipeline and settings, on our test dataset of 225 pages, on two different systems. OCR is disabled. We show the time-to-solution │
│ (TTS), computed throughput in pages per second, and the peak memory used (resident set size) for both the Docling-native PDF backend and for the pypdfium backend, using 4 and 16 threads.           │
│                                                                                                                                                                                                      │
│ Apple M3 Max, Thread budget. = 4. Apple M3 Max, native backend.TTS = 177 s 167 s. Apple M3 Max, native backend.Pages/s = 1.27 1.34. Apple M3 Max, native backend.Mem = 6.20 GB. Apple M3 Max,        │
│ pypdfium backend.TTS = 103 s 92 s. Apple M3 Max, pypdfium backend.Pages/s = 2.18 2.45. Apple M3 Max, pypdfium backend.Mem = 2.56 GB. (16 cores) Intel(R) Xeon E5-2690, Thread budget. = 16 4 16. (16 │
│ cores) Intel(R) Xeon E5-2690, native backend.TTS = 375 s 244 s. (16 cores) Intel(R) Xeon E5-2690, native backend.Pages/s = 0.60 0.92. (16 cores) Intel(R) Xeon E5-2690, native backend.Mem = 6.16    │
│ GB. (16 cores) Intel(R) Xeon E5-2690, pypdfium backend.TTS = 239 s 143 s. (16 cores) Intel(R) Xeon E5-2690, pypdfium backend.Pages/s = 0.94 1.57. (16 cores) Intel(R) Xeon E5-2690, pypdfium         │
│ backend.Mem = 2.42 GB                                                                                                                                                                                │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
INFO: As you see above, using the HybridChunker can sometimes lead to a warning from the transformers library, however this is a "false alarm" — for details check here.
Configuring a different strategy
We can configure a different serialization strategy. In the example below, we specify a different table serializer that serializes tables to Markdown instead of the triplet notation used by default:

from docling_core.transforms.chunker.hierarchical_chunker import (
    ChunkingDocSerializer,
    ChunkingSerializerProvider,
)
from docling_core.transforms.serializer.markdown import MarkdownTableSerializer


class MDTableSerializerProvider(ChunkingSerializerProvider):
    def get_serializer(self, doc):
        return ChunkingDocSerializer(
            doc=doc,
            table_serializer=MarkdownTableSerializer(),  # configuring a different table serializer
        )


chunker = HybridChunker(
    tokenizer=tokenizer,
    serializer_provider=MDTableSerializerProvider(),
)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.TABLE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
╭────────────────────────────────────────────────────────────── chunk_pos=13 num_tokens=431 doc_items_refs=['#/texts/72', '#/tables/0'] ───────────────────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ 4 Performance                                                                                                                                                                                        │
│ Table 1: Runtime characteristics of Docling with the standard model pipeline and settings, on our test dataset of 225 pages, on two different systems. OCR is disabled. We show the time-to-solution │
│ (TTS), computed throughput in pages per second, and the peak memory used (resident set size) for both the Docling-native PDF backend and for the pypdfium backend, using 4 and 16 threads.           │
│                                                                                                                                                                                                      │
│ | CPU                              | Thread budget   | native backend   | native backend   | native backend   | pypdfium backend   | pypdfium backend   | pypdfium backend   |                       │
│ |----------------------------------|-----------------|------------------|------------------|------------------|--------------------|--------------------|--------------------|                       │
│ |                                  |                 | TTS              | Pages/s          | Mem              | TTS                | Pages/s            | Mem                |                       │
│ | Apple M3 Max                     | 4               | 177 s 167 s      | 1.27 1.34        | 6.20 GB          | 103 s 92 s         | 2.18 2.45          | 2.56 GB            |                       │
│ | (16 cores) Intel(R) Xeon E5-2690 | 16 4 16         | 375 s 244 s      | 0.60 0.92        | 6.16 GB          | 239 s 143 s        | 0.94 1.57          | 2.42 GB            |                       │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Picture serialization
Using the default strategy
Below we inspect the first chunk containing a picture.

Even when using the default strategy, we can modify the relevant parameters, e.g. which placeholder is used for pictures:

from docling_core.transforms.serializer.markdown import MarkdownParams


class ImgPlaceholderSerializerProvider(ChunkingSerializerProvider):
    def get_serializer(self, doc):
        return ChunkingDocSerializer(
            doc=doc,
            params=MarkdownParams(
                image_placeholder="<!-- image -->",
            ),
        )


chunker = HybridChunker(
    tokenizer=tokenizer,
    serializer_provider=ImgPlaceholderSerializerProvider(),
)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.PICTURE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
╭───────────────────────────────────────────────── chunk_pos=0 num_tokens=117 doc_items_refs=['#/pictures/0', '#/texts/2', '#/texts/3', '#/texts/4'] ──────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ <!-- image -->                                                                                                                                                                                       │
│ Version 1.0                                                                                                                                                                                          │
│ Christoph Auer Maksym Lysak Ahmed Nassar Michele Dolfi Nikolaos Livathinos Panos Vagenas Cesar Berrospi Ramis Matteo Omenetti Fabian Lindlbauer Kasper Dinkla Lokesh Mishra Yusik Kim Shubham Gupta  │
│ Rafael Teixeira de Lima Valery Weber Lucas Morin Ingmar Meijer Viktor Kuropiatnyk Peter W. J. Staar                                                                                                  │
│ AI4K Group, IBM Research R¨ uschlikon, Switzerland                                                                                                                                                   │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
Using a custom strategy
Below we define and use our custom picture serialization strategy which leverages picture annotations:

from typing import Any

from docling_core.transforms.serializer.base import (
    BaseDocSerializer,
    SerializationResult,
)
from docling_core.transforms.serializer.common import create_ser_result
from docling_core.transforms.serializer.markdown import MarkdownPictureSerializer
from docling_core.types.doc.document import (
    PictureClassificationData,
    PictureDescriptionData,
    PictureItem,
    PictureMoleculeData,
)
from typing_extensions import override


class AnnotationPictureSerializer(MarkdownPictureSerializer):
    @override
    def serialize(
        self,
        *,
        item: PictureItem,
        doc_serializer: BaseDocSerializer,
        doc: DoclingDocument,
        **kwargs: Any,
    ) -> SerializationResult:
        text_parts: list[str] = []
        for annotation in item.annotations:
            if isinstance(annotation, PictureClassificationData):
                predicted_class = (
                    annotation.predicted_classes[0].class_name
                    if annotation.predicted_classes
                    else None
                )
                if predicted_class is not None:
                    text_parts.append(f"Picture type: {predicted_class}")
            elif isinstance(annotation, PictureMoleculeData):
                text_parts.append(f"SMILES: {annotation.smi}")
            elif isinstance(annotation, PictureDescriptionData):
                text_parts.append(f"Picture description: {annotation.text}")

        text_res = "\n".join(text_parts)
        text_res = doc_serializer.post_process(text=text_res)
        return create_ser_result(text=text_res, span_source=item)
class ImgAnnotationSerializerProvider(ChunkingSerializerProvider):
    def get_serializer(self, doc: DoclingDocument):
        return ChunkingDocSerializer(
            doc=doc,
            picture_serializer=AnnotationPictureSerializer(),  # configuring a different picture serializer
        )


chunker = HybridChunker(
    tokenizer=tokenizer,
    serializer_provider=ImgAnnotationSerializerProvider(),
)

chunk_iter = chunker.chunk(dl_doc=doc)

chunks = list(chunk_iter)
i, chunk = find_n_th_chunk_with_label(chunks, n=0, label=DocItemLabel.PICTURE)
print_chunk(
    chunks=chunks,
    chunk_pos=i,
)
╭───────────────────────────────────────────────── chunk_pos=0 num_tokens=128 doc_items_refs=['#/pictures/0', '#/texts/2', '#/texts/3', '#/texts/4'] ──────────────────────────────────────────────────╮
│ Docling Technical Report                                                                                                                                                                             │
│ Picture description: In this image we can see a cartoon image of a duck holding a paper.                                                                                                             │
│ Version 1.0                                                                                                                                                                                          │
│ Christoph Auer Maksym Lysak Ahmed Nassar Michele Dolfi Nikolaos Livathinos Panos Vagenas Cesar Berrospi Ramis Matteo Omenetti Fabian Lindlbauer Kasper Dinkla Lokesh Mishra Yusik Kim Shubham Gupta  │
│ Rafael Teixeira de Lima Valery Weber Lucas Morin Ingmar Meijer Viktor Kuropiatnyk Peter W. J. Staar                                                                                                  │
│ AI4K Group, IBM Research R¨ uschlikon, Switzerland                                                                                                                                                   │
╰───────────────────────────────────────────────────────────────────