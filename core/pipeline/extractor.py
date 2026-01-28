from docling.document_converter import DocumentConverter
from utils.sitemap import get_sitemap_urls
import os
import requests
from spire.doc import Document, FileFormat

OUTPUT_DIR = "../law_files"

class TextExtractor:
    def __init__(self):
        self.converter = DocumentConverter()
    
    def download_and_convert(self, url, folder):
        # Ensure the folder exists
        if not os.path.exists(folder):
            os.makedirs(folder)

        # 1. Prepare file paths
        original_filename = url.split('/')[-1]
        name_without_ext = os.path.splitext(original_filename)[0]
        
        temp_path = os.path.join(folder, original_filename)
        pdf_path = os.path.join(folder, f"{name_without_ext}.pdf")

        # 2. Download the file
        print(f"📥 Downloading: {original_filename}")
        try:
            response = requests.get(url, timeout=60)
            with open(temp_path, 'wb') as f:
                f.write(response.content)
       
            print(f"🔄 Converting to PDF...")
            doc = Document()
            doc.LoadFromFile(temp_path)
            doc.SaveToFile(pdf_path, FileFormat.PDF)
            doc.Close()
            
            # Remove the original Word file to save space
            os.remove(temp_path)
            print(f"✅ Success: {name_without_ext}.pdf")
            return pdf_path
        except Exception as e:
            print(f"❌ Error processing {url}: {e}")
            return None
            
    def chunk_data(self, file_path, chunk_size=100):
        items_set = set()

        with open(file_path, 'r') as f:
            items_set = {line.strip() for line in f if line.strip()}
        
        items_list = list(items_set)
        total_items = len(items_list)
        chunks = [items_list[i:i + chunk_size] for i in range(0, total_items, chunk_size)]
        
        return chunks
    
    def extract_pdf(self, url):
        # --------------------------------------------------------------
        # Basic PDF extraction
        # --------------------------------------------------------------
        result = self.converter.convert(url)
        return result.document
    
    def extract_from_links(self, text_file_path):
        chunked_urls = self.chunk_data(text_file_path, chunk_size=50)
        docs = []
        for index, links in enumerate(chunked_urls):
            print(f"Processing batch {index + 1} with {len(links)} links.")
            for link in links:
                if link.lower().endswith('.doc'):
                    # docling does not handle .doc files download and convert to pdf first
                    converted_local_pdf = self.download_and_convert(link, OUTPUT_DIR)
                    print(f"Converted file path: {converted_local_pdf}")
                    result = self.converter.convert(converted_local_pdf)
                else:
                    try:
                        result = self.converter.convert(link)
                        if result.document:
                            document = result.document
                            docs.append(document)
                    except Exception as e:
                        print(f"❌ Error converting {link}: {e}")
            return docs

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