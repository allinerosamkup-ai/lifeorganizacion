# 🚀 Próximos Passos - Airia Flow

## ✅ Status Atual

- ✅ Chaves do Supabase configuradas no `.env`
- ✅ Migration SQL criada e pronta
- ✅ 4 Edge Functions criadas
- ✅ Migration SQL aplicada com sucesso

## 📋 Checklist Imediato

### 1. Aplicar Migration SQL ✅ CONCLUÍDO

**Ação necessária:**

1. Acesse o SQL Editor:

   ```
   https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/sql/new
   ```

2. Abra o arquivo de migration:

   ```sql
   supabase/migrations/20240220000001_initial_schema.sql
   ```

3. Copie TODO o conteúdo do arquivo

4. Cole no SQL Editor do Supabase

5. Clique em "Run" ou pressione `Ctrl+Enter`

6. Verifique se apareceu: "Success. No rows returned"

7. Verifique as tabelas criadas:

   ```
   https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/editor
   ```

**Tabelas esperadas (7):**

- ✅ profiles
- ✅ check_ins
- ✅ tasks
- ✅ cycle_data
- ✅ ai_suggestions
- ✅ weekly_learnings
- ✅ focus_sessions

**Verificar após aplicar:**

```bash
python execution/verify_supabase_setup.py
```

---

### 2. Verificar Configuração Completa

Execute:

```bash
python execution/verify_supabase_setup.py
```

Isso vai verificar:

- ✅ Variáveis de ambiente configuradas
- ✅ Conexão com Supabase funcionando
- ✅ Tabelas criadas corretamente

---

### 3. Obter OpenAI API Key (Quando Necessário)

**Para testar Edge Functions que usam IA (ex: gpt-4o):**

1. Acesse: <https://platform.openai.com/>
2. Crie conta ou faça login
3. Gere API key em API keys
4. Adicione ao `.env`:

   ```env
   OPENAI_API_KEY=sua-chave-aqui
   ```

5. Configure também no Supabase Dashboard:
   - Settings → Edge Functions → Secrets
   - Adicionar: `OPENAI_API_KEY` = sua-chave

---

### 4. Deploy das Edge Functions

**Após ter `OPENAI_API_KEY` configurada:**

```bash
# Instalar Supabase CLI (se ainda não tiver)
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

## 🎯 Ordem Recomendada de Execução

### HOJE

1. ✅ Aplicar migration SQL
2. ✅ Verificar tabelas criadas
3. ✅ Testar conexão

### ESTA SEMANA

1. ✅ Obter `OPENAI_API_KEY`
2. ✅ Deploy das Edge Functions
3. ✅ Testar Edge Functions (Simulado via CLI Deployment Sucesso)
4. ✅ Preparação do Frontend Migrando de Stitch HTML

### FASE ATUAL: FASE 4 - Design System e Frontend Base

- ✅ Inicializar projeto React/Vite na pasta `frontend`
- ✅ Configurar dependências (Tailwind, Lucide)
- ✅ Definir `tailwind.config.ts` unificado e variáveis `index.css`
- ✅ Componentizar telas derivadas do Stitch (Welcome, Dashboard, Onboarding, Cycle, Profile, Chat, Focus, Sanctuary)

---
**ESTADO ATUAL DO APP:** Infraestrutura Backend (Supabase + Edge Functions + N8N Sync) concluída e autenticação pronta. Migração dos arquivos Stitch base para React iniciada.

## 📞 Quando Precisar de Ajuda

- **Migration SQL:** Veja `directives/supabase-setup.md`
- **Edge Functions:** Veja `directives/edge-functions.md`
- **Setup geral:** Veja `SETUP_SUPABASE.md`
- **Progresso:** Veja `PROGRESSO.md`

---

**Última atualização:** 20/02/2026
