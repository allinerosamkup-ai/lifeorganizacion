import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : LifeOrganizer — 04 Weekly Insights Digest
// Nodes   : 7  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Documentacao                       stickyNote                 
// CronSegunda07h00                   scheduleTrigger            
// BuscarDadosSemanais                httpRequest                
// LoopPorUsuaria                     splitInBatches             
// OpenaiDigestSemanal                httpRequest                
// ParsearDigest                      code                       
// SalvarRelatorioSupabase            httpRequest                
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// CronSegunda07h00
//    → BuscarDadosSemanais
//      → LoopPorUsuaria
//        → OpenaiDigestSemanal
//          → ParsearDigest
//            → SalvarRelatorioSupabase
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "NuCshHPPBMt2JHSo",
    name: "LifeOrganizer — 04 Weekly Insights Digest",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveManualExecutions:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class Lifeorganizer—04WeeklyInsightsDigestWorkflow {

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
        "content": "## 📊 04 — Weekly Insights Digest\n**Trigger:** Cron Segunda-feira 07h00\n\n**Fluxo:** Cron → Buscar dados semana → Loop → Claude Opus → WhatsApp + Salvar relatório\n\n**Modelo:** claude-opus-4-6 (análise complexa = qualidade máxima)\n\n**Entrega:** Resumo WhatsApp + notificação push + relatório salvo no Supabase",
        "height": 155,
        "width": 900
    };

    @node({
        name: "Cron Segunda 07h00",
        type: "n8n-nodes-base.scheduleTrigger",
        version: 1.2,
        position: [240, 300]
    })
    CronSegunda07h00 = {
        "rule": {
            "interval": [
                {
                    "expression": "0 7 * * 1",
                    "field": "cronExpression"
                }
            ]
        }
    };

    @node({
        name: "Buscar Dados Semanais",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [460, 300]
    })
    BuscarDadosSemanais = {
        "bodyParameters": {
            "parameters": [
                {
                    "name": "min_checkins",
                    "value": "1"
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
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/rpc/get_active_users_weekly_data"
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
        name: "OpenAI — Digest Semanal",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [900, 300]
    })
    OpenaiDigestSemanal = {
        "body": "={{ JSON.stringify({ model: 'gpt-4o', max_tokens: 2000, messages: [{ role: 'system', content: 'Especialista em análise de dados de bem-estar feminino. Transforma dados em narrativas empoderedoras. Usa coaching positivo baseado em evidências. JSON válido sempre.' }, { role: 'user', content: 'Relatório semanal personalizado LifeOrganizer AI.\\n\\nNome: ' + $json.full_name + ' | Fase: ' + $json.current_phase + ' dia ' + $json.day_of_cycle + '\\nCheck-ins: ' + ($json.checkins_this_week || 0) + '/7\\nTarefas completadas: ' + ($json.tasks_completed || 0) + ' | Taxa: ' + ($json.completion_rate || 0) + '%\\nEnergia média: ' + ($json.avg_energy || 'N/A') + '/10\\nSessões foco: ' + ($json.focus_sessions || 0) + ' | Total: ' + ($json.total_focus_minutes || 0) + ' min\\n\\nREGRAS:\\n1. Compare com semanas anteriores\\n2. Correlacione fase do ciclo com performance\\n3. Use números concretos\\n4. Valide conquistas pequenas e grandes\\n\\nSAÍDA JSON:\\n{\\n  \"week_score\": 1_a_10,\\n  \"biggest_win\": \"maior conquista\",\\n  \"key_pattern_discovered\": \"padrão identificado\",\\n  \"next_week_strategy\": \"estratégia próxima semana\",\\n  \"whatsapp_summary\": \"resumo WhatsApp max 80 palavras\",\\n  \"push_title\": \"título push\",\\n  \"push_body\": \"corpo push max 100 chars\"\\n}' }] }) }}",
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
            "timeout": 45000
        },
        "sendBody": true,
        "sendHeaders": true,
        "url": "https://api.openai.com/v1/chat/completions"
    };

    @node({
        name: "Parsear Digest",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1120, 300]
    })
    ParsearDigest = {
        "jsCode": "const item = $input.item.json;\nconst raw = item.choices?.[0]?.message?.content?.replace(/```json\\n?/g, '').replace(/```/g, '').trim() || '{}';\nlet parsed;\ntry { parsed = JSON.parse(raw); } catch(e) {\n  parsed = {\n    week_score: 7,\n    biggest_win: 'Semana completada!',\n    whatsapp_summary: 'Seu resumo semanal está pronto! Abra o app para ver seus insights 📊',\n    push_title: 'Resumo semanal pronto!',\n    push_body: 'Veja como foi sua semana'\n  };\n}\nreturn { json: { user_id: item.id, user_email: item.email, user_phone: item.phone_number, ...parsed }};"
    };

    @node({
        name: "Salvar Relatório Supabase",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1340, 400]
    })
    SalvarRelatorioSupabase = {
        "bodyParameters": {
            "parameters": [
                {
                    "name": "user_id",
                    "value": "={{ $json.user_id }}"
                },
                {
                    "name": "week_score",
                    "value": "={{ $json.week_score }}"
                },
                {
                    "name": "biggest_win",
                    "value": "={{ $json.biggest_win }}"
                },
                {
                    "name": "key_pattern",
                    "value": "={{ $json.key_pattern_discovered }}"
                },
                {
                    "name": "next_week_strategy",
                    "value": "={{ $json.next_week_strategy }}"
                },
                {
                    "name": "report_date",
                    "value": "={{ new Date().toISOString().split('T')[0] }}"
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
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/weekly_reports"
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.BuscarDadosSemanais.out(0).to(this.LoopPorUsuaria.in(0));
        this.CronSegunda07h00.out(0).to(this.BuscarDadosSemanais.in(0));
        this.LoopPorUsuaria.out(0).to(this.OpenaiDigestSemanal.in(0));
        this.OpenaiDigestSemanal.out(0).to(this.ParsearDigest.in(0));
        this.ParsearDigest.out(0).to(this.SalvarRelatorioSupabase.in(0));
    }
}