#!/usr/bin/env python3
"""
Script para clonar repositórios de referência do GitHub.

Este script clona os repositórios essenciais mencionados no plano
para a pasta references/ para uso como referência durante o desenvolvimento.
"""

import subprocess
import os
from pathlib import Path

# Diretório base do projeto
PROJECT_ROOT = Path(__file__).parent.parent
REFERENCES_DIR = PROJECT_ROOT / "references"

# Repositórios a clonar
REPOSITORIES = {
    "insights-lm": {
        "url": "https://github.com/theaiautomators/insights-lm-public.git",
        "description": "Padrões Lovable+Supabase+n8n"
    },
    "next-stripe": {
        "url": "https://github.com/KolbySisk/next-supabase-stripe-starter.git",
        "description": "Fluxo completo Auth+Stripe+Supabase"
    },
    "peri": {
        "url": "https://github.com/IraSoro/peri.git",
        "description": "Algoritmo de cálculo de fase do ciclo menstrual"
    },
    "launch-mvp": {
        "url": "https://github.com/ShenSeanChen/launch-mvp-stripe-nextjs-supabase.git",
        "description": "Triggers pg_net + Edge Functions + automações"
    }
}


def clone_repository(name: str, url: str, description: str) -> bool:
    """Clona um repositório do GitHub."""
    repo_path = REFERENCES_DIR / name
    
    # Se o diretório já existe, pula
    if repo_path.exists():
        print(f"⚠️  {name} já existe em {repo_path}. Pulando...")
        return True
    
    print(f"📦 Clonando {name} ({description})...")
    print(f"   URL: {url}")
    
    try:
        subprocess.run(
            ["git", "clone", url, str(repo_path)],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {name} clonado com sucesso!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erro ao clonar {name}: {e.stderr}")
        return False
    except FileNotFoundError:
        print("❌ Git não encontrado. Certifique-se de que o Git está instalado.")
        return False


def main():
    """Função principal."""
    # Criar diretório references se não existir
    REFERENCES_DIR.mkdir(exist_ok=True)
    print(f"📁 Diretório de referências: {REFERENCES_DIR}\n")
    
    # Clonar cada repositório
    results = []
    for name, info in REPOSITORIES.items():
        success = clone_repository(name, info["url"], info["description"])
        results.append((name, success))
        print()
    
    # Resumo
    print("=" * 60)
    print("RESUMO:")
    print("=" * 60)
    successful = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}")
    
    print(f"\n{successful}/{total} repositórios clonados com sucesso.")
    
    if successful == total:
        print("\n🎉 Todos os repositórios foram clonados!")
    else:
        print("\n⚠️  Alguns repositórios falharam. Verifique os erros acima.")


if __name__ == "__main__":
    main()
