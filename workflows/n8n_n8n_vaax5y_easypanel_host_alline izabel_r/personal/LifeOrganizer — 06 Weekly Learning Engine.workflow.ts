import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : LifeOrganizer — 06 Weekly Learning Engine
// Nodes   : 9  |  Connections: 7
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Documentacao                       stickyNote                 
// CronSexta18h00                     scheduleTrigger            
// BuscarDadosAprendizado             httpRequest                
// LoopPorUsuaria                     splitInBatches             
// Tem2CheckIns                       if                         
// ClaudeMotorAprendizado             httpRequest                
// ParsearPadroes                     code                       
// UpsertPadroesSupabase              httpRequest                
// SkipDadosInsuficientes             noOp                       
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// CronSexta18h00
//    → BuscarDadosAprendizado
//      → LoopPorUsuaria
//        → Tem2CheckIns
//          → ClaudeMotorAprendizado
//            → ParsearPadroes
//              → UpsertPadroesSupabase
//         .out(1) → SkipDadosInsuficientes
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "73ce635Aw0Y7kyug",
    name: "LifeOrganizer — 06 Weekly Learning Engine",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveManualExecutions:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class Lifeorganizer—06WeeklyLearningEngineWorkflow {

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
        "content": "## 🧠 06 — Weekly Learning Engine\n**Trigger:** Cron Sexta-feira 18h00\n\n**Fluxo:** Cron → Buscar dados → Loop → IF ≥ 2 check-ins → Claude Opus (temp 0.3) → Upsert padrões\n\n**Modelo:** claude-opus-4-6 temperature=0.3 (análise estatística rigorosa)\n\n**Output:** tabela weekly_learnings — calibra IA para próximas semanas",
        "height": 155,
        "width": 900
    };

    @node({
        name: "Cron Sexta 18h00",
        type: "n8n-nodes-base.scheduleTrigger",
        version: 1.2,
        position: [240, 300]
    })
    CronSexta18h00 = {
        "rule": {
            "interval": [
                {
                    "field": "cronExpression",
                    "expression": "0 18 * * 5"
                }
            ]
        }
    };

    @node({
        name: "Buscar Dados Aprendizado",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [460, 300]
    })
    BuscarDadosAprendizado = {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/rpc/get_users_weekly_learning_data",
        "sendHeaders": true,
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
        "sendBody": true,
        "contentType": "json",
        "bodyParameters": {
            "parameters": [
                {
                    "name": "weeks_back",
                    "value": "1"
                }
            ]
        },
        "options": {}
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
        name: "Tem ≥ 2 Check-ins?",
        type: "n8n-nodes-base.if",
        version: 2,
        position: [900, 300]
    })
    Tem2CheckIns = {
        "conditions": {
            "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict"
            },
            "conditions": [
                {
                    "id": "c1",
                    "leftValue": "={{ $json.checkins_this_week }}",
                    "rightValue": 2,
                    "operator": {
                        "type": "number",
                        "operation": "gte"
                    }
                }
            ],
            "combinator": "and"
        },
        "options": {}
    };

    @node({
        name: "Claude — Motor Aprendizado",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1120, 200]
    })
    ClaudeMotorAprendizado = {
        "method": "POST",
        "url": "https://api.anthropic.com/v1/messages",
        "sendHeaders": true,
        "headerParameters": {
            "parameters": [
                {
                    "name": "x-api-key",
                    "value": "={{ $env.CLAUDE_API_KEY }}"
                },
                {
                    "name": "anthropic-version",
                    "value": "2023-06-01"
                },
                {
                    "name": "content-type",
                    "value": "application/json"
                }
            ]
        },
        "sendBody": true,
        "contentType": "raw",
        "body": "={{ JSON.stringify({ model: 'claude-opus-4-6', max_tokens: 2000, temperature: 0.3, system: 'Motor analítico especializado em padrões comportamentais femininos. Extrai padrões com rigor estatístico. Prioriza acionabilidade. JSON válido sempre.', messages: [{ role: 'user', content: 'MOTOR DE APRENDIZADO — Extraia padrões desta semana.\\n\\nFase dominante: ' + $json.dominant_phase + '\\nCheck-ins: ' + $json.checkins_this_week + '\\nDados check-ins: ' + JSON.stringify($json.checkins_data || []) + '\\nDados tarefas: ' + JSON.stringify($json.tasks_data || []) + '\\nSessões foco: ' + JSON.stringify($json.focus_sessions || []) + '\\n\\nSAÍDA JSON:\\n{\\n  \"phase_patterns\": {\\n    \"folicular\": {\"avg_energy\": N, \"peak_hour\": \"HH:00\", \"success_rate\": N, \"best_task_types\": []},\\n    \"ovulatoria\": {mesmo},\\n    \"luteal\": {mesmo},\\n    \"menstrual\": {mesmo}\\n  },\\n  \"behavioral_patterns\": {\\n    \"best_day_of_week\": \"str\",\\n    \"focus_session_success_rate\": N,\\n    \"procrastination_triggers\": []\\n  },\\n  \"ai_calibration\": {\\n    \"energy_prediction_adjustment\": N,\\n    \"reminder_optimal_time\": \"HH:MM\",\\n    \"reminder_tone_preference\": \"gentle|motivational|data-driven\"\\n  },\\n  \"key_insight_this_week\": \"insight acionável\",\\n  \"confidence_score\": N_0_a_100,\\n  \"prompt_personalization_hints\": [\"hints para melhorar prompts\"]\\n}' }] }) }}",
        "options": {
            "timeout": 45000
        }
    };

    @node({
        name: "Parsear Padrões",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1340, 200]
    })
    ParsearPadroes = {
        "jsCode": "const item = $input.item.json;\nconst raw = item.content?.[0]?.text?.replace(/```json\\n?/g, '').replace(/```/g, '').trim() || '{}';\nlet p;\ntry { p = JSON.parse(raw); } catch(e) { return { json: { error: 'parse_failed', user_id: item.user_id } }; }\nreturn { json: {\n  user_id: item.user_id,\n  phase: item.dominant_phase,\n  patterns: p,\n  week_date: new Date().toISOString().split('T')[0],\n  confidence_score: p.confidence_score || 50\n}};"
    };

    @node({
        name: "Upsert Padrões Supabase",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1560, 200]
    })
    UpsertPadroesSupabase = {
        "method": "POST",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/weekly_learnings",
        "sendHeaders": true,
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
                    "value": "resolution=merge-duplicates,return=minimal"
                }
            ]
        },
        "sendBody": true,
        "contentType": "json",
        "bodyParameters": {
            "parameters": [
                {
                    "name": "user_id",
                    "value": "={{ $json.user_id }}"
                },
                {
                    "name": "phase",
                    "value": "={{ $json.phase }}"
                },
                {
                    "name": "confidence_score",
                    "value": "={{ $json.confidence_score }}"
                },
                {
                    "name": "behavioral_patterns",
                    "value": "={{ JSON.stringify($json.patterns.behavioral_patterns || {}) }}"
                },
                {
                    "name": "ai_calibration",
                    "value": "={{ JSON.stringify($json.patterns.ai_calibration || {}) }}"
                },
                {
                    "name": "prompt_hints",
                    "value": "={{ JSON.stringify($json.patterns.prompt_personalization_hints || []) }}"
                },
                {
                    "name": "key_insight",
                    "value": "={{ $json.patterns.key_insight_this_week || null }}"
                },
                {
                    "name": "created_at",
                    "value": "={{ new Date().toISOString() }}"
                }
            ]
        },
        "options": {}
    };

    @node({
        name: "Skip — Dados Insuficientes",
        type: "n8n-nodes-base.noOp",
        version: 1,
        position: [1120, 420]
    })
    SkipDadosInsuficientes = {};


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.CronSexta18h00.out(0).to(this.BuscarDadosAprendizado.in(0));
        this.BuscarDadosAprendizado.out(0).to(this.LoopPorUsuaria.in(0));
        this.LoopPorUsuaria.out(0).to(this.Tem2CheckIns.in(0));
        this.Tem2CheckIns.out(0).to(this.ClaudeMotorAprendizado.in(0));
        this.Tem2CheckIns.out(1).to(this.SkipDadosInsuficientes.in(0));
        this.ClaudeMotorAprendizado.out(0).to(this.ParsearPadroes.in(0));
        this.ParsearPadroes.out(0).to(this.UpsertPadroesSupabase.in(0));
    }
}