import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Motor de Retenção — Franciele AI (Gemini + Airtable)
// Nodes   : 16  |  Connections: 14
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// DemoGatilhoManual                  manualTrigger              
// DadosDemo                          set                        
// Webhook                            webhook                    
// NormalizarWebhook                  set                        
// EMailImap                          emailReadImap              
// ExtrairEMail                       code                       
// GeminiFlash                        httpRequest                
// ExtrairTexto                       code                       
// AirtableSalvar                     airtable                   
// Resultado                          set                        
// Motor2Schedule                     scheduleTrigger            
// BuscarAgendados                    airtable                   
// TemMensagens                       if                         
// Lotes                              splitInBatches             
// EvolutionApi                       httpRequest                
// MarcarEnviado                      airtable                   
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// DemoGatilhoManual
//    → DadosDemo
//      → GeminiFlash
//        → ExtrairTexto
//          → AirtableSalvar
//            → Resultado
// Webhook
//    → NormalizarWebhook
//      → GeminiFlash (↩ loop)
// EMailImap
//    → ExtrairEMail
//      → GeminiFlash (↩ loop)
// Motor2Schedule
//    → BuscarAgendados
//      → TemMensagens
//        → Lotes
//          → EvolutionApi
//            → MarcarEnviado
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "2nAp9iMw3sQEodB6",
    name: "Motor de Retenção — Franciele AI (Gemini + Airtable)",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveDataErrorExecution:"all",saveDataSuccessExecution:"all",saveManualExecutions:true,saveExecutionProgress:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class MotorDeRetenção—FrancieleAi(gemini+Airtable)Workflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        name: "🧪 DEMO — Gatilho Manual",
        type: "n8n-nodes-base.manualTrigger",
        version: 1,
        position: [460, 200]
    })
    DemoGatilhoManual = {};

    @node({
        name: "📋 Dados Demo",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [680, 200]
    })
    DadosDemo = {
        "assignments": {
            "assignments": [
                {
                    "id": "d1",
                    "name": "nome_paciente",
                    "type": "string",
                    "value": "Juliana Ferreira"
                },
                {
                    "id": "d2",
                    "name": "telefone",
                    "type": "string",
                    "value": "+5511999887766"
                },
                {
                    "id": "d3",
                    "name": "jornada",
                    "type": "string",
                    "value": "Caminho A — Plano Liberado"
                },
                {
                    "id": "d4",
                    "name": "link_webdiet",
                    "type": "string",
                    "value": "https://app.webdiet.com.br/plano/demo123"
                },
                {
                    "id": "d5",
                    "name": "objetivo_paciente",
                    "type": "string",
                    "value": "Perda de peso saudável com reeducação alimentar"
                }
            ]
        },
        "options": {}
    };

    @node({
        name: "🔗 Webhook",
        type: "n8n-nodes-base.webhook",
        version: 2,
        position: [460, 380]
    })
    Webhook = {
        "httpMethod": "POST",
        "options": {
            "rawBody": false
        },
        "path": "franciele-novo-paciente"
    };

    @node({
        name: "📋 Normalizar Webhook",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [680, 380]
    })
    NormalizarWebhook = {
        "assignments": {
            "assignments": [
                {
                    "id": "w1",
                    "name": "nome_paciente",
                    "type": "string",
                    "value": "={{ $json.body.nome_paciente }}"
                },
                {
                    "id": "w2",
                    "name": "telefone",
                    "type": "string",
                    "value": "={{ $json.body.telefone }}"
                },
                {
                    "id": "w3",
                    "name": "jornada",
                    "type": "string",
                    "value": "={{ $json.body.jornada || 'Caminho D' }}"
                },
                {
                    "id": "w4",
                    "name": "link_webdiet",
                    "type": "string",
                    "value": "={{ $json.body.link_webdiet || '' }}"
                },
                {
                    "id": "w5",
                    "name": "objetivo_paciente",
                    "type": "string",
                    "value": "={{ $json.body.objetivo_paciente || 'Acompanhamento nutricional' }}"
                }
            ]
        },
        "options": {}
    };

    @node({
        name: "📧 E-mail IMAP",
        type: "n8n-nodes-base.emailReadImap",
        version: 2,
        position: [460, 560]
    })
    EMailImap = {
        "mailbox": "INBOX",
        "options": {
            "postProcessAction": "read"
        },
        "pollTimes": {
            "item": [
                {
                    "mode": "everyMinute"
                }
            ]
        }
    };

    @node({
        name: "🔍 Extrair E-mail",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [680, 560]
    })
    ExtrairEMail = {
        "jsCode": "const text = $input.item.json.text || '';\nconst nomeMatch = text.match(/paciente[:\\\\s]+([^\\\\n<]+)/i);\nconst telefoneMatch = text.match(/(\\\\+55[\\\\d]{10,11})/i);\nconst linkMatch = text.match(/(https:\\\\/\\\\/[^\\\\s]*webdiet[^\\\\s]*)/i);\nreturn [{ json: {\n  nome_paciente: nomeMatch ? nomeMatch[1].trim() : 'Paciente WebDiet',\n  telefone: telefoneMatch ? telefoneMatch[1].trim() : '',\n  jornada: 'Caminho A',\n  link_webdiet: linkMatch ? linkMatch[1] : '',\n  objetivo_paciente: 'Reeducação alimentar'\n}}];"
    };

    @node({
        name: "✨ Gemini Flash",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [920, 380]
    })
    GeminiFlash = {
        "authentication": "genericCredentialType",
        "genericAuthType": "httpQueryAuth",
        "headerParameters": {
            "parameters": [
                {
                    "name": "Content-Type",
                    "value": "application/json"
                }
            ]
        },
        "jsonBody": "={\n  \"contents\": [{\"parts\": [{\"text\": \"Gere uma mensagem de WhatsApp humanizada para:\\nPaciente: {{ $json.nome_paciente }}\\nJornada: {{ $json.jornada }}\\nObjetivo: {{ $json.objetivo_paciente }}\\nLink: {{ $json.link_webdiet || 'indisponivel' }}\\nMáximo 3 parágrafos.\"}]}],\n  \"generationConfig\": {\"temperature\": 0.8, \"maxOutputTokens\": 400}\n}",
        "method": "POST",
        "options": {
            "timeout": 30000
        },
        "sendBody": true,
        "sendHeaders": true,
        "specifyBody": "json",
        "url": "=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $credentials.googleGeminiApi.apiKey }}"
    };

    @node({
        name: "🔧 Extrair Texto",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1140, 380]
    })
    ExtrairTexto = {
        "jsCode": "const response = $input.item.json;\nconst texto = response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Mensagem não gerada.';\nreturn [{ json: { mensagem_gerada: texto, nome_paciente: '', telefone: '', jornada: '', link_webdiet: '' } }];"
    };

    @node({
        name: "📊 Airtable Salvar",
        type: "n8n-nodes-base.airtable",
        version: 2.1,
        position: [1360, 380]
    })
    AirtableSalvar = {
        "baseId": {
            "__rl": true,
            "mode": "id",
            "value": "apppN2Da8Ov3Li18q"
        },
        "columns": {
            "mappingMode": "defineBelow",
            "schema": [
                {
                    "canBeUsedToMatch": true,
                    "defaultMatch": false,
                    "display": true,
                    "displayName": "Paciente",
                    "id": "Paciente",
                    "readOnly": false,
                    "removed": false,
                    "required": false,
                    "type": "string"
                },
                {
                    "canBeUsedToMatch": false,
                    "defaultMatch": false,
                    "display": true,
                    "displayName": "Status",
                    "id": "Status",
                    "readOnly": false,
                    "removed": false,
                    "required": false,
                    "type": "string"
                }
            ],
            "value": {
                "Mensagem Gerada": "={{ $json.mensagem_gerada }}",
                "Paciente": "={{ $json.nome_paciente }}",
                "Status": "⏳ Agendado",
                "Telefone": "={{ $json.telefone }}"
            }
        },
        "operation": "create",
        "options": {},
        "resource": "record",
        "tableId": {
            "__rl": true,
            "mode": "id",
            "value": "tblvJWh00GVWUuDmk"
        }
    };

    @node({
        name: "✅ Resultado",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [1580, 380]
    })
    Resultado = {
        "assignments": {
            "assignments": [
                {
                    "id": "res1",
                    "name": "resultado",
                    "type": "string",
                    "value": "=Mensagem salva no Airtable com sucesso!"
                }
            ]
        },
        "options": {}
    };

    @node({
        name: "⏰ Motor 2 Schedule",
        type: "n8n-nodes-base.scheduleTrigger",
        version: 1.2,
        position: [460, 880]
    })
    Motor2Schedule = {
        "rule": {
            "interval": [
                {
                    "field": "hours",
                    "hoursInterval": 1
                }
            ]
        }
    };

    @node({
        name: "🔍 Buscar Agendados",
        type: "n8n-nodes-base.airtable",
        version: 2.1,
        position: [680, 880]
    })
    BuscarAgendados = {
        "baseId": {
            "__rl": true,
            "mode": "id",
            "value": "apppN2Da8Ov3Li18q"
        },
        "filterByFormula": "{Status} = '⏳ Agendado'",
        "operation": "search",
        "options": {
            "maxRecords": 50
        },
        "resource": "record",
        "tableId": {
            "__rl": true,
            "mode": "id",
            "value": "tblvJWh00GVWUuDmk"
        }
    };

    @node({
        name: "❓ Tem mensagens?",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [900, 880]
    })
    TemMensagens = {
        "conditions": {
            "combinator": "and",
            "conditions": [
                {
                    "id": "check-id",
                    "leftValue": "={{ $json.id }}",
                    "operator": {
                        "operation": "notEmpty",
                        "type": "string"
                    }
                }
            ],
            "options": {
                "caseSensitive": true,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
            }
        },
        "options": {}
    };

    @node({
        name: "📦 Lotes",
        type: "n8n-nodes-base.splitInBatches",
        version: 3,
        position: [1120, 820]
    })
    Lotes = {
        "options": {
            "reset": false
        }
    };

    @node({
        name: "📱 Evolution API",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1340, 820]
    })
    EvolutionApi = {
        "headerParameters": {
            "parameters": [
                {
                    "name": "Content-Type",
                    "value": "application/json"
                },
                {
                    "name": "apikey",
                    "value": "SUA_EVOLUTION_API_KEY"
                }
            ]
        },
        "jsonBody": "={\n  \"number\": \"{{ $json.fields.Telefone }}\",\n  \"text\": \"{{ $json.fields['Mensagem Gerada'] }}\",\n  \"delay\": 1200\n}",
        "method": "POST",
        "options": {
            "timeout": 30000
        },
        "sendBody": true,
        "sendHeaders": true,
        "specifyBody": "json",
        "url": "http://SEU_DOMINIO:8080/message/sendText/NOME_INSTANCIA"
    };

    @node({
        name: "✅ Marcar Enviado",
        type: "n8n-nodes-base.airtable",
        version: 2.1,
        position: [1560, 820]
    })
    MarcarEnviado = {
        "baseId": {
            "__rl": true,
            "mode": "id",
            "value": "apppN2Da8Ov3Li18q"
        },
        "columns": {
            "mappingMode": "defineBelow",
            "schema": [
                {
                    "canBeUsedToMatch": false,
                    "defaultMatch": false,
                    "display": true,
                    "displayName": "Status",
                    "id": "Status",
                    "readOnly": false,
                    "removed": false,
                    "required": false,
                    "type": "string"
                }
            ],
            "value": {
                "Status": "🟢 Enviado"
            }
        },
        "id": "={{ $('📦 Lotes').item.json.id }}",
        "operation": "update",
        "options": {},
        "resource": "record",
        "tableId": {
            "__rl": true,
            "mode": "id",
            "value": "tblvJWh00GVWUuDmk"
        }
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.Motor2Schedule.out(0).to(this.BuscarAgendados.in(0));
        this.GeminiFlash.out(0).to(this.ExtrairTexto.in(0));
        this.TemMensagens.out(0).to(this.Lotes.in(0));
        this.AirtableSalvar.out(0).to(this.Resultado.in(0));
        this.DadosDemo.out(0).to(this.GeminiFlash.in(0));
        this.NormalizarWebhook.out(0).to(this.GeminiFlash.in(0));
        this.Lotes.out(0).to(this.EvolutionApi.in(0));
        this.EMailImap.out(0).to(this.ExtrairEMail.in(0));
        this.EvolutionApi.out(0).to(this.MarcarEnviado.in(0));
        this.BuscarAgendados.out(0).to(this.TemMensagens.in(0));
        this.ExtrairEMail.out(0).to(this.GeminiFlash.in(0));
        this.Webhook.out(0).to(this.NormalizarWebhook.in(0));
        this.ExtrairTexto.out(0).to(this.AirtableSalvar.in(0));
        this.DemoGatilhoManual.out(0).to(this.DadosDemo.in(0));
    }
}