from docling.document_converter import DocumentConverter
from utils.sitemap import get_sitemap_urls


class TextExtractor:
    def __init__(self):
        self.converter = DocumentConverter()
    
    def extract_pdf(self, url):
        # --------------------------------------------------------------
        # Basic PDF extraction
        # --------------------------------------------------------------
        result = self.converter.convert(url)
        return result.document

    def extract_html(self, url):
        # --------------------------------------------------------------
        # Basic HTML extraction
        # --------------------------------------------------------------
        result = self.converter.convert(url)
        return result.document

    def extract_by_sitemap(self, url):
        # --------------------------------------------------------------
        # Scrape multiple pages using the sitemap
        # --------------------------------------------------------------
        sitemap_urls = get_sitemap_urls(url)
        conv_results_iter = self.converter.convert_all(sitemap_urls)
        docs = []
        for i, result in enumerate(conv_results_iter):
            if result.document:
                document = result.document
                docs.append(document)
        return docs