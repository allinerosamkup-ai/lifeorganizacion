#!/usr/bin/env python3
"""
Script para verificar se Supabase CLI está instalado.

Verifica instalação e fornece instruções se necessário.
"""

import subprocess
import sys
import shutil

def check_cli_installed():
    """Verifica se Supabase CLI está instalado."""
    print("=" * 60)
    print("VERIFICAÇÃO DO SUPABASE CLI")
    print("=" * 60)
    print()
    
    # Verificar se comando existe
    cli_path = shutil.which("supabase")
    
    if cli_path:
        print(f"✅ Supabase CLI encontrado em: {cli_path}")
        
        # Verificar versão
        try:
            result = subprocess.run(
                ["supabase", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                print(f"   Versão: {result.stdout.strip()}")
                print()
                return True
        except Exception as e:
            print(f"   ⚠️  Erro ao verificar versão: {e}")
            return False
    else:
        print("❌ Supabase CLI não encontrado")
        print()
        print("=" * 60)
        print("INSTALAÇÃO DO SUPABASE CLI")
        print("=" * 60)
        print()
        print("Escolha um método de instalação:")
        print()
        print("1. Via npm (Node.js):")
        print("   npm install -g supabase")
        print()
        print("2. Via Scoop (Windows):")
        print("   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git")
        print("   scoop install supabase")
        print()
        print("3. Via Homebrew (macOS/Linux):")
        print("   brew install supabase/tap/supabase")
        print()
        print("4. Via Binário direto:")
        print("   https://github.com/supabase/cli/releases")
        print()
        print("Após instalar, execute este script novamente.")
        print()
        return False

def main():
    """Função principal."""
    if check_cli_installed():
        print("✅ Supabase CLI está pronto para uso!")
        print()
        print("Próximo passo: Executar 'python execution/apply_migration_cli.py'")
        sys.exit(0)
    else:
        print("⚠️  Instale o Supabase CLI antes de continuar.")
        sys.exit(1)

if __name__ == "__main__":
    main()
