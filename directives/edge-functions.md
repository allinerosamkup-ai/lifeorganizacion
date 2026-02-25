# Edge Functions - Guia Completo

## Objetivo

Criar e configurar Edge Functions do Supabase que processam lógica de negócios e integram com Claude API para análise inteligente.

## Entradas

- Projeto Supabase configurado
- `CLAUDE_API_KEY` configurada no `.env` e no Supabase Dashboard
- Supabase CLI instalado (opcional, para deploy local)

## Ferramentas/Scripts

- `supabase/functions/` - Código fonte das Edge Functions
- Supabase CLI: `supabase functions deploy [nome]`
- Dashboard Supabase: Deploy via interface web

## Edge Functions a Criar

### 1. calculate-cycle-phase

**Localização:** `supabase/functions/calculate-cycle-phase/index.ts`

**Função:** Calcula fase atual do ciclo menstrual

**Entrada:**
- `user_id` (do header Authorization)

**Saída:**
```json
{
  "phase": "follicular" | "menstrual" | "ovulation" | "luteal",
  "day_of_cycle": 8,
  "percentage": 45,
  "days_until_next_phase": 5,
  "next_phase": "ovulation"
}
```

**Algoritmo:** Adaptado do repositório `IraSoro/peri`

**Deploy:**
```bash
supabase functions deploy calculate-cycle-phase
```

---

### 2. process-checkin

**Localização:** `supabase/functions/process-checkin/index.ts`

**Função:** Processa check-in diário com análise de IA

**Entrada:**
```json
{
  "free_text": "Dormi mal mas estou animada",
  "humor_emoji": "good",
  "energy_score": 7,
  "sleep_hours": 6.5,
  "sleep_quality": 5
}
```

**Processo:**
1. Busca dados do usuário (perfil, check-ins recentes, tarefas pendentes, aprendizados)
2. Monta payload de 5 camadas de contexto
3. Chama Claude API com prompt estruturado
4. Salva resultado em `check_ins`
5. Retorna análise e sugestões

**Saída:**
```json
{
  "analysis": "Análise personalizada...",
  "predicted_energy": 8,
  "suggested_tasks": [...],
  "cycle_phase": "follicular"
}
```

**Deploy:**
```bash
supabase functions deploy process-checkin
```

---

### 3. generate-daily-suggestions

**Localização:** `supabase/functions/generate-daily-suggestions/index.ts`

**Função:** Gera 3-5 tarefas recomendadas para o dia

**Entrada:**
- `user_id` (do header Authorization)
- Opcional: `date` (padrão: hoje)

**Processo:**
1. Busca contexto completo (igual process-checkin)
2. Chama Claude API com foco em sugestões de tarefas
3. Retorna tarefas estruturadas

**Saída:**
```json
{
  "suggestions": [
    {
      "title": "Mood Boarding",
      "description": "...",
      "energy_level": "high",
      "priority": 4,
      "due_time": "10:00"
    }
  ]
}
```

**Deploy:**
```bash
supabase functions deploy generate-daily-suggestions
```

---

### 4. update-weekly-learning

**Localização:** `supabase/functions/update-weekly-learning/index.ts`

**Função:** Analisa semana de check-ins e atualiza padrões aprendidos

**Entrada:**
- `user_id` (do header Authorization)
- `week_start` (opcional, padrão: início da semana atual)

**Processo:**
1. Busca todos os check-ins da semana
2. Analisa padrões (taxa de sucesso, pico de energia, horários)
3. Salva em `weekly_learnings`
4. Pode ser chamado via cron (n8n) toda sexta 18h

**Saída:**
```json
{
  "success": true,
  "learning": {
    "phase": "follicular",
    "success_rate": 82.5,
    "peak_hour": 10,
    "avg_tasks_completed": 7.2
  }
}
```

**Deploy:**
```bash
supabase functions deploy update-weekly-learning
```

---

### 5. stripe-webhook

**Localização:** `supabase/functions/stripe-webhook/index.ts`

**Função:** Processa webhooks do Stripe para atualizar planos

**Entrada:** Evento do Stripe (customer.subscription.created/updated/deleted)

**Processo:**
1. Verifica assinatura do webhook (Stripe signature)
2. Processa evento
3. Atualiza `profiles.plan` e `profiles.stripe_customer_id`

**Configuração:**
- `verify_jwt: false` (no Supabase Dashboard)
- Webhook URL no Stripe: `https://[projeto].supabase.co/functions/v1/stripe-webhook`

**Deploy:**
```bash
supabase functions deploy stripe-webhook
```

## Processo de Deploy

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar projeto
supabase link --project-ref bmvqtzxdrnbioxhiiosr

# Deploy de uma função
supabase functions deploy calculate-cycle-phase

# Deploy de todas as funções
supabase functions deploy
```

### Opção 2: Via Dashboard

1. Acessar: https://app.supabase.com/project/bmvqtzxdrnbioxhiiosr/functions
2. Criar nova função
3. Colar código do arquivo `index.ts`
4. Configurar variáveis de ambiente (CLAUDE_API_KEY, etc.)
5. Deploy

## Variáveis de Ambiente

Configurar no Supabase Dashboard → Settings → Edge Functions:

- `CLAUDE_API_KEY` - Chave da API Claude (Anthropic)
- `SUPABASE_URL` - URL do projeto (já configurado automaticamente)
- `SUPABASE_SERVICE_ROLE_KEY` - Para operações privilegiadas (se necessário)

## Testes

### Testar Localmente

```bash
# Iniciar Supabase localmente
supabase start

# Invocar função localmente
supabase functions serve calculate-cycle-phase

# Testar com curl
curl -X POST http://localhost:54321/functions/v1/calculate-cycle-phase \
  -H "Authorization: Bearer [token]"
```

### Testar em Produção

```bash
# Obter URL da função
supabase functions list

# Testar com curl
curl -X POST https://bmvqtzxdrnbioxhiiosr.supabase.co/functions/v1/calculate-cycle-phase \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json"
```

## Saídas

- ✅ Todas as Edge Functions criadas e deployadas
- ✅ Variáveis de ambiente configuradas
- ✅ Funções testadas e funcionando
- ✅ Integração com Claude API funcionando

## Edge Cases

1. **Claude API retorna erro:**
   - Verificar se `CLAUDE_API_KEY` está correta
   - Verificar limites de rate
   - Implementar retry logic

2. **Função não encontra dados:**
   - Verificar se RLS permite acesso
   - Verificar se usuário está autenticado
   - Verificar se dados existem no banco

3. **Timeout em funções longas:**
   - Edge Functions têm limite de 60s
   - Para processamento longo, usar filas ou chamadas assíncronas

4. **Erro de CORS:**
   - Verificar headers CORS nas funções
   - Verificar origem da requisição

## Notas e Aprendizados

- Edge Functions rodam em Deno, não Node.js
- Sempre incluir headers CORS
- Validar inputs antes de processar
- Usar `service_role` key apenas quando necessário (operações privilegiadas)
- Documentar mudanças nas funções

## Próximos Passos

Após criar todas as Edge Functions:

1. Testar cada função individualmente
2. Integrar com frontend (Fase 5+)
3. Configurar cron jobs no n8n para `update-weekly-learning`
4. Configurar webhook do Stripe para `stripe-webhook`
