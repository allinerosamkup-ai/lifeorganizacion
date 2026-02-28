import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : LifeOrganizer — 01 Welcome Workflow
// Nodes   : 7  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Documentacao                       stickyNote                 
// WebhookNovoUsuario                 webhook                    
// ExtrairDados                       set                        
// OpenaiGerarBoasVindas              httpRequest                
// ParsearRespostaOpenai              code                       
// LogSupabase                        httpRequest                
// ResponderWebhookOk                 respondToWebhook           
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WebhookNovoUsuario
//    → ExtrairDados
//      → OpenaiGerarBoasVindas
//        → ParsearRespostaOpenai
//          → LogSupabase
//          → ResponderWebhookOk
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "4WCjwjdzrzfISdQN",
    name: "LifeOrganizer — 01 Welcome Workflow",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveManualExecutions:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class Lifeorganizer—01WelcomeWorkflow {

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
        "content": "## 🌸 01 — Welcome Workflow\n**Trigger:** Webhook Supabase (pg_net) ao criar nova usuária\n\n**Fluxo:** Webhook → Extrair Dados → Claude Opus → Parsear → WhatsApp + Log\n\n**Vars:** `CLAUDE_API_KEY` · `SUPABASE_URL` · `SUPABASE_SERVICE_KEY`\n`EVOLUTION_API_URL` · `EVOLUTION_API_KEY` · `EVOLUTION_INSTANCE`\n\n**Modelo:** claude-opus-4-6 (primeira impressão = máxima qualidade)",
        "height": 175,
        "width": 900
    };

    @node({
        name: "Webhook Novo Usuário",
        type: "n8n-nodes-base.webhook",
        version: 2,
        position: [240, 320]
    })
    WebhookNovoUsuario = {
        "httpMethod": "POST",
        "options": {},
        "path": "lifeorganizer-new-user",
        "responseMode": "responseNode"
    };

    @node({
        name: "Extrair Dados",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [460, 320]
    })
    ExtrairDados = {
        "assignments": {
            "assignments": [
                {
                    "id": "a1",
                    "name": "user_id",
                    "type": "string",
                    "value": "={{ $json.body.record.id }}"
                },
                {
                    "id": "a2",
                    "name": "user_email",
                    "type": "string",
                    "value": "={{ $json.body.record.email }}"
                },
                {
                    "id": "a3",
                    "name": "user_name",
                    "type": "string",
                    "value": "={{ $json.body.record.raw_user_meta_data?.full_name || $json.body.record.email.split('@')[0] }}"
                },
                {
                    "id": "a4",
                    "name": "user_phone",
                    "type": "string",
                    "value": "={{ $json.body.record.raw_user_meta_data?.phone || '' }}"
                }
            ]
        },
        "options": {}
    };

    @node({
        name: "OpenAI — Gerar Boas-Vindas",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [680, 320]
    })
    OpenaiGerarBoasVindas = {
        "body": "={{ JSON.stringify({ model: 'gpt-4o', max_tokens: 1024, messages: [{ role: 'system', content: 'Você é especialista em copywriting para apps de wellness feminino. Tom: amiga íntima empoderedora. Sempre responde com JSON válido sem markdown.' }, { role: 'user', content: 'Crie boas-vindas personalizada para o LifeOrganizer AI (produtividade feminina baseada em ciclo menstrual).\\n\\nNome: ' + $json.user_name + '\\nEmail: ' + $json.user_email + '\\n\\nRetorne JSON:\\n{\\n  \"subject\": \"assunto email (max 50 chars)\",\\n  \"body_html\": \"corpo HTML caloroso (150 palavras, 3 diferenciais: check-in natural, memória adaptativa, biologia aliada)\",\\n  \"whatsapp_message\": \"versão WhatsApp informal emojis (max 60 palavras)\",\\n  \"onboarding_cta\": \"texto botão CTA\"\\n}\\n\\nApenas JSON válido.' }] }) }}",
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
        name: "Parsear Resposta OpenAI",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [900, 320]
    })
    ParsearRespostaOpenai = {
        "jsCode": "const body = $input.item.json;\nconst raw = body.choices?.[0]?.message?.content || '{}';\nconst cleaned = raw.replace(/```json\\n?/g, '').replace(/```/g, '').trim();\nlet parsed;\ntry { parsed = JSON.parse(cleaned); } catch(e) {\n  parsed = {\n    subject: 'Bem-vinda ao LifeOrganizer! 🌸',\n    body_html: '<p>Seja bem-vinda! Seu app de produtividade baseado no ciclo está pronto.</p>',\n    whatsapp_message: 'Bem-vinda ao LifeOrganizer! 🌸 Complete o onboarding para ativar sua IA personalizada!',\n    onboarding_cta: 'Começar agora'\n  };\n}\nreturn { json: { ...parsed,\n  user_email: $node['Extrair Dados'].json.user_email,\n  user_name:  $node['Extrair Dados'].json.user_name,\n  user_phone: $node['Extrair Dados'].json.user_phone,\n  user_id:    $node['Extrair Dados'].json.user_id\n}};"
    };

    @node({
        name: "Log Supabase",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1120, 420]
    })
    LogSupabase = {
        "bodyParameters": {
            "parameters": [
                {
                    "name": "user_id",
                    "value": "={{ $json.user_id }}"
                },
                {
                    "name": "type",
                    "value": "welcome"
                },
                {
                    "name": "channel",
                    "value": "whatsapp"
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
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/notification_logs"
    };

    @node({
        name: "Responder Webhook OK",
        type: "n8n-nodes-base.respondToWebhook",
        version: 1.1,
        position: [1340, 320]
    })
    ResponderWebhookOk = {
        "respondWith": "json",
        "responseBody": "={{ JSON.stringify({ success: true, workflow: 'welcome', ts: new Date().toISOString() }) }}"
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.ExtrairDados.out(0).to(this.OpenaiGerarBoasVindas.in(0));
        this.OpenaiGerarBoasVindas.out(0).to(this.ParsearRespostaOpenai.in(0));
        this.ParsearRespostaOpenai.out(0).to(this.LogSupabase.in(0));
        this.ParsearRespostaOpenai.out(0).to(this.ResponderWebhookOk.in(0));
        this.WebhookNovoUsuario.out(0).to(this.ExtrairDados.in(0));
    }
}