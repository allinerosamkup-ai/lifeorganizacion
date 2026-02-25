#!/usr/bin/env python3
"""
Script para aplicar migration SQL no Supabase.

Este script lê o arquivo de migration e aplica via API do Supabase
ou fornece instruções para aplicar manualmente.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
MIGRATION_FILE = PROJECT_ROOT / "supabase" / "migrations" / "20240220000001_initial_schema.sql"

def apply_migration_via_api():
    """Tenta aplicar migration via API do Supabase (se possível)."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        print("⚠️  SUPABASE_SERVICE_ROLE_KEY não configurado")
        print("   Aplique a migration manualmente via SQL Editor")
        return False
    
    try:
        import requests
        
        # Ler arquivo de migration
        if not MIGRATION_FILE.exists():
            print(f"❌ Arquivo de migration não encontrado: {MIGRATION_FILE}")
            return False
        
        with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print("📝 Aplicando migration via API...")
        print(f"   Arquivo: {MIGRATION_FILE.name}")
        print()
        
        # Nota: Supabase não tem API direta para executar SQL
        # Mas podemos verificar se as tabelas existem
        print("ℹ️  Supabase não permite aplicar SQL via API diretamente.")
        print("   Use o método manual abaixo.")
        return False
        
    except ImportError:
        print("❌ Biblioteca 'requests' não instalada")
        print("   Execute: pip install requests")
        return False

def show_manual_instructions():
    """Mostra instruções para aplicar migration manualmente."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL", "https://bmvqtzxdrnbioxhiiosr.supabase.co")
    project_ref = url.replace("https://", "").replace(".supabase.co", "")
    
    print("=" * 60)
    print("APLICAR MIGRATION SQL - INSTRUÇÕES MANUAIS")
    print("=" * 60)
    print()
    
    print("1. Acesse o SQL Editor do Supabase:")
    print(f"   https://app.supabase.com/project/{project_ref}/sql/new")
    print()
    
    print("2. Abra o arquivo de migration:")
    print(f"   {MIGRATION_FILE}")
    print()
    
    print("3. Copie TODO o conteúdo do arquivo")
    print()
    
    print("4. Cole no SQL Editor do Supabase")
    print()
    
    print("5. Clique em 'Run' ou pressione Ctrl+Enter")
    print()
    
    print("6. Verifique se apareceu 'Success. No rows returned'")
    print()
    
    print("7. Verifique as tabelas criadas:")
    print(f"   https://app.supabase.com/project/{project_ref}/editor")
    print()
    
    print("Tabelas esperadas:")
    print("  ✅ profiles")
    print("  ✅ check_ins")
    print("  ✅ tasks")
    print("  ✅ cycle_data")
    print("  ✅ ai_suggestions")
    print("  ✅ weekly_learnings")
    print("  ✅ focus_sessions")
    print()
    
    # Mostrar preview do SQL
    if MIGRATION_FILE.exists():
        print("=" * 60)
        print("PREVIEW DO SQL (primeiras 10 linhas):")
        print("=" * 60)
        with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()[:10]
            for i, line in enumerate(lines, 1):
                print(f"{i:3}: {line.rstrip()}")
        print("...")
        print()

def verify_tables():
    """Verifica se as tabelas foram criadas."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not anon_key:
        print("❌ Variáveis não configuradas")
        return False
    
    try:
        import requests
        
        expected_tables = [
            "profiles",
            "check_ins",
            "tasks",
            "cycle_data",
            "ai_suggestions",
            "weekly_learnings",
            "focus_sessions"
        ]
        
        print("🔍 Verificando tabelas...")
        print()
        
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}"
        }
        
        found = []
        missing = []
        
        for table in expected_tables:
            table_url = f"{url}/rest/v1/{table}?select=id&limit=1"
            try:
                response = requests.get(table_url, headers=headers, timeout=5)
                if response.status_code == 200:
                    found.append(table)
                    print(f"   ✅ {table}")
                else:
                    missing.append(table)
                    print(f"   ❌ {table} (status: {response.status_code})")
            except Exception as e:
                missing.append(table)
                print(f"   ⚠️  {table} (erro: {str(e)[:50]})")
        
        print()
        if len(found) == len(expected_tables):
            print("✅ Todas as tabelas foram criadas!")
            return True
        else:
            print(f"⚠️  {len(missing)} tabela(s) faltando")
            if missing:
                print(f"   Faltando: {', '.join(missing)}")
            return False
            
    except ImportError:
        print("❌ Biblioteca 'requests' não instalada")
        return False
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return False

def main():
    """Função principal."""
    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        verify_tables()
    else:
        print("=" * 60)
        print("APLICAR MIGRATION SQL")
        print("=" * 60)
        print()
        
        if not MIGRATION_FILE.exists():
            print(f"❌ Arquivo de migration não encontrado: {MIGRATION_FILE}")
            return
        
        # Tentar aplicar via API (provavelmente não funcionará)
        if not apply_migration_via_api():
            print()
            show_manual_instructions()
            print()
            print("=" * 60)
            print("APÓS APLICAR A MIGRATION:")
            print("=" * 60)
            print()
            print("Execute para verificar:")
            print("   python execution/apply_migration.py verify")

if __name__ == "__main__":
    main()
