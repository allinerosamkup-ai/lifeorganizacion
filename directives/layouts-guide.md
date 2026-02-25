# Guia de Layouts HTML

Este documento explica como usar os layouts HTML fornecidos e convertê-los para componentes React no Lovable.dev.

## Estrutura de Layouts

```
layouts/
├── splash-screen.html          # Tela inicial
├── interacao-ia.html          # Chat com IA
├── insights-avancados.html    # Insights e métricas
├── dashboard.html             # Dashboard principal
├── calendario.html            # Calendário mensal
├── agenda.html                # Agenda diária
├── modo-foco.html             # Timer Pomodoro
├── onboarding-passo1.html     # Onboarding passo 1
├── configuracoes.html         # Configurações
└── planos.html                # Planos e preços
```

## Estilos Visuais

### Luxo Tranquilo
- **Paleta:** Tons suaves e acolhedores
- **Cores primárias:** #f59e8b, #e9967a, #D4A373, #FFDAB9
- **Backgrounds:** #fffaf7, #fff0e5, #FAF9F6
- **Tipografia:** Inter font weights 300-400 (light)
- **Bordas:** Arredondadas generosas (xl: 1.5rem-2rem)

### Luxo Refinado
- **Paleta:** Mais vibrante e sofisticada
- **Primary:** #7830c0 (roxo)
- **Accent-salmon:** #ffa07a
- **Backgrounds:** #fdfcfb, #19131f
- **Efeitos:** Glass effects, backdrop blur
- **Elementos:** Decorativos sutis

## Processo de Conversão HTML → React

### Template de Prompt para Lovable.dev

```
Converta esse HTML estático em componente React funcional.

- Mantenha 100% do design: cores (#7830c0 primary, Inter, TailwindCSS)
- Dark mode via classe .dark já funcionando
- Conecte ao Supabase usando o client já configurado no projeto
- Ao clicar no botão principal: [AÇÃO ESPECÍFICA]
- Use React Router para navegar para [PRÓXIMA_TELA]
- Loading state com animate-pulse durante chamadas assíncronas
- Trate erros com toast notifications (sonner ou react-hot-toast)
```

### Passos de Conversão

1. **Analisar o Layout HTML**
   - Identificar componentes reutilizáveis (usar do Design System)
   - Identificar estados (loading, error, success)
   - Identificar interações (cliques, inputs, navegação)

2. **Mapear para Componentes do Design System**
   - Button → usar componente `Button` do Design System
   - Input → usar componente `Input` do Design System
   - Card → usar componente `Card` do Design System
   - etc.

3. **Identificar Integrações**
   - Quais Edge Functions serão chamadas?
   - Quais dados do Supabase serão usados?
   - Quais rotas de navegação?

4. **Converter para React**
   - Usar prompt template acima no Lovable.dev
   - Manter estrutura HTML/CSS original
   - Adicionar lógica React (useState, useEffect, etc.)
   - Conectar com Supabase e Edge Functions

5. **Testar e Refinar**
   - Testar em diferentes tamanhos de tela
   - Testar dark mode
   - Testar interações
   - Ajustar conforme necessário

## Layouts por Funcionalidade

### 1. Splash Screen (`splash-screen.html`)

**Estilo:** Luxo Tranquilo  
**Componentes principais:**
- Logo floral SVG
- CTA "Começar Jornada"
- Elementos decorativos

**Conversão:**
- Botão deve navegar para `/auth/signup` ou `/auth/login`
- Verificar se usuário já está autenticado → redirecionar para `/dashboard`

**Integrações:**
- Nenhuma (tela estática)

---

### 2. Interação com IA (`interacao-ia.html`)

**Estilo:** Luxo Refinado/Tranquilo  
**Componentes principais:**
- Chat interface (mensagens AI/User)
- Quick actions (Rever agenda, Adicionar hábito, Resumo do dia)
- Input com mic e send button
- Summary cards com propostas

**Conversão:**
- Input deve chamar Edge Function `process-checkin`
- Mensagens devem ser renderizadas dinamicamente
- Quick actions devem ter handlers específicos

**Integrações:**
- Edge Function: `process-checkin`
- Tabela: `check_ins`
- Real-time: Atualizar mensagens sem reload

---

### 3. Insights Avançados (`insights-avancados.html`)

**Estilo:** Luxo Refinado  
**Componentes principais:**
- Biological Rhythm Chart (SVG wave)
- Metabolic Metrics cards (Sleep, Energy, Recovery)
- AI Learnings section
- Sleep Architecture breakdown

**Conversão:**
- Gráficos SVG devem ser componentes React
- Dados devem vir de `check_ins` e `weekly_learnings`
- Time range selector (Day/Week/Month) deve filtrar dados

**Integrações:**
- Tabelas: `check_ins`, `weekly_learnings`
- Edge Function: `update-weekly-learning` (para dados semanais)

---

### 4. Dashboard (`dashboard.html`)

