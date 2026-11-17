sample_pdf = "https://arxiv.org/pdf/2408.09869"
sample_html = "https://docling-project.github.io/docling/"
sample_sitemap_baseurl = "https://docling-project.github.io/docling/"
text_file_with_links = "../data/law_files/links.txt"
# --------------------------------------------------------------
# Extract the data
# --------------------------------------------------------------

from pipeline.extractor import TextExtractor
from pipeline.advanced_extractor import AdvancedTextExtractor

extractor = AdvancedTextExtractor()
# docling_doc = extractor.extract_pdf(sample_pdf)
extractor.extract_and_save_to_db(text_file_with_links)