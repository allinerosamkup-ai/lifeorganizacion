#!/usr/bin/env python3
"""
Script para aplicar migration SQL via Supabase CLI.

Este script automatiza o processo de:
1. Verificar instalação do CLI
2. Login no Supabase
3. Linkar projeto
4. Aplicar migration
5. Verificar tabelas criadas
"""

import subprocess
import sys
import os
import json
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
MIGRATION_FILE = PROJECT_ROOT / "supabase" / "migrations" / "20240220000001_initial_schema.sql"

def check_cli():
    """Verifica se Supabase CLI está instalado."""
    import shutil
    if not shutil.which("supabase"):
        print("❌ Supabase CLI não encontrado")
        print("   Execute: python execution/check_supabase_cli.py")
        return False
    return True

def run_command(cmd, description, check=True):
    """Executa um comando e retorna resultado."""
    print(f"🔄 {description}...")
    print(f"   Comando: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print(f"✅ {description} concluído!")
            if result.stdout:
                print(f"   Output: {result.stdout[:200]}")
            return True, result.stdout
        else:
            print(f"❌ Erro em {description}")
            print(f"   Erro: {result.stderr[:500]}")
            return False, result.stderr
    except subprocess.TimeoutExpired:
        print(f"⏱️  Timeout em {description}")
        return False, "Timeout"
    except Exception as e:
        print(f"❌ Exceção em {description}: {str(e)}")
        return False, str(e)

def check_if_logged_in():
    """Verifica se já está logado no Supabase."""
    print("🔍 Verificando se já está autenticado...")
    
    success, output = run_command(
        ["supabase", "projects", "list"],
        "Verificar autenticação",
        check=False
    )
    
    if success:
        print("✅ Já autenticado no Supabase")
        return True
    else:
        print("⚠️  Não autenticado ou erro na verificação")
        return False

def login():
    """Faz login no Supabase."""
    print()
    print("=" * 60)
    print("LOGIN NO SUPABASE")
    print("=" * 60)
    print()
    print("Isso abrirá seu navegador para autenticação.")
    print("Após fazer login no navegador, volte aqui.")
    print()
    
    input("Pressione Enter para continuar...")
    
    success, output = run_command(
        ["supabase", "login"],
        "Login no Supabase",
        check=False
    )
    
    return success

def check_if_linked():
    """Verifica se projeto já está linkado."""
    config_file = PROJECT_ROOT / ".supabase" / "config.toml"
    if config_file.exists():
        print("✅ Projeto parece estar linkado (arquivo .supabase/config.toml existe)")
        return True
    return False

def link_project():
    """Linka projeto local ao remoto."""
    load_dotenv(ENV_FILE)
    project_ref = "bmvqtzxdrnbioxhiiosr"
    
    print()
    print("=" * 60)
    print("LINKAR PROJETO")
    print("=" * 60)
    print()
    print(f"Project Ref: {project_ref}")
    print()
    
    success, output = run_command(
        ["supabase", "link", "--project-ref", project_ref],
        "Linkar projeto ao Supabase",
        check=False
    )
    
    return success

def apply_migration():
    """Aplica migration usando db push."""
    print()
    print("=" * 60)
    print("APLICAR MIGRATION")
    print("=" * 60)
    print()
    
    if not MIGRATION_FILE.exists():
        print(f"❌ Arquivo de migration não encontrado: {MIGRATION_FILE}")
        return False
    
    print(f"📄 Migration: {MIGRATION_FILE.name}")
    print()
    
    success, output = run_command(
        ["supabase", "db", "push"],
        "Aplicar migration SQL",
        check=False
    )
    
    if success:
        print()
        print("✅ Migration aplicada com sucesso!")
        return True
    else:
        print()
        print("⚠️  Erro ao aplicar migration")
        print("   Verifique o erro acima")
        print("   Alternativa: Aplique manualmente via SQL Editor")
        return False

def verify_tables():
    """Verifica se as tabelas foram criadas."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not anon_key:
        print("⚠️  Variáveis não configuradas para verificação")
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
        
        print()
        print("=" * 60)
        print("VERIFICAÇÃO DE TABELAS")
        print("=" * 60)
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
        print("⚠️  Biblioteca 'requests' não instalada para verificação")
        print("   Execute: pip install requests")
        return False
    except Exception as e:
        print(f"⚠️  Erro ao verificar tabelas: {str(e)}")
        return False

def main():
    """Função principal."""
    print("=" * 60)
    print("APLICAR MIGRATION SQL VIA SUPABASE CLI")
    print("=" * 60)
    print()
    
    # 1. Verificar CLI
    if not check_cli():
        print()
        print("Execute primeiro: python execution/check_supabase_cli.py")
        sys.exit(1)
    
    print()
    
    # 2. Verificar login
    if not check_if_logged_in():
        if not login():
            print("❌ Falha no login. Tente novamente.")
            sys.exit(1)
    print()
    
    # 3. Verificar link
    if not check_if_linked():
        if not link_project():
            print("❌ Falha ao linkar projeto. Verifique o project-ref.")
            sys.exit(1)
    else:
        print("✅ Projeto já linkado")
    print()
    
    # 4. Aplicar migration
    if not apply_migration():
        print()
        print("⚠️  Migration não aplicada automaticamente")
        print("   Considere aplicar manualmente via SQL Editor")
        sys.exit(1)
    
    # 5. Verificar tabelas
    verify_tables()
    
    print()
    print("=" * 60)
    print("✅ PROCESSO CONCLUÍDO")
    print("=" * 60)
    print()
    print("Próximos passos:")
    print("  1. Verificar tabelas no dashboard")
    print("  2. Continuar com FASE 4: Design System")
    print("  3. Preparar deploy das Edge Functions")

if __name__ == "__main__":
    main()
