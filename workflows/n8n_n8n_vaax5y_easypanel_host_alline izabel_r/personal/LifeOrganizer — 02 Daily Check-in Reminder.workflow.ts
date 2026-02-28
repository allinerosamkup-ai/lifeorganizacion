import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : LifeOrganizer — 02 Daily Check-in Reminder
// Nodes   : 9  |  Connections: 7
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Documentacao                       stickyNote                 
// Cron08h00Diario                    scheduleTrigger            
// BuscarUsuariasSemCheckIn           httpRequest                
// HaUsuarias                         if                         
// LoopPorUsuaria                     splitInBatches             
// OpenaiMensagemPersonalizada        httpRequest                
// PrepararAbTest                     code                       
// LogReminder                        httpRequest                
// NenhumaUsuariaStop                 noOp                       
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Cron08h00Diario
//    → BuscarUsuariasSemCheckIn
//      → HaUsuarias
//        → LoopPorUsuaria
//          → OpenaiMensagemPersonalizada
//            → PrepararAbTest
//              → LogReminder
//        → NenhumaUsuariaStop
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "1YJROEHdnAebULrC",
    name: "LifeOrganizer — 02 Daily Check-in Reminder",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveManualExecutions:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class Lifeorganizer—02DailyCheckInReminderWorkflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        name: "📋 Documentação",
        type: "n8n-nodes-base.stickyNote",
        version: 1,
        position: [240, 80]
    })
    Documentacao = {
        "content": "## ⏰ 02 — Daily Check-in Reminder\n**Trigger:** Cron 08h00 diário (Brasília)\n\n**Fluxo:** Cron → Buscar sem check-in → IF tem usuárias → Loop → Claude Haiku → A/B Test → WhatsApp + Log\n\n**Modelo:** claude-haiku-4-5-20251001 (alto volume = custo eficiente)\n\n**A/B Test:** 50% recebem variante B da mensagem",
        "height": 155,
        "width": 900
    };

    @node({
        name: "Cron 08h00 Diário",
        type: "n8n-nodes-base.scheduleTrigger",
        version: 1.2,
        position: [240, 300]
    })
    Cron08h00Diario = {
        "rule": {
            "interval": [
                {
                    "expression": "0 8 * * *",
                    "field": "cronExpression"
                }
            ]
        }
    };

    @node({
        name: "Buscar Usuárias Sem Check-in",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [460, 300]
    })
    BuscarUsuariasSemCheckIn = {
        "bodyParameters": {
            "parameters": [
                {
                    "name": "timezone_offset",
                    "value": "-3"
                }
            ]
        },
        "contentType": "json",
        "headerParameters": {
            "parameters": [
                {
                    "name": "apikey",
                    "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
                },
                {
                    "name": "Authorization",
                    "value": "Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
                },
                {
                    "name": "Content-Type",
                    "value": "application/json"
                }
            ]
        },
        "method": "POST",
        "options": {},
        "sendBody": true,
        "sendHeaders": true,
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/rpc/get_users_without_checkin_today"
    };

    @node({
        name: "Há Usuárias?",
        type: "n8n-nodes-base.if",
        version: 2,
        position: [680, 300]
    })
    HaUsuarias = {
        "conditions": {
            "combinator": "and",
            "conditions": [
                {
                    "id": "c1",
                    "leftValue": "={{ $json.length }}",
                    "operator": {
                        "operation": "gt",
                        "type": "number"
                    },
                    "rightValue": 0
                }
            ],
            "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict"
            }
        },
        "options": {}
    };

    @node({
        name: "Loop por Usuária",
        type: "n8n-nodes-base.splitInBatches",
        version: 3,
        position: [900, 200]
    })
    LoopPorUsuaria = {
        "options": {}
    };

    @node({
        name: "OpenAI — Mensagem Personalizada",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1120, 200]
    })
    OpenaiMensagemPersonalizada = {
        "body": "={{ JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 400, messages: [{ role: 'system', content: 'Especialista em comunicação empática para apps de saúde feminina. Nunca usa linguagem de pressão ou culpa. JSON válido sempre.' }, { role: 'user', content: 'Lembrete de check-in personalizado WhatsApp.\\n\\nNome: ' + ($json.full_name || $json.email.split('@')[0]) + '\\nFase: ' + $json.current_phase + ' dia ' + $json.day_of_cycle + '\\nStreak: ' + $json.streak_days + ' dias\\n\\nREGRAS:\\n- MENSTRUAL: gentil, auto-cuidado, sem pressão\\n- FOLICULAR: energético, criatividade\\n- OVULATÓRIA: confiante, conexões\\n- LUTEAL: acolhedor, valida cansaço\\n\\nSAÍDA JSON:\\n{\"message\": \"msg principal (max 50 palavras)\", \"message_variant_b\": \"variante A/B\"}' }] }) }}",
        "contentType": "raw",
        "headerParameters": {
            "parameters": [
                {
                    "name": "Authorization",
                    "value": "Bearer {{$env.OPENAI_API_KEY}}"
                },
                {
                    "name": "content-type",
                    "value": "application/json"
                }
            ]
        },
        "method": "POST",
        "options": {
            "timeout": 20000
        },
        "sendBody": true,
        "sendHeaders": true,
        "url": "https://api.openai.com/v1/chat/completions"
    };

    @node({
        name: "Preparar + A/B Test",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1340, 200]
    })
    PrepararAbTest = {
        "jsCode": "const item = $input.item.json;\nconst raw = item.choices?.[0]?.message?.content?.replace(/```json\\n?/g, '').replace(/```/g, '').trim() || '{}';\nlet parsed;\ntry { parsed = JSON.parse(raw); } catch(e) {\n  parsed = { message: 'Ei! Que tal fazer seu check-in de hoje? 🌸', message_variant_b: null };\n}\nconst useVariant = Math.random() > 0.5 && parsed.message_variant_b;\nreturn { json: {\n  phone_number: item.phone_number,\n  final_message: useVariant ? parsed.message_variant_b : parsed.message,\n  ab_variant: useVariant ? 'B' : 'A',\n  user_id: item.id\n}};"
    };

    @node({
        name: "Log Reminder",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1780, 200]
    })
    LogReminder = {
        "bodyParameters": {
            "parameters": [
                {
                    "name": "user_id",
                    "value": "={{ $json.user_id }}"
                },
                {
                    "name": "type",
                    "value": "daily_checkin"
                },
                {
                    "name": "channel",
                    "value": "whatsapp"
                },
                {
                    "name": "ab_variant",
                    "value": "={{ $json.ab_variant }}"
                },
                {
                    "name": "sent_at",
                    "value": "={{ new Date().toISOString() }}"
                }
            ]
        },
        "contentType": "json",
        "headerParameters": {
            "parameters": [
                {
                    "name": "apikey",
                    "value": "={{ $env.SUPABASE_SERVICE_KEY }}"
                },
                {
                    "name": "Authorization",
                    "value": "Bearer {{ $env.SUPABASE_SERVICE_KEY }}"
                },
                {
                    "name": "Content-Type",
                    "value": "application/json"
                },
                {
                    "name": "Prefer",
                    "value": "return=minimal"
                }
            ]
        },
        "method": "POST",
        "options": {},
        "sendBody": true,
        "sendHeaders": true,
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/reminder_logs"
    };

    @node({
        name: "Nenhuma Usuária — Stop",
        type: "n8n-nodes-base.noOp",
        version: 1,
        position: [900, 420]
    })
    NenhumaUsuariaStop = {};


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.BuscarUsuariasSemCheckIn.out(0).to(this.HaUsuarias.in(0));
        this.Cron08h00Diario.out(0).to(this.BuscarUsuariasSemCheckIn.in(0));
        this.HaUsuarias.out(0).to(this.LoopPorUsuaria.in(0));
        this.HaUsuarias.out(0).to(this.NenhumaUsuariaStop.in(0));
        this.LoopPorUsuaria.out(0).to(this.OpenaiMensagemPersonalizada.in(0));
        this.OpenaiMensagemPersonalizada.out(0).to(this.PrepararAbTest.in(0));
        this.PrepararAbTest.out(0).to(this.LogReminder.in(0));
    }
}