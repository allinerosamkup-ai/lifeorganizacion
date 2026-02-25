#!/usr/bin/env python3
"""
Script para testar conexão com Supabase.

Verifica se as credenciais estão corretas e se é possível
conectar ao banco de dados.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT / ".env"

def test_supabase_connection():
    """Testa conexão com Supabase usando requests."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not anon_key:
        print("❌ Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas")
        print("   Execute: python execution/setup_supabase.py")
        return False
    
    try:
        import requests
        
        # Testar endpoint de health check
        health_url = f"{url}/rest/v1/"
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}"
        }
        
        print("🔍 Testando conexão com Supabase...")
        print(f"   URL: {url}")
        print()
        
        response = requests.get(health_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ Conexão com Supabase bem-sucedida!")
            print()
            print("📋 Próximos passos:")
            print("   1. Aplicar migration SQL no dashboard")
            print("   2. Verificar se tabelas foram criadas")
            print("   3. Continuar com Edge Functions")
            return True
        else:
            print(f"❌ Erro na conexão: Status {response.status_code}")
            print(f"   Resposta: {response.text[:200]}")
            return False
            
    except ImportError:
        print("❌ Biblioteca 'requests' não instalada")
        print("   Execute: pip install requests")
        return False
    except Exception as e:
        print(f"❌ Erro ao conectar: {str(e)}")
        return False

def check_tables():
    """Verifica se as tabelas foram criadas."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not anon_key:
        print("❌ Variáveis não configuradas")
        return False
    
    try:
        import requests
        
        # Tabelas esperadas
        expected_tables = [
            "profiles",
            "check_ins",
            "tasks",
            "cycle_data",
            "ai_suggestions",
            "weekly_learnings",
            "focus_sessions"
        ]
        
        print("🔍 Verificando tabelas criadas...")
        print()
        
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}"
        }
        
        found_tables = []
        missing_tables = []
        
        for table in expected_tables:
            table_url = f"{url}/rest/v1/{table}?select=id&limit=1"
            response = requests.get(table_url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                found_tables.append(table)
                print(f"   ✅ {table}")
            elif response.status_code == 404:
                missing_tables.append(table)
                print(f"   ❌ {table} (não encontrada)")
            else:
                missing_tables.append(table)
                print(f"   ⚠️  {table} (erro: {response.status_code})")
        
        print()
        if len(found_tables) == len(expected_tables):
            print("✅ Todas as tabelas foram criadas!")
            return True
        else:
            print(f"⚠️  {len(missing_tables)} tabela(s) faltando")
            print("   Aplique a migration SQL no dashboard do Supabase")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar tabelas: {str(e)}")
        return False

def main():
    """Função principal."""
    print("=" * 60)
    print("TESTE DE CONEXÃO SUPABASE")
    print("=" * 60)
    print()
    
    # Verificar se .env existe
    if not ENV_FILE.exists():
        print("❌ Arquivo .env não encontrado")
        print("   Execute: python execution/setup_supabase.py primeiro")
        return
    
    # Testar conexão
    if test_supabase_connection():
        print()
        # Verificar tabelas se solicitado
        if len(sys.argv) > 1 and sys.argv[1] == "--check-tables":
            check_tables()

if __name__ == "__main__":
    main()
