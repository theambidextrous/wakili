from docling.chunking import HybridChunker
from dotenv import load_dotenv
from utils.tokenizer import OpenAITokenizer
from pipeline.extractor import TextExtractor

load_dotenv()

class Chunker:
    def __init__(self):
        self.extractor = TextExtractor()
    
    def get_chunks(self, document):
        open_ai_tokenizer = OpenAITokenizer()  # Load our custom tokenizer for OpenAI
        # --------------------------------------------------------------
        # Apply hybrid chunking
        # --------------------------------------------------------------
        chunker = HybridChunker(
            tokenizer=open_ai_tokenizer.tokenizer,
            merge_peers=True,
        )

        chunk_iter = chunker.chunk(dl_doc=document)
        chunks = list(chunk_iter)
        return chunks