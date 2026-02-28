import os
import urllib.parse
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT.parent / "global" / "api" / ".env"
MIGRATION_FILE = PROJECT_ROOT / "supabase" / "migrations" / "20240220000001_initial_schema.sql"

def apply_sql():
    load_dotenv(ENV_FILE)
    
    # Connection string for Supabase PostgreSQL
    # Try connecting directly to the database instead of the connection pooler
    # Format: postgres://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    
    password = "Fl@meng0"
    project_ref = "bmvqtzxdrnbioxhiiosr"
    encoded_password = urllib.parse.quote_plus(password)
    db_url = f"postgresql://postgres:{encoded_password}@db.{project_ref}.supabase.co:5432/postgres"
    
    try:
        print(f"Connecting to database...")
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        print(f"Reading SQL file...")
        with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
            sql = f.read()
            
        print("Executing SQL migration...")
        cursor.execute(sql)
        print("Migration applied successfully!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error applying migration: {e}")

if __name__ == '__main__':
    apply_sql()
