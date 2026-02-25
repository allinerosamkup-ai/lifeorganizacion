#!/usr/bin/env python3
"""
Script para configurar o ambiente de desenvolvimento local.

Este script verifica e configura as ferramentas necessárias
para o desenvolvimento do LifeOrganizer AI.
"""

import subprocess
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent


def check_command(command: str, name: str) -> bool:
    """Verifica se um comando está disponível."""
    try:
        subprocess.run(
            [command, "--version"],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {name} está instalado")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print(f"❌ {name} não está instalado")
        return False


def check_python_packages():
    """Verifica se os pacotes Python necessários estão instalados."""
    required_packages = [
        "python-dotenv",
        "requests",
    ]
    
    print("\n📦 Verificando pacotes Python...")
    missing = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"✅ {package} está instalado")
        except ImportError:
            print(f"❌ {package} não está instalado")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Pacotes faltando: {', '.join(missing)}")
        print("   Instale com: pip install -r requirements.txt")
        return False
    
    return True


def create_env_file():
    """Cria arquivo .env se não existir."""
    env_file = PROJECT_ROOT / ".env"
    env_example = PROJECT_ROOT / ".env.example"
    
    if env_file.exists():
        print("✅ Arquivo .env já existe")
        return
    
    if env_example.exists():
        print("📝 Criando .env a partir de .env.example...")
        with open(env_example, "r") as f:
            content = f.read()
        with open(env_file, "w") as f:
            f.write(content)
        print("✅ Arquivo .env criado. Configure as variáveis de ambiente.")
    else:
        print("⚠️  .env.example não encontrado. Criando .env básico...")
        basic_env = """# Variáveis de ambiente - LifeOrganizer AI
# Configure com suas credenciais

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI API
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# n8n
N8N_API_KEY=
N8N_WEBHOOK_URL=

# Azure
AZURE_STATIC_WEB_APP_DEPLOYMENT_TOKEN=
"""
        with open(env_file, "w") as f:
            f.write(basic_env)
        print("✅ Arquivo .env criado. Configure as variáveis de ambiente.")


def main():
    """Função principal."""
    print("=" * 60)
    print("CONFIGURAÇÃO DO AMBIENTE DE DESENVOLVIMENTO")
    print("=" * 60)
    print()
    
    # Verificar comandos essenciais
    print("🔍 Verificando ferramentas...")
    git_ok = check_command("git", "Git")
    python_ok = check_command("python", "Python") or check_command("python3", "Python3")
    node_ok = check_command("node", "Node.js")
    
    print()
    
    # Verificar pacotes Python
    packages_ok = check_python_packages()
    
    print()
    
    # Criar .env
    print("📝 Configurando variáveis de ambiente...")
    create_env_file()
    
    print()
    print("=" * 60)
    print("RESUMO:")
    print("=" * 60)
    
    all_ok = git_ok and python_ok and packages_ok
    
    if all_ok:
        print("✅ Ambiente configurado com sucesso!")
        print("\n📋 Próximos passos:")
        print("   1. Configure as variáveis de ambiente em .env")
        print("   2. Execute: python execution/clone_references.py")
        print("   3. Leia as diretivas em directives/")
    else:
        print("⚠️  Algumas ferramentas estão faltando.")
        print("   Instale as ferramentas necessárias e execute novamente.")


if __name__ == "__main__":
    main()
