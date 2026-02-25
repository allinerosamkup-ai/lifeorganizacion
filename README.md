# LifeOrganizer AI

Sistema Operacional Pessoal Adaptativo que combina rastreamento do ciclo menstrual, qualidade do sono e padrões de humor para gerar sugestões de tarefas inteligentes via IA.

## 🎯 Visão Geral

O LifeOrganizer AI aprende o ritmo biológico da usuária e agenda tarefas nos momentos ideais de energia, baseado em:
- **Fase do ciclo menstrual:** Fase folicular = criatividade alta, fase luteal = tarefas de rotina, menstrual = descanso
- **Check-in diário:** Análise em linguagem natural que reajusta toda a agenda
- **Memória adaptativa:** Sistema aprende padrões e melhora sugestões ao longo do tempo

## 🏗️ Arquitetura

O projeto segue uma **arquitetura de 3 camadas** definida em `Agent.md`:

1. **Camada 1 - Diretivas** (`directives/`): SOPs em Markdown definindo objetivos e processos
2. **Camada 2 - Orquestração**: Decisões inteligentes e roteamento
3. **Camada 3 - Execução** (`execution/`): Scripts Python determinísticos

## 🛠️ Stack Técnica

- **Frontend:** Lovable.dev (React + TypeScript + TailwindCSS)
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Automações:** n8n Cloud
- **IA:** Claude API (Anthropic)
- **Pagamentos:** Stripe
- **Deploy:** Azure Static Web App

## 📁 Estrutura do Projeto

```
lifeorganizacion/
├── directives/          # SOPs em Markdown
├── execution/          # Scripts Python determinísticos
├── layouts/            # Layouts HTML estáticos (prontos para conversão)
├── references/         # Repositórios GitHub clonados para referência
├── supabase/           # Migrations SQL e Edge Functions
│   └── migrations/    # Migrations do banco de dados
├── .tmp/              # Arquivos intermediários (sempre regeneráveis)
├── .env               # Variáveis de ambiente (não versionado)
└── Agent.md           # Arquitetura de 3 camadas
```

## 🚀 Início Rápido

### 1. Configurar Ambiente

```bash
# Instalar dependências Python
pip install -r requirements.txt

# Verificar ambiente
python execution/setup_dev_environment.py

# Clonar repositórios de referência
python execution/clone_references.py
```

### 2. Configurar Supabase

1. Criar projeto em https://supabase.com
2. Aplicar migration inicial:
   ```bash
   # Via SQL Editor no dashboard ou
   supabase db push
   ```
3. Configurar variáveis de ambiente no `.env`:
   ```env
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-anon-key
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   ```

Veja `directives/supabase-setup.md` para guia completo.

### 3. Próximos Passos

Seguir as fases do plano em ordem:
1. ✅ FASE 1: Setup de Infraestrutura
2. 🔄 FASE 2: Configuração Supabase
3. ⏳ FASE 3: Edge Functions Essenciais
4. ⏳ FASE 4: Design System
5. ⏳ FASE 5+: Frontend e Features

## 📚 Documentação

- `Agent.md` - Arquitetura de 3 camadas
- `directives/` - Guias e SOPs de cada fase
- `directives/references-guide.md` - Como usar repositórios de referência
- `directives/layouts-guide.md` - Guia de conversão HTML → React

## 🔐 Segurança

- ⚠️ Nunca commitar `.env` no Git
- ⚠️ `SERVICE_ROLE_KEY` deve ser mantido secreto
- ✅ RLS (Row Level Security) habilitado em todas as tabelas
- ✅ Validação de inputs em Edge Functions

## 📝 Licença

Proprietário - Todos os direitos reservados

## 🤝 Contribuindo

Este é um projeto privado. Para sugestões ou problemas, abra uma issue.

---

**Status:** 🚧 Em Desenvolvimento  
**Versão:** 0.1.0  
**Última atualização:** Fevereiro 2026
