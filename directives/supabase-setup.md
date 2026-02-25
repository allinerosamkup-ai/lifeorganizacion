# Setup Supabase - Configuração Completa

## Objetivo

Configurar projeto Supabase com todas as tabelas, políticas RLS, triggers e extensões necessárias para o LifeOrganizer AI.

## Entradas

- Conta Supabase (criar em https://supabase.com)
- Acesso ao dashboard do Supabase
- Credenciais do projeto (serão solicitadas quando necessário)

## Ferramentas/Scripts

- `supabase/migrations/20240220000001_initial_schema.sql` - Migration inicial completa
- `execution/create_supabase_project.py` - Script auxiliar (futuro)
- `execution/migrate_schema.py` - Script para aplicar migrations (futuro)
- `execution/setup_rls.py` - Script para verificar RLS (futuro)

## Processo Passo a Passo

### 1. Criar Projeto no Supabase

1. Acessar https://supabase.com
2. Fazer login ou criar conta
3. Clicar em "New Project"
4. Preencher:
   - **Name:** LifeOrganizer AI
   - **Database Password:** Gerar senha forte (salvar em local seguro)
   - **Region:** Escolher região mais próxima (ex: South America - São Paulo)
   - **Pricing Plan:** Free tier para desenvolvimento, Pro para produção

### 2. Habilitar Extensões e Recursos

No dashboard do Supabase:

1. **Settings → API:**
   - Copiar `Project URL` → será `SUPABASE_URL`
   - Copiar `anon public` key → será `SUPABASE_ANON_KEY`
   - Copiar `service_role` key → será `SUPABASE_SERVICE_ROLE_KEY` (manter secreto!)

2. **Settings → Auth:**
   - Habilitar "Email" provider
   - Habilitar "Google" OAuth (configurar depois)
   - Habilitar "Apple" OAuth (configurar depois)
   - Configurar "Site URL" e "Redirect URLs"

3. **Settings → Storage:**
   - Habilitar Storage
   - Criar bucket `avatars` (público)

4. **Settings → Edge Functions:**
   - Habilitar Edge Functions
   - Instalar Supabase CLI para deploy local

### 3. Aplicar Migration Inicial

**Opção A: Via Dashboard SQL Editor**

1. Ir para "SQL Editor" no dashboard
2. Criar nova query
3. Copiar conteúdo de `supabase/migrations/20240220000001_initial_schema.sql`
4. Executar query
5. Verificar se todas as tabelas foram criadas

**Opção B: Via Supabase CLI (Recomendado)**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Linkar projeto local ao projeto remoto
supabase link --project-ref seu-project-ref

# Aplicar migrations
supabase db push
```

### 4. Verificar Tabelas Criadas

No dashboard, ir para "Table Editor" e verificar:

- ✅ `profiles`
- ✅ `check_ins`
- ✅ `tasks`
- ✅ `cycle_data`
- ✅ `ai_suggestions`
- ✅ `weekly_learnings`
- ✅ `focus_sessions`

### 5. Verificar RLS (Row Level Security)

No dashboard, para cada tabela:

1. Ir para "Authentication → Policies"
2. Verificar que RLS está habilitado
3. Verificar que políticas foram criadas corretamente

### 6. Testar Trigger de Criação de Perfil

1. Criar usuário de teste via Auth
2. Verificar se perfil foi criado automaticamente em `profiles`
3. Verificar se `plan` está como 'free'
4. Verificar se `onboarding_completed` está como `false`

### 7. Configurar Variáveis de Ambiente

Adicionar ao `.env`:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

⚠️ **IMPORTANTE:** Nunca commitar `.env` no Git!

## Saídas

- ✅ Projeto Supabase criado e configurado
- ✅ Todas as tabelas criadas com schema correto
- ✅ RLS habilitado e políticas configuradas
- ✅ Trigger `on_auth_user_created` funcionando
- ✅ Extensões habilitadas (uuid-ossp, pg_net)
- ✅ Variáveis de ambiente configuradas

## Edge Cases

1. **Erro ao criar trigger:**
   - Verificar se função `handle_new_user()` foi criada
   - Verificar permissões do usuário do banco
   - Executar função manualmente para testar

2. **RLS bloqueando acesso:**
   - Verificar se usuário está autenticado (`auth.uid()` não é null)
   - Verificar se políticas estão corretas
   - Testar com usuário autenticado

3. **Migration falha:**
   - Verificar se extensões estão habilitadas
   - Verificar se não há conflitos com tabelas existentes
   - Executar migration em partes se necessário

4. **Storage não funciona:**
   - Verificar se bucket foi criado
   - Verificar políticas do bucket
   - Verificar se Storage está habilitado

## Notas e Aprendizados

- Sempre testar RLS após criar tabelas
- Manter `SERVICE_ROLE_KEY` secreto (nunca usar no frontend)
- Usar `ANON_KEY` apenas no frontend
- Documentar mudanças no schema em novas migrations
- Nunca modificar migrations já aplicadas (criar novas)

## Próximos Passos

Após completar esta fase:

1. Ler `directives/edge-functions.md` para criar Edge Functions (Fase 3)
2. Testar criação de usuário e verificar trigger
3. Configurar OAuth providers (Google, Apple) se necessário
4. Preparar para criar Edge Functions

## Checklist de Verificação

- [ ] Projeto Supabase criado
- [ ] Migration aplicada com sucesso
- [ ] Todas as 7 tabelas criadas
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS criadas corretamente
- [ ] Trigger `on_auth_user_created` funcionando
- [ ] Extensões habilitadas (uuid-ossp, pg_net)
- [ ] Storage habilitado e bucket criado
- [ ] Edge Functions habilitadas
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] Teste de criação de usuário bem-sucedido
