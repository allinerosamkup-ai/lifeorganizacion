#!/usr/bin/env python3
"""
Script para verificar configuração completa do Supabase.

Verifica conexão, tabelas criadas e prepara para próximas fases.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT.parent / "global" / "api" / ".env"

def check_env_variables():
    """Verifica se todas as variáveis necessárias estão configuradas."""
    load_dotenv(ENV_FILE)
    
    print("=" * 60)
    print("VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE")
    print("=" * 60)
    print()
    
    required_vars = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY"),
        "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    }
    
    all_ok = True
    for var_name, var_value in required_vars.items():
        if var_value:
            # Mascarar chaves para segurança
            masked = var_value[:20] + "..." if len(var_value) > 20 else var_value
            print(f"✅ {var_name}: {masked}")
        else:
            print(f"❌ {var_name}: Não configurado")
            all_ok = False
    
    print()
    
    optional_vars = {
        "CLAUDE_API_KEY": os.getenv("CLAUDE_API_KEY"),
    }
    
    print("Variáveis opcionais (para próximas fases):")
    for var_name, var_value in optional_vars.items():
        if var_value:
            masked = var_value[:20] + "..." if len(var_value) > 20 else var_value
            print(f"✅ {var_name}: {masked}")
        else:
            print(f"⏳ {var_name}: Não configurado ainda")
    
    print()
    return all_ok

def test_connection():
    """Testa conexão com Supabase."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
def check_connection(url, service_key):
    """Testa a conexão básica com o Supabase usando a chave de serviço."""
    print("=" * 60)
    print("TESTE DE CONEXÃO COM SUPABASE")
    print("=" * 60)
    print()
    
    print(f"🔍 Testando: {url}")
    
    try:
        import requests
        
        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}"
        }
        
        # Testar endpoint REST de uma tabela pública (perfis) para validação da chave
        test_url = f"{url}/rest/v1/profiles?limit=1"
        
        response = requests.get(test_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ Conexão com Supabase bem-sucedida!")
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
        print(f"❌ Erro: {str(e)}")
        return False

def verify_tables(url, service_key):
    """Verifica se as tabelas foram criadas."""
    print("=" * 60)
    print("VERIFICAÇÃO DE TABELAS")
    print("=" * 60)
    print()
    
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
        
        print("🔍 Verificando tabelas no Supabase...")
        print()
        
        headers = {
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}"
        }
        
        found = []
        missing = []
        
        for table in expected_tables:
            table_url = f"{url}/rest/v1/{table}?limit=1"
            try:
                response = requests.get(table_url, headers=headers, timeout=5)
                if response.status_code == 200:
                    found.append(table)
                    print(f"   ✅ {table}")
                elif response.status_code == 404:
                    missing.append(table)
                    print(f"   ❌ {table} (não encontrada)")
                else:
                    missing.append(table)
                    print(f"   ⚠️  {table} (erro: {response.status_code})")
            except Exception as e:
                missing.append(table)
                print(f"   ⚠️  {table} (erro: {str(e)[:50]})")
        
        print()
        if len(found) == len(expected_tables):
            print("✅ Todas as tabelas foram criadas!")
            print()
            print("🎉 Setup do Supabase completo!")
            return True
        else:
            print(f"⚠️  {len(missing)} tabela(s) faltando")
            if missing:
                print(f"   Faltando: {', '.join(missing)}")
            print()
            print("📋 PRÓXIMO PASSO:")
            print("   1. Acesse: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/sql/new")
            print("   2. Copie conteúdo de: supabase/migrations/20240220000001_initial_schema.sql")
            print("   3. Execute no SQL Editor")
            print("   4. Execute este script novamente para verificar")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao verificar tabelas: {str(e)}")
        return False

def main():
    """Função principal."""
    print()
    
    # Verificar variáveis
    if not check_env_variables():
        print("⚠️  Configure as variáveis faltantes no arquivo .env")
        return
    
    load_dotenv(ENV_FILE) # Ensure env vars are loaded for direct access
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        print("❌ Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.")
        return
    
    print()
    
    # Testar conexão
    if not check_connection(url, service_key):
        print("⚠️  Verifique as credenciais do Supabase")
        return
    
    print()
    
    # Verificar tabelas
    verify_tables(url, service_key)
    
    print()
    print("=" * 60)
    print("PRÓXIMOS PASSOS")
    print("=" * 60)
    print()
    print("1. Se todas as tabelas foram criadas:")
    print("   ✅ Continuar com FASE 4: Design System")
    print("   ✅ Preparar para deploy das Edge Functions")
    print()
    print("2. Se faltam tabelas:")
    print("   ⏳ Aplicar migration SQL primeiro")
    print("   ⏳ Executar este script novamente")
    print()
    print("3. Para testar Edge Functions:")
    print("   ⏳ Obter CLAUDE_API_KEY")
    print("   ⏳ Fazer deploy das funções")
    print()

if __name__ == "__main__":
    main()
