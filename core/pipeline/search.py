import lancedb

class Search:
    def __init__(self):
        # --------------------------------------------------------------
        # Connect to the database
        # --------------------------------------------------------------
        self.uri = "data/lancedb"
        self.db = lancedb.connect(self.uri)


        # --------------------------------------------------------------
        # Load the table
        # --------------------------------------------------------------
        self.table = self.db.open_table("docling")
    
    def perform_search(self, query, limit=3):
        # --------------------------------------------------------------
        # Search the table
        # --------------------------------------------------------------
        result = self.table.search(query=query, query_type="vector").limit(limit)
        return result.to_pandas()