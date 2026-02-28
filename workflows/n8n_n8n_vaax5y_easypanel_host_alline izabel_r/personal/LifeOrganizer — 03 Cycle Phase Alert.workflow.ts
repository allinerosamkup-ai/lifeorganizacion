import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : LifeOrganizer — 03 Cycle Phase Alert
// Nodes   : 7  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Documentacao                       stickyNote                 
// Cron09h00Transicoes                scheduleTrigger            
// BuscarTransicoesEm2Dias            httpRequest                
// LoopPorUsuaria                     splitInBatches             
// OpenaiAlertaDeFase                 httpRequest                
// ParsearAlerta                      code                       
// SalvarNotificacaoApp               httpRequest                
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Cron09h00Transicoes
//    → BuscarTransicoesEm2Dias
//      → LoopPorUsuaria
//        → OpenaiAlertaDeFase
//          → ParsearAlerta
//            → SalvarNotificacaoApp
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "JVtUytFjnuqArnkB",
    name: "LifeOrganizer — 03 Cycle Phase Alert",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveManualExecutions:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class Lifeorganizer—03CyclePhaseAlertWorkflow {

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
        "content": "## 🌙 03 — Cycle Phase Alert\n**Trigger:** Cron 09h00 diário\n\n**Fluxo:** Cron → Buscar transições em 2 dias → Loop → Claude Opus → WhatsApp + Notificação App\n\n**Modelo:** claude-opus-4-6 (saúde/biologia = precisão máxima)",
        "height": 140,
        "width": 900
    };

    @node({
        name: "Cron 09h00 — Transições",
        type: "n8n-nodes-base.scheduleTrigger",
        version: 1.2,
        position: [240, 300]
    })
    Cron09h00Transicoes = {
        "rule": {
            "interval": [
                {
                    "expression": "0 9 * * *",
                    "field": "cronExpression"
                }
            ]
        }
    };

    @node({
        name: "Buscar Transições em 2 Dias",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [460, 300]
    })
    BuscarTransicoesEm2Dias = {
        "bodyParameters": {
            "parameters": [
                {
                    "name": "days_ahead",
                    "value": "2"
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
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/rpc/get_users_near_phase_transition"
    };

    @node({
        name: "Loop por Usuária",
        type: "n8n-nodes-base.splitInBatches",
        version: 3,
        position: [680, 300]
    })
    LoopPorUsuaria = {
        "options": {}
    };

    @node({
        name: "OpenAI — Alerta de Fase",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [900, 300]
    })
    OpenaiAlertaDeFase = {
        "body": "={{ JSON.stringify({ model: 'gpt-4o', max_tokens: 1200, messages: [{ role: 'system', content: 'Especialista em saúde hormonal feminina e produtividade baseada em ciclo. Cada fase é um superpoder diferente. JSON válido sempre.' }, { role: 'user', content: 'Alerta de transição de fase para o LifeOrganizer AI.\\n\\nUsuária: ' + $json.full_name + '\\nFase ATUAL: ' + $json.current_phase + ' dia ' + $json.day_of_cycle + '\\nPróxima fase: ' + $json.next_phase + ' em ' + $json.days_until_transition + ' dia(s)\\n\\nSAÍDA JSON:\\n{\\n  \"notification_title\": \"título push (max 45 chars)\",\\n  \"notification_body\": \"corpo push (max 100 chars)\",\\n  \"whatsapp_message\": \"WhatsApp max 100 palavras com \\\\n entre parágrafos\",\\n  \"biological_insight\": \"insight científico acessível\",\\n  \"affirmation\": \"afirmação motivacionalüaníca\"\\n}' }] }) }}",
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
            "timeout": 30000
        },
        "sendBody": true,
        "sendHeaders": true,
        "url": "https://api.openai.com/v1/chat/completions"
    };

    @node({
        name: "Parsear Alerta",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1120, 300]
    })
    ParsearAlerta = {
        "jsCode": "const item = $input.item.json;\nconst raw = item.choices?.[0]?.message?.content?.replace(/```json\\n?/g, '').replace(/```/g, '').trim() || '{}';\nlet parsed;\ntry { parsed = JSON.parse(raw); } catch(e) {\n  parsed = {\n    notification_title: 'Sua fase está mudando em breve 🌙',\n    notification_body: 'Preparamos insights personalizados para você!',\n    whatsapp_message: 'Sua próxima fase do ciclo está chegando! Abra o app para ver seus insights 🌸',\n    biological_insight: '',\n    affirmation: ''\n  };\n}\nreturn { json: {\n  user_id: item.id,\n  user_phone: item.phone_number,\n  next_phase: item.next_phase,\n  ...parsed\n}};"
    };

    @node({
        name: "Salvar Notificação App",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1340, 400]
    })
    SalvarNotificacaoApp = {
        "bodyParameters": {
            "parameters": [
                {
                    "name": "user_id",
                    "value": "={{ $json.user_id }}"
                },
                {
                    "name": "type",
                    "value": "cycle_phase_alert"
                },
                {
                    "name": "title",
                    "value": "={{ $json.notification_title }}"
                },
                {
                    "name": "body",
                    "value": "={{ $json.notification_body }}"
                },
                {
                    "name": "data",
                    "value": "={{ JSON.stringify({ next_phase: $json.next_phase, biological_insight: $json.biological_insight, affirmation: $json.affirmation }) }}"
                },
                {
                    "name": "created_at",
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
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/notifications"
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.BuscarTransicoesEm2Dias.out(0).to(this.LoopPorUsuaria.in(0));
        this.Cron09h00Transicoes.out(0).to(this.BuscarTransicoesEm2Dias.in(0));
        this.LoopPorUsuaria.out(0).to(this.OpenaiAlertaDeFase.in(0));
        this.OpenaiAlertaDeFase.out(0).to(this.ParsearAlerta.in(0));
        this.ParsearAlerta.out(0).to(this.SalvarNotificacaoApp.in(0));
    }
}