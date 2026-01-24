import lancedb
from pipeline.model import Chunks

class LanceDataStore:
    def __init__(self):
        # --------------------------------------------------------------
        # Create a LanceDB database and table
        # --------------------------------------------------------------

        # Create a LanceDB database
        self.db = lancedb.connect("data/lancedb")
        self.table = self.db.create_table("docling", schema=Chunks, mode="overwrite")
    
    def add_data_to_table(self, chunks):
        # --------------------------------------------------------------
        # Prepare the chunks for the table
        # --------------------------------------------------------------
        # Create table with processed chunks
        processed_chunks = []
        
        for chunk in chunks:
            page_numbers = sorted(
                set(
                    prov.page_no
                    for item in chunk.meta.doc_items
                    for prov in item.prov
                )
            )
            processed_chunks.append(
                {
                    "text": chunk.text,
                    "metadata": {
                        "filename": chunk.meta.origin.filename,
                        "page_numbers": page_numbers,  # empty list if there are no pages
                        "title": chunk.meta.headings[0] if chunk.meta.headings else None,
                    },
                }
            )

        # --------------------------------------------------------------
        # Add the chunks to the table (automatically embeds the text)
        # --------------------------------------------------------------
        # print("data", processed_chunks)
        self.table.add(processed_chunks)
    
    def table_to_pandas_df(self):
        # --------------------------------------------------------------
        # Load the table
        # --------------------------------------------------------------
        return self.table.to_pandas()
    
    def table_row_count(self):
        return self.table.count_rows()