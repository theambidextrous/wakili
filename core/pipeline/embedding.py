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
        processed_chunks = [
            {
                "text": chunk.text,
                "metadata": {
                    "filename": chunk.meta.origin.filename,
                    "page_numbers": [
                        page_no
                        for page_no in sorted(
                            set(
                                prov.page_no
                                for item in chunk.meta.doc_items
                                for prov in item.prov
                            )
                        )
                    ]
                    or None,
                    "title": chunk.meta.headings[0] if chunk.meta.headings else None,
                },
            }
            for chunk in chunks
        ]

        # --------------------------------------------------------------
        # Add the chunks to the table (automatically embeds the text)
        # --------------------------------------------------------------

        self.table.add(processed_chunks)
    
    def table_to_pandas_df(self):
        # --------------------------------------------------------------
        # Load the table
        # --------------------------------------------------------------
        return self.table.to_pandas()
    
    def table_row_count(self):
        return self.table.count_rows()