**Estilo:** Luxo Tranquilo  
**Componentes principais:**
- Cycle Phase card com progress ring
- Daily Energy summary (Sleep, Vibe)
- Recommended Tasks cards
- Bottom navigation

**Conversão:**
- Cycle Phase card deve chamar `calculate-cycle-phase`
- Recommended Tasks devem vir de `generate-daily-suggestions`
- Cards de energia devem mostrar dados do último check-in

**Integrações:**
- Edge Functions: `calculate-cycle-phase`, `generate-daily-suggestions`
- Tabelas: `profiles`, `check_ins`, `tasks`

---

### 5. Calendário (`calendario.html`)

**Estilo:** Luxo Tranquilo/Refinado  
**Componentes principais:**
- Grid mensal com energy glows
- Today's Rituals (eventos do dia)
- Navegação entre meses
- Indicadores de energia por dia

**Conversão:**
- Grid deve ser gerado dinamicamente baseado na data
- Energy glows devem usar dados de `check_ins`
- Eventos devem vir de `tasks` filtrados por data

**Integrações:**
- Tabelas: `tasks`, `check_ins`
- Edge Function: `calculate-cycle-phase` (para cada dia)

---

### 6. Agenda Diária (`agenda.html`)

**Estilo:** Luxo Tranquilo  
**Componentes principais:**
- Timeline manhã/tarde/noite
- Date selector horizontal
- Progress bar diário
- Task cards com checkboxes

**Conversão:**
- Timeline deve agrupar tarefas por período do dia
- Date selector deve permitir navegação entre dias
- Progress bar deve calcular % de tarefas completadas
- Checkboxes devem atualizar `tasks.is_completed`

**Integrações:**
- Tabela: `tasks`
- Real-time: Atualizar progress ao completar tarefa

---

### 7. Modo Foco (`modo-foco.html`)

**Estilo:** Luxo Tranquilo  
**Componentes principais:**
- Timer SVG circular com countdown
- Controles -5/+5 min
- Modo imersivo toggle
- Mensagem motivacional

**Conversão:**
- Timer deve usar `useFocusTimer` hook
- SVG deve atualizar stroke-dashoffset em tempo real
- Ao completar, salvar em `focus_sessions`
- Web Audio API para som de notificação

**Integrações:**
- Tabela: `focus_sessions`
- Hook: `useFocusTimer` (do Design System)

---

### 8. Onboarding Passo 1 (`onboarding-passo1.html`)

**Estilo:** Luxo Tranquilo  
**Componentes principais:**
- Date picker última menstruação
- Sliders ciclo (21-35 dias) e lútea (10-16 dias)
- Progress indicator (25%)
- Botão continuar

**Conversão:**
- Sliders devem usar componente `Slider` do Design System
- Date picker deve usar componente `Input` type="date"
- Ao continuar, salvar em `profiles` e navegar para passo 2

**Integrações:**
- Tabela: `profiles`
- Navegação: `/onboarding/2`

---

### 9. Configurações (`configuracoes.html`)

**Estilo:** Luxo Tranquilo  
**Componentes principais:**
- Profile card com avatar
- Integrações (Google Calendar, Apple Health, WhatsApp)
- Preferências (Idioma)
- Privacidade e dados
- Logout

**Conversão:**
- Toggles devem atualizar `profiles` em tempo real
- Avatar upload deve usar Supabase Storage
- Logout deve chamar `supabase.auth.signOut()`

**Integrações:**
- Tabela: `profiles`
- Storage: Avatares
- Auth: Sign out

---

### 10. Planos e Preços (`planos.html`)

**Estilo:** Luxo Tranquilo  
**Componentes principais:**
- 3 cards: Essencial (Free), Equilíbrio (Pro), Plenitude (Enterprise)
- Toggle mensal/anual
- FAQ com details
- Botão "Assinar Pro"

**Conversão:**
- Cards devem destacar plano atual do usuário
- Botão "Assinar Pro" deve criar Stripe Checkout Session
- FAQ deve usar componente `<details>` nativo

**Integrações:**
- Stripe: Checkout Session
- Tabela: `profiles.plan`

## Checklist de Conversão

Para cada layout convertido:

- [ ] Design mantido 100% fiel ao original
- [ ] Componentes do Design System utilizados
- [ ] Dark mode funcionando
- [ ] Integrações com Supabase/Edge Functions implementadas
- [ ] Loading states adicionados
- [ ] Tratamento de erros implementado
- [ ] Navegação funcionando
- [ ] Responsivo (mobile-first)
- [ ] Acessível (WCAG 2.1 AA)
- [ ] Testado em diferentes navegadores

## Próximos Passos

1. **Fase 4:** Criar Design System com componentes base
2. **Fase 5:** Converter layouts de Auth usando Design System
3. **Fase 6:** Converter Dashboard e Check-in
4. **Fase 7:** Converter sistema de Tarefas
5. Continuar convertendo layouts conforme desenvolvimento avança
