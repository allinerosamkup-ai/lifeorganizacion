# 🚀 Guia Rápido: Configurar Supabase

## ✅ Status Atual

- ✅ Project Ref identificado: `bmvqtzxdrnbioxhiiosr`
- ✅ Supabase URL configurada no `.env`
- ⏳ **PRÓXIMO:** Adicionar chaves de API

## 📋 Passo a Passo

### 1. Obter Chaves de API do Supabase

1. Acesse o dashboard: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/settings/api

2. Você verá duas chaves importantes:
   - **`anon public`** → Esta é a chave pública (pode ser usada no frontend)
   - **`service_role`** → Esta é a chave privada (⚠️ NUNCA exponha no frontend!)

3. Copie ambas as chaves

### 2. Adicionar ao arquivo `.env`

Abra o arquivo `.env` e adicione as chaves:

```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (sua chave aqui)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (sua chave aqui)
```

### 3. Aplicar Migration SQL

1. Acesse o SQL Editor: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/sql/new

2. Abra o arquivo: `supabase/migrations/20240220000001_initial_schema.sql`

3. Copie TODO o conteúdo do arquivo

4. Cole no SQL Editor do Supabase

5. Clique em "Run" ou pressione `Ctrl+Enter`

6. Verifique se apareceu "Success. No rows returned"

### 4. Verificar Tabelas Criadas

1. Vá para "Table Editor" no dashboard: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/editor

2. Você deve ver 7 tabelas criadas:
   - ✅ `profiles`
   - ✅ `check_ins`
   - ✅ `tasks`
   - ✅ `cycle_data`
   - ✅ `ai_suggestions`
   - ✅ `weekly_learnings`
   - ✅ `focus_sessions`

### 5. Testar Conexão

Execute (quando tiver as chaves configuradas):

```bash
python execution/test_supabase_connection.py
```

Ou verificar tabelas:

```bash
python execution/test_supabase_connection.py --check-tables
```

## ✅ Checklist

- [ ] Chaves de API adicionadas ao `.env`
- [ ] Migration SQL aplicada com sucesso
- [ ] 7 tabelas criadas e visíveis no Table Editor
- [ ] Teste de conexão bem-sucedido

## 🎯 Próximos Passos

Após completar este checklist:

1. ✅ Continuar com **FASE 3: Edge Functions Essenciais**
2. Criar Edge Function `calculate-cycle-phase`
3. Criar Edge Function `process-checkin`
4. E assim por diante...

## 🆘 Problemas Comuns

### Erro ao aplicar migration

- Verifique se não há tabelas com nomes conflitantes
- Certifique-se de que está executando a migration completa
- Verifique os logs de erro no SQL Editor

### Tabelas não aparecem

- Aguarde alguns segundos após executar a migration
- Recarregue a página do Table Editor
- Verifique se não há erros no SQL Editor

### Chaves não funcionam

- Verifique se copiou as chaves completas (são muito longas)
- Certifique-se de que não há espaços extras
- Verifique se está usando as chaves do projeto correto

---

**Precisa de ajuda?** Consulte `directives/supabase-setup.md` para guia completo.
