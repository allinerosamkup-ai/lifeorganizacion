# ✅ Checklist de Setup - LifeOrganizer AI

## Status Atual do Projeto

### ✅ CONCLUÍDO

#### FASE 1: Setup de Infraestrutura
- [x] Scripts de execução criados
- [x] Diretivas criadas (5 documentos)
- [x] Estrutura de diretórios completa
- [x] Layout HTML `splash-screen.html` salvo
- [x] `requirements.txt` atualizado

#### FASE 2: Configuração Supabase
- [x] Migration SQL completa criada
- [x] Scripts de configuração criados
- [x] Arquivo `.env` criado
- [x] URL do Supabase configurada: `https://bmvqtzxdrnbioxhiiosr.supabase.co`
- [x] Chave parcial adicionada ao `.env`

#### FASE 3: Edge Functions
- [x] `calculate-cycle-phase` - Criada ✅
- [x] `process-checkin` - Criada ✅
- [x] `generate-daily-suggestions` - Criada ✅
- [x] `update-weekly-learning` - Criada ✅
- [x] Diretiva `edge-functions.md` criada

---

## ⚠️ AÇÕES NECESSÁRIAS

### 1. Completar Credenciais do Supabase

**Status:** Chave parcial adicionada, mas precisa verificar se está completa.

**Ação:**
1. Acesse: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/settings/api
2. Verifique se a chave `anon public` está completa (normalmente começa com `eyJ...` e é muito longa)
3. Se a chave no `.env` estiver incompleta, substitua pela chave completa
4. Copie também a chave `service_role` → adicione ao `.env` como `SUPABASE_SERVICE_ROLE_KEY`

**Verificar:**
```bash
python execution/test_supabase_connection.py
```

### 2. Aplicar Migration SQL

**Status:** Migration criada, mas não aplicada ainda.

**Ação:**
1. Acesse: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/sql/new
2. Abra: `supabase/migrations/20240220000001_initial_schema.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Execute (Run ou Ctrl+Enter)

**Verificar:**
```bash
python execution/apply_migration.py verify
```

**Tabelas esperadas (7):**
- ✅ profiles
- ✅ check_ins
- ✅ tasks
- ✅ cycle_data
- ✅ ai_suggestions
- ✅ weekly_learnings
- ✅ focus_sessions

### 3. Obter Claude API Key

**Quando necessário:** Para testar Edge Functions que usam IA.

**Ação:**
1. Acesse: https://console.anthropic.com/
2. Crie conta ou faça login
3. Gere API key
4. Adicione ao `.env` como `CLAUDE_API_KEY`
5. Configure também no Supabase Dashboard → Settings → Edge Functions → Secrets

### 4. Deploy das Edge Functions

**Após ter `CLAUDE_API_KEY` configurada:**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref bmvqtzxdrnbioxhiiosr

# Deploy das funções
supabase functions deploy calculate-cycle-phase
supabase functions deploy process-checkin
supabase functions deploy generate-daily-suggestions
supabase functions deploy update-weekly-learning
```

---

## 📋 Próximas Fases (Aguardando Setup)

### FASE 4: Design System
- Criar componentes base reutilizáveis
- Extrair tokens de design
- Configurar tema TailwindCSS

### FASE 5: Autenticação e Onboarding
- Converter layouts HTML para React
- Implementar fluxo de auth
- Implementar onboarding

---

## 🔍 Verificações Rápidas

### Verificar Conexão Supabase
```bash
python execution/test_supabase_connection.py
```

### Verificar Tabelas Criadas
```bash
python execution/test_supabase_connection.py --check-tables
```

### Verificar Migration
```bash
python execution/apply_migration.py verify
```

---

## 📝 Notas Importantes

1. **Chave Supabase:** A chave fornecida parece incompleta. Verifique se é a chave completa no dashboard.

2. **Migration SQL:** Deve ser aplicada manualmente via SQL Editor do Supabase (não há API para isso).

3. **Edge Functions:** Podem ser deployadas mesmo sem `CLAUDE_API_KEY`, mas não funcionarão completamente até a chave ser configurada.

4. **Segurança:** Nunca commitar `.env` no Git. O arquivo já está no `.gitignore`.

---

## 🎯 Próximo Passo Imediato

1. ✅ Verificar se a chave do Supabase está completa
2. ⏳ Aplicar migration SQL no dashboard
3. ⏳ Verificar se tabelas foram criadas
4. ⏳ Obter `CLAUDE_API_KEY` quando necessário
5. ⏳ Deploy das Edge Functions

---

**Última atualização:** 20/02/2026
