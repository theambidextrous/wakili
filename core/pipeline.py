sample_pdf = "https://arxiv.org/pdf/2408.09869"
sample_html = "https://docling-project.github.io/docling/"
sample_sitemap_baseurl = "https://docling-project.github.io/docling/"

# --------------------------------------------------------------
# Extract the data
# --------------------------------------------------------------

from pipeline.extractor import TextExtractor

extractor = TextExtractor()
# docling_doc = extractor.extract_pdf(sample_pdf)
docling_doc = extractor.extract_by_sitemap(sample_sitemap_baseurl)

# print(docling_doc)


# --------------------------------------------------------------
# Apply hybrid chunking
# --------------------------------------------------------------

from pipeline.chunking import Chunker
from pipeline.embedding import LanceDataStore

lds = LanceDataStore()
chunker = Chunker()

for doc in docling_doc:
    chunks = chunker.get_chunks(doc)
    print('chunks in doc: ', len(chunks))
    lds.add_data_to_table(chunks)
    # count = lds.table_row_count()
    # print("inserted row count: ", count)

# --------------------------------------------------------------
# Create a LanceDB database and table
# --------------------------------------------------------------
