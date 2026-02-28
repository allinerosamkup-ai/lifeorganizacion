import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : LifeOrganizer — 05 Stripe Billing Events
// Nodes   : 12  |  Connections: 13
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Documentacao                       stickyNote                 
// StripeWebhook                      webhook                    
// ResponderStripe200                 respondToWebhook           
// ParsearEventoStripe                code                       
// BuscarUsuariaByCustomerId          httpRequest                
// MesclarUsuariaEvento               code                       
// RotearPorEvento                    switch                     
// ClaudeNovaAssinatura               httpRequest                
// ClaudeFalhaPagamento               httpRequest                
// ClaudeRetencaoCancelando           httpRequest                
// ClaudeDespedidaGraciosa            httpRequest                
// EnviarWhatsappBilling              httpRequest                
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// StripeWebhook
//    → ParsearEventoStripe
//      → BuscarUsuariaByCustomerId
//        → MesclarUsuariaEvento
//          → RotearPorEvento
//            → ClaudeNovaAssinatura
//              → EnviarWhatsappBilling
//           .out(1) → ClaudeFalhaPagamento
//              → EnviarWhatsappBilling (↩ loop)
//           .out(2) → ClaudeRetencaoCancelando
//              → EnviarWhatsappBilling (↩ loop)
//           .out(3) → ClaudeDespedidaGraciosa
//              → EnviarWhatsappBilling (↩ loop)
//    → ResponderStripe200
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "Ds3iGnCsLUtGQEi3",
    name: "LifeOrganizer — 05 Stripe Billing Events",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveManualExecutions:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class Lifeorganizer—05StripeBillingEventsWorkflow {

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
        "content": "## 💳 05 — Stripe Billing Events\n**Trigger:** Webhook Stripe\n\n**Eventos:** nova sub · renovação · falha pagamento · cancelando · cancelado\n\n**Roteamento:** Switch 4 saídas → Claude Haiku personalizado por evento\n\n**Modelo:** claude-haiku-4-5-20251001 (mensagens curtas, alta frequência)",
        "height": 145,
        "width": 900
    };

    @node({
        name: "Stripe Webhook",
        type: "n8n-nodes-base.webhook",
        version: 2,
        position: [240, 300]
    })
    StripeWebhook = {
        "httpMethod": "POST",
        "path": "lifeorganizer-stripe",
        "responseMode": "responseNode",
        "options": {}
    };

    @node({
        name: "Responder Stripe 200",
        type: "n8n-nodes-base.respondToWebhook",
        version: 1.1,
        position: [460, 480]
    })
    ResponderStripe200 = {
        "respondWith": "json",
        "responseBody": "={ \"received\": true }"
    };

    @node({
        name: "Parsear Evento Stripe",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [460, 300]
    })
    ParsearEventoStripe = {
        "jsCode": "const body = $input.item.json.body;\nconst eventType = body.type;\nconst obj = body.data?.object;\nconst customerId = obj?.customer;\nconst status = obj?.status;\nconst cancelAtPeriodEnd = obj?.cancel_at_period_end;\nconst periodEnd = obj?.current_period_end;\n\nlet cat;\nif (eventType === 'customer.subscription.created') cat = 'new_subscription';\nelse if (eventType === 'customer.subscription.updated') {\n  if (status === 'active' && cancelAtPeriodEnd) cat = 'canceling';\n  else if (status === 'active') cat = 'renewed';\n  else if (status === 'past_due') cat = 'payment_failed';\n  else if (status === 'canceled') cat = 'canceled';\n  else cat = 'other';\n} else if (eventType === 'customer.subscription.deleted') cat = 'canceled';\nelse if (eventType === 'invoice.payment_failed') cat = 'payment_failed';\nelse cat = 'other';\n\nconst daysLeft = periodEnd ? Math.ceil((periodEnd * 1000 - Date.now()) / 86400000) : null;\nreturn { json: { eventType, eventCategory: cat, customerId, status, cancelAtPeriodEnd, daysUntilExpiry: daysLeft } };"
    };

    @node({
        name: "Buscar Usuária by Customer ID",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [680, 300]
    })
    BuscarUsuariaByCustomerId = {
        "method": "GET",
        "url": "={{ $env.SUPABASE_URL }}/rest/v1/profiles?stripe_customer_id=eq.{{ $json.customerId }}&select=id,email,full_name,phone_number,plan",
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
                }
            ]
        },
        "options": {}
    };

    @node({
        name: "Mesclar Usuária + Evento",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [900, 300]
    })
    MesclarUsuariaEvento = {
        "jsCode": "const users = $input.item.json;\nconst evt = $node['Parsear Evento Stripe'].json;\nif (!users?.length) throw new Error('Usuária não encontrada para: ' + evt.customerId);\nconst u = users[0];\nreturn { json: { user_id: u.id, user_email: u.email, user_phone: u.phone_number, user_name: u.full_name, current_plan: u.plan, ...evt }};"
    };

    @node({
        name: "Rotear por Evento",
        type: "n8n-nodes-base.switch",
        version: 3.2,
        position: [1120, 300]
    })
    RotearPorEvento = {
        "rules": {
            "values": [
                {
                    "conditions": {
                        "options": {},
                        "conditions": [
                            {
                                "leftValue": "={{ $json.eventCategory }}",
                                "rightValue": "new_subscription",
                                "operator": {
                                    "type": "string",
                                    "operation": "equals"
                                }
                            }
                        ]
                    },
                    "renameOutput": true,
                    "outputKey": "nova_sub"
                },
                {
                    "conditions": {
                        "options": {},
                        "conditions": [
                            {
                                "leftValue": "={{ $json.eventCategory }}",
                                "rightValue": "payment_failed",
                                "operator": {
                                    "type": "string",
                                    "operation": "equals"
                                }
                            }
                        ]
                    },
                    "renameOutput": true,
                    "outputKey": "falha_pag"
                },
                {
                    "conditions": {
                        "options": {},
                        "conditions": [
                            {
                                "leftValue": "={{ $json.eventCategory }}",
                                "rightValue": "canceling",
                                "operator": {
                                    "type": "string",
                                    "operation": "equals"
                                }
                            }
                        ]
                    },
                    "renameOutput": true,
                    "outputKey": "cancelando"
                },
                {
                    "conditions": {
                        "options": {},
                        "conditions": [
                            {
                                "leftValue": "={{ $json.eventCategory }}",
                                "rightValue": "canceled",
                                "operator": {
                                    "type": "string",
                                    "operation": "equals"
                                }
                            }
                        ]
                    },
                    "renameOutput": true,
                    "outputKey": "cancelado"
                }
            ]
        },
        "options": {
            "fallbackOutput": "extra"
        }
    };

    @node({
        name: "Claude — Nova Assinatura",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1360, 100]
    })
    ClaudeNovaAssinatura = {
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
        "body": "={{ JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, system: 'Especialista em comunicação pós-venda SaaS. Reforça decisão de compra. JSON válido sempre.', messages: [{ role: 'user', content: 'Mensagem NOVA ASSINATURA Pro para ' + $json.user_name + '. Celebre genuinamente. Mencione: IA adaptativa, insights ilimitados, alertas de fase. Tom sofisticado. Max 50 palavras WhatsApp. SAIDA JSON: {\"whatsapp_message\": \"...\"}' }] }) }}",
        "options": {
            "timeout": 15000
        }
    };

    @node({
        name: "Claude — Falha Pagamento",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1360, 240]
    })
    ClaudeFalhaPagamento = {
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
        "body": "={{ JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, system: 'Especialista em churn prevention ético. NUNCA usa linguagem de cobrança. Foca em valor e facilidade de resolução. JSON válido sempre.', messages: [{ role: 'user', content: 'Mensagem FALHA PAGAMENTO empática para ' + $json.user_name + '. NUNCA diga cobrança. Diga ajuda atualizar método pagamento. Tom prestativo. Max 45 palavras. SAIDA JSON: {\"whatsapp_message\": \"...\"}' }] }) }}",
        "options": {
            "timeout": 15000
        }
    };

    @node({
        name: "Claude — Retenção Cancelando",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1360, 380]
    })
    ClaudeRetencaoCancelando = {
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
        "body": "={{ JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, system: 'Especialista em retenção ética. Respeita decisão do cliente. JSON válido sempre.', messages: [{ role: 'user', content: 'Mensagem RETENÇÃO para ' + $json.user_name + ' cancelando em ' + $json.daysUntilExpiry + ' dias. Respeite a decisão. Ofereça pausa como alternativa. SAIDA JSON: {\"whatsapp_message\": \"...\", \"retention_offer\": \"1 mês grátis para retornar\"}' }] }) }}",
        "options": {
            "timeout": 15000
        }
    };

    @node({
        name: "Claude — Despedida Graciosa",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1360, 520]
    })
    ClaudeDespedidaGraciosa = {
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
        "body": "={{ JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, system: 'Especialista em offboarding gracioso. Transforma saída em oportunidade futura. JSON válido sempre.', messages: [{ role: 'user', content: 'Despedida GRACIOSA para ' + $json.user_name + '. Tom grato. Dados salvos 90 dias. Plano Free disponível. Código retorno VOLTEI30. Max 35 palavras. SAIDA JSON: {\"whatsapp_message\": \"...\", \"discount_code\": \"VOLTEI30\"}' }] }) }}",
        "options": {
            "timeout": 15000
        }
    };

    @node({
        name: "Enviar WhatsApp Billing",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1600, 300]
    })
    EnviarWhatsappBilling = {
        "method": "POST",
        "url": "={{ $env.EVOLUTION_API_URL }}/message/sendText/{{ $env.EVOLUTION_INSTANCE }}",
        "sendHeaders": true,
        "headerParameters": {
            "parameters": [
                {
                    "name": "apikey",
                    "value": "={{ $env.EVOLUTION_API_KEY }}"
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
                    "name": "number",
                    "value": "={{ $node['Mesclar Usuária + Evento'].json.user_phone }}"
                },
                {
                    "name": "text",
                    "value": "={{ JSON.parse($input.item.json.content?.[0]?.text || '{\"whatsapp_message\":\"\"}').whatsapp_message }}"
                }
            ]
        },
        "options": {
            "timeout": 10000
        }
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.StripeWebhook.out(0).to(this.ParsearEventoStripe.in(0));
        this.StripeWebhook.out(0).to(this.ResponderStripe200.in(0));
        this.ParsearEventoStripe.out(0).to(this.BuscarUsuariaByCustomerId.in(0));
        this.BuscarUsuariaByCustomerId.out(0).to(this.MesclarUsuariaEvento.in(0));
        this.MesclarUsuariaEvento.out(0).to(this.RotearPorEvento.in(0));
        this.RotearPorEvento.out(0).to(this.ClaudeNovaAssinatura.in(0));
        this.RotearPorEvento.out(1).to(this.ClaudeFalhaPagamento.in(0));
        this.RotearPorEvento.out(2).to(this.ClaudeRetencaoCancelando.in(0));
        this.RotearPorEvento.out(3).to(this.ClaudeDespedidaGraciosa.in(0));
        this.ClaudeNovaAssinatura.out(0).to(this.EnviarWhatsappBilling.in(0));
        this.ClaudeFalhaPagamento.out(0).to(this.EnviarWhatsappBilling.in(0));
        this.ClaudeRetencaoCancelando.out(0).to(this.EnviarWhatsappBilling.in(0));
        this.ClaudeDespedidaGraciosa.out(0).to(this.EnviarWhatsappBilling.in(0));
    }
}