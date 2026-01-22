sample_pdf = "https://arxiv.org/pdf/2408.09869"
sample_html = "https://ds4sd.github.io/docling/"
sample_sitemap_baseurl = "https://ds4sd.github.io/docling/"

# --------------------------------------------------------------
# Extract the data
# --------------------------------------------------------------

from pipeline.extractor import TextExtractor

extractor = TextExtractor()
docling_doc = extractor.extract_pdf(sample_pdf)

# --------------------------------------------------------------
# Apply hybrid chunking
# --------------------------------------------------------------

from pipeline.chunking import Chunker

chunker = Chunker()
chunks = chunker.get_chunks(docling_doc)
# print(chunks[:1])

# --------------------------------------------------------------
# Create a LanceDB database and table
# --------------------------------------------------------------

from pipeline.embedding import LanceDataStore
lds = LanceDataStore()
lds.add_data_to_table(chunks[:1])
count = lds.table_row_count()

print(count)