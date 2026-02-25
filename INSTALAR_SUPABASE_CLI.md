# Instalar Supabase CLI

O Supabase CLI não está instalado no seu sistema. Siga as instruções abaixo para instalar.

## Opções de Instalação

### Opção 1: Via npm (Recomendado)

Se você tem Node.js instalado:

```powershell
npm install -g supabase
```

### Opção 2: Via Scoop (Windows)

Se você tem Scoop instalado:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Opção 3: Via Binário Direto

1. Acesse: https://github.com/supabase/cli/releases
2. Baixe o binário para Windows
3. Adicione ao PATH do sistema

## Verificar Instalação

Após instalar, verifique:

```powershell
supabase --version
```

## Aplicar Migration

Após instalar o CLI, você pode:

### Opção A: Usar o script automatizado

```powershell
python execution\apply_migration_cli.py
```

### Opção B: Executar comandos manualmente

1. **Login no Supabase:**
   ```powershell
   supabase login
   ```
   Isso abrirá o navegador para autenticação.

2. **Linkar projeto:**
   ```powershell
   supabase link --project-ref bmvqtzxdrnbioxhiiosr
   ```

3. **Aplicar migration:**
   ```powershell
   supabase db push
   ```

4. **Verificar tabelas:**
   ```powershell
   python execution\verify_supabase_setup.py
   ```

## Próximos Passos

Após aplicar a migration com sucesso:

1. Verificar tabelas no dashboard: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/editor
2. Continuar com FASE 4: Design System
3. Preparar deploy das Edge Functions
