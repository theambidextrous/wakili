import lancedb
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict
import os
from pipeline.model import Chunks
from dotenv import load_dotenv

load_dotenv() 

class DBClient:
    def __init__(self):
        # LanceDB Configuration
        self.lance_db_path = os.getenv("LANCE_DB_PATH", "../data/lancedb") # wakili/data/lancedb
        self.lance_table_name = os.getenv("LANCE_TABLE_NAME", "kenya_laws")
        
        # PostgreSQL Configuration
        self.pg_host = os.getenv("PG_HOST", "localhost")
        self.pg_port = os.getenv("PG_PORT", "5432")
        self.pg_database = os.getenv("PG_DB", "chat_app")
        self.pg_user = os.getenv("PG_USER", "postgres")
        self.pg_password = os.getenv("PG_PASSWORD", "password")
        
        # Connection caches
        self._lance_table = None
        self._pg_connection = None
        
        # Initialize PostgreSQL tables if needed
        self._init_postgresql_tables()
    
    def connection(self) -> lancedb.table.Table:
        """
        Get LanceDB table connection for vector operations
        Creates table if it doesn't exist
        """
        if self._lance_table is None:
            db = lancedb.connect(self.lance_db_path)
            
            if self.lance_table_name in db.table_names():
                print(f"LanceDB: Table '{self.lance_table_name}' already exists.")
                self._lance_table = db.open_table(self.lance_table_name)
            else:
                print(f"LanceDB: Creating table '{self.lance_table_name}'.")
                self._lance_table = db.create_table(
                    self.lance_table_name, 
                    schema=Chunks, 
                    mode="overwrite"
                )
        
        return self._lance_table
    
    def connection_pgsql(self) -> psycopg2.extensions.connection:
        """
        Get PostgreSQL connection for user data and other relational operations
        """
        if self._pg_connection is None or self._pg_connection.closed:
            try:
                self._pg_connection = psycopg2.connect(
                    host=self.pg_host,
                    port=self.pg_port,
                    database=self.pg_database,
                    user=self.pg_user,
                    password=self.pg_password,
                    cursor_factory=RealDictCursor
                )
                print(f"PostgreSQL: Connected to {self.pg_database} at {self.pg_host}")
            except Exception as e:
                print(f"PostgreSQL: Connection failed - {e}")
                raise
        
        return self._pg_connection
    
    def _init_postgresql_tables(self):
        """
        Initialize PostgreSQL tables if they don't exist
        """
        init_queries = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email_verified BOOLEAN DEFAULT FALSE,
                email_verification_code VARCHAR(6),
                email_verification_expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT FALSE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_valid BOOLEAN DEFAULT TRUE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS chat_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                sources JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_credits (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                amount DECIMAL(12, 3) NOT NULL DEFAULT 0,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS credit_transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                transaction_type VARCHAR(20) NOT NULL,
                amount DECIMAL(12, 3) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_credits_expires ON user_credits(expires_at);
            CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
            CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at);
            """
        ]
        
        try:
            conn = self.connection_pgsql()
            with conn.cursor() as cursor:
                for query in init_queries:
                    cursor.execute(query)
                conn.commit()
            print("PostgreSQL: Tables initialized successfully")
        except Exception as e:
            print(f"PostgreSQL: Table initialization failed - {e}")
            # Don't raise here to allow app to start even if PostgreSQL is down
    
    def execute_query(self, query: str, params: tuple = None) -> list:
        """
        Execute a PostgreSQL query and return results
        """
        conn = self.connection_pgsql()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            if query.strip().upper().startswith("SELECT"):
                return cursor.fetchall()
            conn.commit()
            return []
    
    def close(self):
        """Close all database connections"""
        if self._pg_connection and not self._pg_connection.closed:
            self._pg_connection.close()
            print("PostgreSQL: Connection closed")
        
        # LanceDB doesn't need explicit closing, but we can clear the reference
        self._lance_table = None
    
    def health_check(self) -> Dict[str, bool]:
        """
        Check health of both database connections
        Returns a dict with status for each database
        """
        health = {
            "lancedb": False,
            "postgresql": False
        }
        
        # Check LanceDB
        try:
            table = self.connection()
            # Try a simple operation
            count = table.count_rows()
            health["lancedb"] = True
        except Exception as e:
            print(f"LanceDB health check failed: {e}")
        
        # Check PostgreSQL
        try:
            conn = self.connection_pgsql()
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            health["postgresql"] = True
        except Exception as e:
            print(f"PostgreSQL health check failed: {e}")
        
        return health