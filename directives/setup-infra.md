# Setup de Infraestrutura

## Objetivo

Configurar o ambiente de desenvolvimento local e clonar repositórios de referência do GitHub para acelerar o desenvolvimento do LifeOrganizer AI.

## Entradas

- Acesso à internet para clonar repositórios
- Git instalado no sistema
- Python 3.8+ instalado
- Conta GitHub (opcional, para acessar repositórios privados)

## Ferramentas/Scripts

- `execution/clone_references.py` - Clona todos os repositórios de referência
- `execution/setup_dev_environment.py` - Verifica e configura ambiente local

## Processo Passo a Passo

### 1. Verificar Ambiente Local

```bash
# Verificar Git
git --version

# Verificar Python
python --version  # ou python3 --version

# Verificar Node.js (para desenvolvimento frontend)
node --version
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar .env.example para .env
cp .env.example .env

# Editar .env com suas credenciais
# (As credenciais serão configuradas nas fases seguintes)
```

### 3. Instalar Dependências Python

```bash
# Instalar pacotes necessários
pip install -r requirements.txt
```

### 4. Clonar Repositórios de Referência

```bash
# Executar script de clonagem
python execution/clone_references.py
```

**Repositórios que serão clonados:**

1. **insights-lm** (`theaiautomators/insights-lm-public`)
   - Padrões Lovable+Supabase+n8n
   - Localização: `references/insights-lm/`
   - Uso: Referência para estrutura de Edge Functions e integração n8n

2. **next-stripe** (`KolbySisk/next-supabase-stripe-starter`)
   - Fluxo completo Auth+Stripe+Supabase
   - Localização: `references/next-stripe/`
   - Uso: Referência para autenticação e integração Stripe

3. **peri** (`IraSoro/peri`)
   - Algoritmo de cálculo de fase do ciclo menstrual
   - Localização: `references/peri/`
   - Uso: Extrair algoritmo para Edge Function `calculate-cycle-phase`

4. **launch-mvp** (`ShenSeanChen/launch-mvp-stripe-nextjs-supabase`)
   - Triggers pg_net + Edge Functions + automações
   - Localização: `references/launch-mvp/`
   - Uso: Referência para triggers e automações

### 5. Organizar Layouts HTML

Os layouts HTML fornecidos devem ser salvos em `layouts/`:

- `layouts/splash-screen.html`
- `layouts/interacao-ia.html`
- `layouts/insights-avancados.html`
- `layouts/dashboard.html`
- `layouts/calendario.html`
- `layouts/agenda.html`
- `layouts/modo-foco.html`
- `layouts/onboarding-passo1.html`
- `layouts/configuracoes.html`
- `layouts/planos.html`

### 6. Instalar Ferramentas de Desenvolvimento

#### n8n-mcp (Claude Code)

O n8n-mcp permite criar workflows n8n via prompts no Claude Code.

**Instalação:**
- Seguir instruções em: https://github.com/czlonkowski/n8n-mcp
- Configurar como MCP server no Claude Code

#### n8n-skills

Skills que ensinam Claude a criar workflows n8n.

**Instalação:**
- Seguir instruções em: https://github.com/czlonkowski/n8n-skills
- Instalar como skills no Claude Code

## Saídas

- ✅ Diretório `references/` com todos os repositórios clonados
- ✅ Diretório `layouts/` com todos os layouts HTML organizados
- ✅ Arquivo `.env` configurado (mesmo que vazio inicialmente)
- ✅ Ambiente de desenvolvimento verificado e configurado
- ✅ Dependências Python instaladas

## Edge Cases

1. **Repositório já existe:**
   - O script `clone_references.py` detecta e pula repositórios já clonados
   - Para atualizar, deletar o diretório e executar novamente

2. **Git não instalado:**
   - Instalar Git: https://git-scm.com/downloads
   - No Windows: usar Git Bash ou instalar via winget/choco

3. **Sem acesso à internet:**
   - Repositórios podem ser baixados manualmente como ZIP
   - Extrair para `references/[nome-do-repo]/`

4. **Permissões de escrita:**
   - Garantir permissões de escrita no diretório do projeto
   - No Windows: executar como administrador se necessário

5. **Espaço em disco:**
   - Repositórios ocupam ~500MB-1GB no total
   - Verificar espaço disponível antes de clonar

## Notas e Aprendizados

- Os repositórios são apenas para referência, não serão modificados
- Manter os repositórios atualizados periodicamente: `git pull` em cada um
- Documentar aprendizados específicos de cada repositório em `directives/references-guide.md`
- Layouts HTML são templates estáticos que serão convertidos para React posteriormente

## Próximos Passos

Após completar esta fase:

1. Ler `directives/references-guide.md` para entender como usar cada repositório
2. Ler `directives/supabase-setup.md` para configurar Supabase (Fase 2)
3. Ler `directives/design-system.md` para criar componentes base (Fase 4)
