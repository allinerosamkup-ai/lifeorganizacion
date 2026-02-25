#!/usr/bin/env python3
"""
Script para configurar e verificar conexão com Supabase.

Este script ajuda a configurar as variáveis de ambiente do Supabase
e verifica se a conexão está funcionando.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT / ".env"
ENV_EXAMPLE = PROJECT_ROOT / ".env.example"

def extract_project_ref_from_url(url: str) -> str:
    """Extrai o project ref da URL do Supabase."""
    # URL format: https://xxxxx.supabase.co
    # ou: db.xxxxx.supabase.co
    if "supabase.co" in url:
        parts = url.replace("https://", "").replace("http://", "").split(".")
        if len(parts) >= 2:
            return parts[0] if parts[0] != "db" else parts[1]
    return ""

def update_env_file():
    """Atualiza arquivo .env com credenciais do Supabase."""
    load_dotenv(ENV_FILE)
    
    print("=" * 60)
    print("CONFIGURAÇÃO DO SUPABASE")
    print("=" * 60)
    print()
    
    # Informações da string de conexão fornecida
    connection_string = "postgresql://postgres:[YOUR-PASSWORD]@db.bmvqtzxdrnbioxhiiosr.supabase.co:5432/postgres"
    project_ref = "bmvqtzxdrnbioxhiiosr"
    supabase_url = f"https://{project_ref}.supabase.co"
    
    print(f"✅ Project Ref identificado: {project_ref}")
    print(f"✅ Supabase URL: {supabase_url}")
    print()
    
    # Ler valores atuais do .env
    current_url = os.getenv("SUPABASE_URL", "")
    current_anon = os.getenv("SUPABASE_ANON_KEY", "")
    current_service = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Atualizar URL se necessário
    if not current_url or current_url != supabase_url:
        print(f"📝 Atualizando SUPABASE_URL...")
        update_env_var("SUPABASE_URL", supabase_url)
    else:
        print(f"✅ SUPABASE_URL já configurado: {current_url}")
    
    print()
    print("⚠️  PRÓXIMOS PASSOS:")
    print("=" * 60)
    print()
    print("1. Acesse o dashboard do Supabase:")
    print(f"   {supabase_url}")
    print()
    print("2. Vá em Settings → API")
    print()
    print("3. Copie as seguintes chaves:")
    print("   - 'anon public' key → SUPABASE_ANON_KEY")
    print("   - 'service_role' key → SUPABASE_SERVICE_ROLE_KEY")
    print()
    print("4. Execute este script novamente ou adicione manualmente ao .env:")
    print()
    print(f"   SUPABASE_URL={supabase_url}")
    print("   SUPABASE_ANON_KEY=sua-anon-key-aqui")
    print("   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui")
    print()
    print("5. Para aplicar a migration SQL:")
    print("   - Acesse SQL Editor no dashboard")
    print("   - Copie conteúdo de supabase/migrations/20240220000001_initial_schema.sql")
    print("   - Execute a query")
    print()

def update_env_var(key: str, value: str):
    """Atualiza uma variável no arquivo .env."""
    env_content = ""
    
    if ENV_FILE.exists():
        with open(ENV_FILE, "r") as f:
            env_content = f.read()
    
    # Verificar se a variável já existe
    lines = env_content.split("\n")
    updated = False
    
    for i, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[i] = f"{key}={value}"
            updated = True
            break
    
    if not updated:
        # Adicionar nova variável
        if env_content and not env_content.endswith("\n"):
            env_content += "\n"
        env_content += f"{key}={value}\n"
        lines = env_content.split("\n")
    
    # Escrever arquivo atualizado
    with open(ENV_FILE, "w") as f:
        f.write("\n".join(lines))
    
    print(f"   ✅ {key} atualizado")

def verify_connection():
    """Verifica se a conexão com Supabase está funcionando."""
    load_dotenv(ENV_FILE)
    
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    print("=" * 60)
    print("VERIFICAÇÃO DE CONEXÃO")
    print("=" * 60)
    print()
    
    if not url:
        print("❌ SUPABASE_URL não configurado")
        return False
    
    if not anon_key:
        print("⚠️  SUPABASE_ANON_KEY não configurado")
        print("   Configure no dashboard do Supabase")
        return False
    
    if not service_key:
        print("⚠️  SUPABASE_SERVICE_ROLE_KEY não configurado")
        print("   Configure no dashboard do Supabase")
        return False
    
    print(f"✅ SUPABASE_URL: {url}")
    print(f"✅ SUPABASE_ANON_KEY: {anon_key[:20]}...")
    print(f"✅ SUPABASE_SERVICE_ROLE_KEY: {service_key[:20]}...")
    print()
    print("✅ Todas as variáveis estão configuradas!")
    print()
    print("Para testar a conexão, execute:")
    print("   python execution/test_supabase_connection.py")
    
    return True

def main():
    """Função principal."""
    if len(sys.argv) > 1 and sys.argv[1] == "verify":
        verify_connection()
    else:
        update_env_file()
        verify_connection()

if __name__ == "__main__":
    main()
