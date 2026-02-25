# Guia de Referências - Repositórios Clonados

Este documento explica como usar cada repositório clonado em `references/` como referência durante o desenvolvimento.

## Estrutura

```
references/
├── insights-lm/        # Padrões Lovable+Supabase+n8n
├── next-stripe/        # Auth+Stripe+Supabase completo
├── peri/              # Algoritmo ciclo menstrual
└── launch-mvp/        # Triggers + Edge Functions + Automações
```

---

## 1. insights-lm (`theaiautomators/insights-lm-public`)

### O que é

Projeto open-source que usa a mesma stack: Lovable.dev + Supabase + n8n Cloud. Sistema de RAG (Retrieval-Augmented Generation) para chat com documentos.

### O que extrair

#### Estrutura de Edge Functions
- **Localização:** `supabase/functions/`
- **Uso:** Referência para estrutura e padrões de Edge Functions
- **Exemplos:**
  - Como organizar funções
  - Como fazer chamadas à Claude API
  - Como estruturar respostas JSON

#### Padrões Supabase ↔ n8n
- **Localização:** `n8n/` (workflows JSON)
- **Uso:** Ver como integrar Supabase com n8n Cloud
- **Exemplos:**
  - Webhooks do Supabase para n8n
  - Queries do Supabase via n8n
  - Automações baseadas em eventos

#### Sistema de RAG
- **Localização:** `src/` (frontend React)
- **Uso:** Adaptar para organização inteligente de tarefas
- **Conceitos:**
  - Como estruturar contexto para IA
  - Como fazer embeddings e busca semântica
  - Como gerar respostas baseadas em contexto

### Como usar

1. **Para Edge Functions:**
   ```bash
   cd references/insights-lm/supabase/functions
   # Estudar estrutura de uma função exemplo
   ```

2. **Para n8n workflows:**
   ```bash
   cd references/insights-lm/n8n
   # Importar workflows JSON no n8n Cloud
   ```

3. **Para padrões de código:**
   - Ler código fonte como referência
   - Adaptar padrões para nosso contexto
   - Não copiar diretamente, mas usar como guia

---

## 2. next-stripe (`KolbySisk/next-supabase-stripe-starter`)

### O que é

Template completo de SaaS com Next.js, Supabase Auth e Stripe Billing. Inclui autenticação, assinaturas e gerenciamento de usuários.

### O que extrair

#### Sistema de Autenticação
- **Localização:** `src/app/auth/` e `src/features/auth/`
- **Uso:** Implementar fluxo completo de auth no LifeOrganizer
- **Componentes:**
  - Sign up / Sign in
  - Email verification
  - Password reset
  - OAuth (Google, GitHub)

#### Integração Stripe
- **Localização:** `src/features/billing/` e `supabase/functions/stripe-webhook/`
- **Uso:** Implementar sistema de planos e pagamentos
- **Funcionalidades:**
  - Checkout Session
  - Webhook handling
  - Customer Portal
  - Subscription management

#### Migrations Supabase
- **Localização:** `supabase/migrations/`
- **Uso:** Referência para estrutura de migrations
- **Exemplos:**
  - Como criar tabelas
  - Como configurar RLS
  - Como criar triggers

#### Páginas pré-construídas
- **Localização:** `src/app/`
- **Uso:** Referência para estrutura de páginas
- **Páginas:**
  - Dashboard
  - Pricing
  - Account/Settings

### Como usar

1. **Para Auth:**
   ```bash
   cd references/next-stripe/src/features/auth
   # Estudar componentes e hooks de autenticação
   ```

2. **Para Stripe:**
   ```bash
   cd references/next-stripe/src/features/billing
   # Ver como criar Checkout Sessions
   # Ver como processar webhooks
   ```

3. **Para Migrations:**
   ```bash
   cd references/next-stripe/supabase/migrations
   # Adaptar estrutura para nosso schema
   ```

---

## 3. peri (`IraSoro/peri`)

### O que é

App de rastreamento de ciclo menstrual em Ionic/React. Contém algoritmo preciso de cálculo de fases do ciclo.

