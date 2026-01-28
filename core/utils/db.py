import lancedb

from pipeline.model import Chunks

# Configuration
DB_PATH = "../data/lancedb"
TABLE_NAME = "kenya_laws"

class DBClient:
    def __init__(self):
        # --------------------------------------------------------------
        # Connect to the database
        # --------------------------------------------------------------
        db = lancedb.connect(DB_PATH)
        if TABLE_NAME in db.table_names():
            print(f"Table '{TABLE_NAME}' already exists.")
            self.table = db.open_table(TABLE_NAME)
        else:
            print(f"Creating table '{TABLE_NAME}'.")
            self.table = db.create_table(TABLE_NAME, schema=Chunks, mode="overwrite")
    
    def connection(self):
        return self.table
