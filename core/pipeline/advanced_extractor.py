import os
import time
import requests
from docling.document_converter import DocumentConverter
from spire.doc import Document, FileFormat
from pipeline.chunking import Chunker
from pipeline.embedding import LanceDataStore

OUTPUT_DIR = "../law_files"
PROCESSED_LOG = "processed_links.txt"
FAILED_LOG = "failed_links.txt"
DELAY_SECONDS = 5
TIME_OUT=60

# Common Browser User-Agent
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1"
}

lds = LanceDataStore("kenya_laws")
chunker = Chunker()

class AdvancedTextExtractor:
    def __init__(self):
        # We can pass custom options to Docling if needed for remote fetches
        self.converter = DocumentConverter()
        
        for f in [PROCESSED_LOG, FAILED_LOG]:
            if not os.path.exists(f):
                open(f, 'a').close()

    def _get_logged_links(self, file_path):
        with open(file_path, 'r') as f:
            return {line.strip() for line in f if line.strip()}

    def _log_status(self, file_path, link):
        with open(file_path, 'a') as f:
            f.write(f"{link}\n")

    def download_and_convert(self, url, folder):
        if not os.path.exists(folder):
            os.makedirs(folder)

        original_filename = url.split('/')[-1]
        name_without_ext = os.path.splitext(original_filename)[0]
        
        temp_path = os.path.join(folder, original_filename)
        pdf_path = os.path.join(folder, f"{name_without_ext}.pdf")

        try:
            print(f"📥 Downloading: {original_filename}")
            # Added HEADERS here
            response = requests.get(url, headers=HEADERS, timeout=TIME_OUT)
            response.raise_for_status()
            
            with open(temp_path, 'wb') as f:
                f.write(response.content)
       
            print(f"🔄 Converting {original_filename} to PDF...")
            doc = Document()
            doc.LoadFromFile(temp_path)
            doc.SaveToFile(pdf_path, FileFormat.PDF)
            doc.Close()
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return pdf_path
        except Exception as e:
            print(f"❌ Error in download/convert for {url}: {e}")
            return None

    def extract_and_save_to_db(self, text_file_path):
        processed = self._get_logged_links(PROCESSED_LOG)
        failed = self._get_logged_links(FAILED_LOG)
        
        with open(text_file_path, 'r') as f:
            raw_links = [line.strip() for line in f if line.strip()]

        unique_links = list(dict.fromkeys(raw_links))
        
        duplicates_removed = len(raw_links) - len(unique_links)
        if duplicates_removed > 0:
            print(f"🧹 Removed {duplicates_removed} duplicate links.")

        for link in unique_links:
            if link in processed or link in failed:
                print(f"⏭️ Skipping: {link}")
                continue

            print(f"🚀 Processing: {link}")
            try:
                if link.lower().endswith('.doc'):
                    local_pdf = self.download_and_convert(link, OUTPUT_DIR)
                    if local_pdf:
                        # Convert local file
                        result = self.converter.convert(local_pdf)
                        chunks = chunker.get_chunks(result.document)
                        print(f'saving { len(chunks) } chunks in docs')
                        lds.add_data_to_table(chunks)
                        self._log_status(PROCESSED_LOG, link)
                        processed.add(link)
                    else:
                        self._log_status(FAILED_LOG, link)
                        failed.add(link)
                else:
                    # Note: Docling internally uses its own fetcher. 
                    # If Docling gets blocked, we can download the file manually 
                    # using the HEADERS above and pass the local path instead.
                    result = self.converter.convert(link, headers=HEADERS)
                    if result.document:
                        chunks = chunker.get_chunks(result.document)
                        print(f'saving { len(chunks) } chunks in docs')
                        lds.add_data_to_table(chunks)
                        self._log_status(PROCESSED_LOG, link)
                        processed.add(link)
                    else:
                        raise ValueError("Conversion returned empty document")

            except Exception as e:
                print(f"❌ Failed to process {link}: {e}")
                self._log_status(FAILED_LOG, link)
                failed.add(link)

            time.sleep(DELAY_SECONDS)