### O que extrair

#### Algoritmo de Cálculo de Fase
- **Localização:** `src/utils/cycle-calculations.ts` ou similar
- **Uso:** Adaptar para Edge Function `calculate-cycle-phase`
- **Funcionalidades:**
  - Cálculo de fase atual (folicular, ovulação, lútea, menstrual)
  - Dia do ciclo
  - Previsão de próxima fase
  - Percentual de progresso na fase atual

#### Lógica de Datas
- **Localização:** `src/utils/` (funções de data)
- **Uso:** Calcular datas baseadas em ciclo
- **Exemplos:**
  - Como calcular dias desde última menstruação
  - Como prever próxima menstruação
  - Como calcular janela fértil

### Como usar

1. **Extrair algoritmo:**
   ```bash
   cd references/peri/src/utils
   # Encontrar função de cálculo de fase
   # Adaptar para TypeScript/Deno (Edge Functions)
   ```

2. **Testar lógica:**
   - Criar testes unitários para o algoritmo
   - Validar com dados reais de ciclo
   - Adaptar para nosso schema de dados

3. **Implementar Edge Function:**
   - Usar algoritmo extraído
   - Adaptar para nosso formato de resposta
   - Integrar com tabela `profiles`

---

## 4. launch-mvp (`ShenSeanChen/launch-mvp-stripe-nextjs-supabase`)

### O que é

Template de MVP com Next.js, Supabase, Stripe. Foca em automações usando pg_net e Edge Functions.

### O que extrair

#### Sistema de Triggers com pg_net
- **Localização:** `supabase/scripts/` ou `supabase/migrations/`
- **Uso:** Criar triggers que disparam webhooks
- **Funcionalidades:**
  - Trigger on user create → webhook n8n
  - Trigger on subscription update → webhook Stripe
  - Trigger on check-in → análise automática

#### Edge Functions para Automação
- **Localização:** `supabase/functions/`
- **Uso:** Criar funções que rodam em background
- **Exemplos:**
  - Envio de emails
  - Processamento assíncrono
  - Integração com APIs externas

#### Email Automation
- **Localização:** `emails/` ou `supabase/functions/`
- **Uso:** Templates de email transacionais
- **Tipos:**
  - Welcome email
  - Billing alerts
  - Weekly digest

#### Database Triggers
- **Localização:** `supabase/migrations/` ou SQL scripts
- **Uso:** Automações baseadas em eventos do banco
- **Exemplos:**
  - Auto-popular campos
  - Validar dados
  - Disparar ações

### Como usar

1. **Para Triggers:**
   ```bash
   cd references/launch-mvp/supabase
   # Estudar como configurar pg_net
   # Ver exemplos de triggers
   ```

2. **Para Edge Functions:**
   ```bash
   cd references/launch-mvp/supabase/functions
   # Ver padrões de automação
   ```

3. **Para Emails:**
   ```bash
   cd references/launch-mvp/emails
   # Adaptar templates React Email
   ```

---

## Estratégia de Uso

### 1. Não copiar diretamente
- Use como referência e inspiração
- Adapte para nosso contexto específico
- Mantenha consistência com nosso design system

### 2. Estudar antes de implementar
- Leia o código fonte
- Entenda os padrões
- Documente aprendizados em notas

### 3. Manter atualizado
- Periodicamente fazer `git pull` nos repositórios
- Verificar se há melhorias ou correções
- Não modificar os repositórios diretamente

### 4. Documentar adaptações
- Quando adaptar código, documentar mudanças
- Explicar por que adaptamos de certa forma
- Manter notas em `directives/` sobre aprendizados

## Próximos Passos

Após entender os repositórios:

1. **Fase 2:** Usar `next-stripe` para configurar Supabase
2. **Fase 3:** Usar `peri` para criar Edge Function de ciclo
3. **Fase 4:** Usar `insights-lm` para padrões de Edge Functions
4. **Fase 9:** Usar `launch-mvp` para automações n8n
