Information extraction
👉 NOTE: The extraction API is currently in beta and may change without prior notice.

Docling provides the capability of extracting information, i.e. structured data, from unstructured documents.

The user can provide the desired data schema AKA template, either as a dictionary or as a Pydantic model, and Docling will return the extracted data as a standardized output, organized by page.

Check out the subsections below for different usage scenarios.

from IPython import display
from pydantic import BaseModel, Field
from rich import print
In this notebook, we will work with an example input image — let's quickly inspect it:

file_path = (
    "https://upload.wikimedia.org/wikipedia/commons/9/9f/Swiss_QR-Bill_example.jpg"
)
display.HTML(f"<img src='{file_path}' height='1000'>")
No description has been provided for this image
Defining the extractor
Let's first define our extractor:

from docling.datamodel.base_models import InputFormat
from docling.document_extractor import DocumentExtractor

extractor = DocumentExtractor(allowed_formats=[InputFormat.IMAGE, InputFormat.PDF])
Following, we look at different ways to define the data template.

Using a string template
result = extractor.extract(
    source=file_path,
    template='{"bill_no": "string", "total": "float"}',
)
print(result.pages)
/Users/pva/work/github.com/DS4SD/docling/docling/document_extractor.py:143: UserWarning: The extract API is currently experimental and may change without prior notice.
Only PDF and image formats are supported.
  return next(all_res)
You have video processor config saved in `preprocessor.json` file which is deprecated. Video processor configs should be saved in their own `video_preprocessor.json` file. You can rename the file or load and save the processor back which renames it automatically. Loading from `preprocessor.json` will be removed in v5.0.
The following generation flags are not valid and may be ignored: ['temperature', 'top_p', 'top_k']. Set `TRANSFORMERS_VERBOSITY=info` for more details.
[
    ExtractedPageData(
        page_no=1,
        extracted_data={'bill_no': '3139', 'total': 3949.75},
        raw_text='{"bill_no": "3139", "total": 3949.75}',
        errors=[]
    )
]
Using a dict template
result = extractor.extract(
    source=file_path,
    template={
        "bill_no": "string",
        "total": "float",
    },
)
print(result.pages)
The following generation flags are not valid and may be ignored: ['temperature', 'top_p', 'top_k']. Set `TRANSFORMERS_VERBOSITY=info` for more details.
[
    ExtractedPageData(
        page_no=1,
        extracted_data={'bill_no': '3139', 'total': 3949.75},
        raw_text='{"bill_no": "3139", "total": 3949.75}',
        errors=[]
    )
]
Using a Pydantic model template
First we define the Pydantic model we want to use

from typing import Optional


class Invoice(BaseModel):
    bill_no: str = Field(
        examples=["A123", "5414"]
    )  # provide some examples, but no default value
    total: float = Field(
        default=10, examples=[20]
    )  # provide some examples and a default value
    tax_id: Optional[str] = Field(default=None, examples=["1234567890"])
The class itself can then be used directly as the template:

result = extractor.extract(
    source=file_path,
    template=Invoice,
)
print(result.pages)
The following generation flags are not valid and may be ignored: ['temperature', 'top_p', 'top_k']. Set `TRANSFORMERS_VERBOSITY=info` for more details.
[
    ExtractedPageData(
        page_no=1,
        extracted_data={'bill_no': '3139', 'total': 3949.75, 'tax_id': None},
        raw_text='{"bill_no": "3139", "total": 3949.75, "tax_id": null}',
        errors=[]
    )
]
Alternatively, a Pydantic model instance can be passed as a template instead, allowing to override the default values.

This can be very useful in scenarios where we happen to have available context that is more relevant than the default values predefined in the model definition.

E.g. in the example below:

bill_no and are actually set from the value extracted from the data,total
there was no to be extracted, so the updated default we provided was appliedtax_id
result = extractor.extract(
    source=file_path,
    template=Invoice(
        bill_no="41",
        total=100,
        tax_id="42",
    ),
)
print(result.pages)
The following generation flags are not valid and may be ignored: ['temperature', 'top_p', 'top_k']. Set `TRANSFORMERS_VERBOSITY=info` for more details.
[
    ExtractedPageData(
        page_no=1,
        extracted_data={'bill_no': '3139', 'total': 3949.75, 'tax_id': '42'},
        raw_text='{"bill_no": "3139", "total": 3949.75, "tax_id": "42"}',
        errors=[]
    )
]
Advanced Pydantic model
Besides a flat template, we can in principle use any Pydantic model, thus leveraging reuse and being able to capture hierarchies:

class Contact(BaseModel):
    name: Optional[str] = Field(default=None, examples=["Smith"])
    address: str = Field(default="123 Main St", examples=["456 Elm St"])
    postal_code: str = Field(default="12345", examples=["67890"])
    city: str = Field(default="Anytown", examples=["Othertown"])
    country: Optional[str] = Field(default=None, examples=["Canada"])


class ExtendedInvoice(BaseModel):
    bill_no: str = Field(
        examples=["A123", "5414"]
    )  # provide some examples, but not the actual value of the test sample
    total: float = Field(
        default=10, examples=[20]
    )  # provide a default value and some examples
    garden_work_hours: int = Field(default=1, examples=[2])
    sender: Contact = Field(default=Contact(), examples=[Contact()])
    receiver: Contact = Field(default=Contact(), examples=[Contact()])
result = extractor.extract(
    source=file_path,
    template=ExtendedInvoice,
)
print(result.pages)
The following generation flags are not valid and may be ignored: ['temperature', 'top_p', 'top_k']. Set `TRANSFORMERS_VERBOSITY=info` for more details.
[
    ExtractedPageData(
        page_no=1,
        extracted_data={
            'bill_no': '3139',
            'total': 3949.75,
            'garden_work_hours': 28,
            'sender': {
                'name': 'Robert Schneider',
                'address': 'Rue du Lac 1268',
                'postal_code': '2501',
                'city': 'Biel',
                'country': 'Switzerland'
            },
            'receiver': {
                'name': 'Pia Rutschmann',
                'address': 'Marktgasse 28',
                'postal_code': '9400',
                'city': 'Rorschach',
                'country': 'Switzerland'
            }
        },
        raw_text='{"bill_no": "3139", "total": 3949.75, "garden_work_hours": 28, "sender": {"name": "Robert 
Schneider", "address": "Rue du Lac 1268", "postal_code": "2501", "city": "Biel", "country": "Switzerland"}, 
"receiver": {"name": "Pia Rutschmann", "address": "Marktgasse 28", "postal_code": "9400", "city": "Rorschach", 
"country": "Switzerland"}}',
        errors=[]
    )
]
Validating and loading the extracted data
The generated response data can be easily validated and loaded via Pydantic:

invoice = ExtendedInvoice.model_validate(result.pages[0].extracted_data)
print(invoice)
ExtendedInvoice(
    bill_no='3139',
    total=3949.75,
    garden_work_hours=28,
    sender=Contact(
        name='Robert Schneider',
        address='Rue du Lac 1268',
        postal_code='2501',
        city='Biel',
        country='Switzerland'
    ),
    receiver=Contact(
        name='Pia Rutschmann',
        address='Marktgasse 28',
        postal_code='9400',
        city='Rorschach',
        country='Switzerland'
    )
)
This way, we can get from completely unstructured data to a very structured and developer-friendly representation:

print(
    f"Invoice #{invoice.bill_no} was sent by {invoice.sender.name} "
    f"to {invoice.receiver.name} at {invoice.sender.address}."
)
Invoice #3139 was sent by Robert Schneider to Pia Rutschmann at Rue du Lac 1268.
