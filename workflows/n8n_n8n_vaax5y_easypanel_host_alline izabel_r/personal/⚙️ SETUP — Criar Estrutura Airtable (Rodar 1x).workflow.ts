import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : ⚙️ SETUP — Criar Estrutura Airtable (Rodar 1x)
// Nodes   : 11  |  Connections: 12
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// IniciarSetup                       manualTrigger              
// Configuracoes                      set                        
// ListarBasesExistentes              httpRequest                
// BaseJaExiste                       code                       
// BaseExiste                         if                         
// CriarBaseTabelaCampos              httpRequest                
// ListarTabelasDaBaseExistente       httpRequest                
// TabelaJaExiste                     code                       
// TabelaExiste                       if                         
// CriarTabelaCampos                  httpRequest                
// IdsFinais                          code                       
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// IniciarSetup
//    → Configuracoes
//      → ListarBasesExistentes
//        → BaseJaExiste
//          → BaseExiste
//            → ListarTabelasDaBaseExistente
//              → TabelaJaExiste
//                → TabelaExiste
//                  → IdsFinais
//                 .out(1) → CriarTabelaCampos
//                    → IdsFinais (↩ loop)
//           .out(1) → CriarBaseTabelaCampos
//              → IdsFinais (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "jEtSQQ5CzZbGFwS6",
    name: "⚙️ SETUP — Criar Estrutura Airtable (Rodar 1x)",
    active: false,
    settings: {executionOrder:"v1",timezone:"America/Sao_Paulo",saveManualExecutions:true,callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class ️Setup—CriarEstruturaAirtable(rodar1x)Workflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        name: "▶️ Iniciar Setup",
        type: "n8n-nodes-base.manualTrigger",
        version: 1,
        position: [240, 400]
    })
    IniciarSetup = {};

    @node({
        name: "🔧 Configurações",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [460, 400]
    })
    Configuracoes = {
        "assignments": {
            "assignments": [
                {
                    "id": "api-key",
                    "name": "airtable_api_key",
                    "type": "string",
                    "value": "patASfqYX8UzVxPWT.ecb521c4f07154b59a9c972d87637b13726e696fc1ae4ce0bcc69e413326c912"
                },
                {
                    "id": "base-name",
                    "name": "base_name",
                    "type": "string",
                    "value": "CRM_WebDiet"
                },
                {
                    "id": "table-name",
                    "name": "table_name",
                    "type": "string",
                    "value": "Mensagens_WhatsApp"
                }
            ]
        },
        "options": {}
    };

    @node({
        name: "📋 Listar Bases Existentes",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [680, 400]
    })
    ListarBasesExistentes = {
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headerParameters": {
            "parameters": [
                {
                    "name": "Authorization",
                    "value": "=Bearer {{ $json.airtable_api_key }}"
                }
            ]
        },
        "method": "GET",
        "options": {
            "timeout": 15000
        },
        "sendHeaders": true,
        "url": "https://api.airtable.com/v0/meta/bases"
    };

    @node({
        name: "🔍 Base Já Existe?",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [900, 400]
    })
    BaseJaExiste = {
        "jsCode": "const bases = $input.item.json.bases || [];\nconst configNode = $('🔧 Configurações').item.json;\nconst baseName = configNode.base_name;\nconst existingBase = bases.find(b => b.name === baseName);\nif (existingBase) {\n  return [{ json: { ...configNode, base_exists: true, base_id: existingBase.id, base_name: existingBase.name } }];\n}\nreturn [{ json: { ...configNode, base_exists: false, bases_list: bases.map(b => ({ id: b.id, name: b.name })) } }];"
    };

    @node({
        name: "❓ Base existe?",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [1120, 400]
    })
    BaseExiste = {
        "conditions": {
            "combinator": "and",
            "conditions": [
                {
                    "id": "if-exists",
                    "leftValue": "={{ $json.base_exists }}",
                    "operator": {
                        "operation": "true",
                        "singleValue": true,
                        "type": "boolean"
                    }
                }
            ],
            "options": {
                "caseSensitive": false,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
            }
        },
        "options": {}
    };

    @node({
        name: "🏗️ Criar Base + Tabela + Campos",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1340, 520]
    })
    CriarBaseTabelaCampos = {
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headerParameters": {
            "parameters": [
                {
                    "name": "Authorization",
                    "value": "=Bearer {{ $('🔧 Configurações').item.json.airtable_api_key }}"
                },
                {
                    "name": "Content-Type",
                    "value": "application/json"
                }
            ]
        },
        "jsonBody": "={\n  \"name\": \"{{ $('🔧 Configurações').item.json.base_name }}\",\n  \"tables\": [{\n    \"name\": \"{{ $('🔧 Configurações').item.json.table_name }}\",\n    \"fields\": [\n      {\"name\": \"Paciente\", \"type\": \"singleLineText\"},\n      {\"name\": \"Telefone\", \"type\": \"phoneNumber\"},\n      {\"name\": \"Jornada\", \"type\": \"singleSelect\"},\n      {\"name\": \"Mensagem Gerada\", \"type\": \"multilineText\"},\n      {\"name\": \"Data/Hora do Disparo\", \"type\": \"dateTime\"},\n      {\"name\": \"Status\", \"type\": \"singleSelect\"},\n      {\"name\": \"Link WebDiet\", \"type\": \"url\"}\n    ]\n  }]\n}",
        "method": "POST",
        "options": {
            "timeout": 30000
        },
        "sendBody": true,
        "sendHeaders": true,
        "specifyBody": "json",
        "url": "https://api.airtable.com/v0/meta/bases"
    };

    @node({
        name: "📋 Listar Tabelas da Base Existente",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [1340, 280]
    })
    ListarTabelasDaBaseExistente = {
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headerParameters": {
            "parameters": [
                {
                    "name": "Authorization",
                    "value": "=Bearer {{ $('🔧 Configurações').item.json.airtable_api_key }}"
                }
            ]
        },
        "method": "GET",
        "options": {
            "timeout": 15000
        },
        "sendHeaders": true,
        "url": "=https://api.airtable.com/v0/meta/bases/{{ $json.base_id }}/tables"
    };

    @node({
        name: "🔍 Tabela Já Existe?",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [1560, 280]
    })
    TabelaJaExiste = {
        "jsCode": "const tables = $input.item.json.tables || [];\nconst baseId = $('🔍 Base Já Existe?').item.json.base_id;\nconst tableName = $('🔧 Configurações').item.json.table_name;\nconst apiKey = $('🔧 Configurações').item.json.airtable_api_key;\nconst existing = tables.find(t => t.name === tableName);\nif (existing) { return [{ json: { table_exists: true, base_id: baseId, table_id: existing.id, airtable_api_key: apiKey } }]; }\nreturn [{ json: { table_exists: false, base_id: baseId, airtable_api_key: apiKey } }];"
    };

    @node({
        name: "❓ Tabela existe?",
        type: "n8n-nodes-base.if",
        version: 2.2,
        position: [1780, 280]
    })
    TabelaExiste = {
        "conditions": {
            "combinator": "and",
            "conditions": [
                {
                    "id": "if-table",
                    "leftValue": "={{ $json.table_exists }}",
                    "operator": {
                        "operation": "true",
                        "singleValue": true,
                        "type": "boolean"
                    }
                }
            ],
            "options": {
                "caseSensitive": false,
                "leftValue": "",
                "typeValidation": "strict",
                "version": 2
            }
        },
        "options": {}
    };

    @node({
        name: "🏗️ Criar Tabela + Campos",
        type: "n8n-nodes-base.httpRequest",
        version: 4.2,
        position: [2000, 380]
    })
    CriarTabelaCampos = {
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "headerParameters": {
            "parameters": [
                {
                    "name": "Authorization",
                    "value": "=Bearer {{ $json.airtable_api_key }}"
                },
                {
                    "name": "Content-Type",
                    "value": "application/json"
                }
            ]
        },
        "jsonBody": "{\"name\": \"Mensagens_WhatsApp\", \"fields\": [{\"name\": \"Paciente\", \"type\": \"singleLineText\"}, {\"name\": \"Telefone\", \"type\": \"phoneNumber\"}, {\"name\": \"Jornada\", \"type\": \"singleSelect\"}, {\"name\": \"Mensagem Gerada\", \"type\": \"multilineText\"}, {\"name\": \"Data/Hora do Disparo\", \"type\": \"dateTime\"}, {\"name\": \"Status\", \"type\": \"singleSelect\"}, {\"name\": \"Link WebDiet\", \"type\": \"url\"}]}",
        "method": "POST",
        "options": {
            "timeout": 30000
        },
        "sendBody": true,
        "sendHeaders": true,
        "specifyBody": "json",
        "url": "=https://api.airtable.com/v0/meta/bases/{{ $json.base_id }}/tables"
    };

    @node({
        name: "🎉 IDs Finais",
        type: "n8n-nodes-base.code",
        version: 2,
        position: [2220, 400]
    })
    IdsFinais = {
        "jsCode": "const input = $input.item.json;\nlet baseId = input.id || input.base_id || '';\nlet tableId = '';\nif (input.tables && input.tables.length > 0) { tableId = input.tables[0].id; }\nif (input.id && !input.tables) { tableId = input.id; baseId = $('🔍 Tabela Já Existe?').item?.json?.base_id || baseId; }\nif (input.table_id) { tableId = input.table_id; baseId = input.base_id; }\nreturn [{ json: { status: 'SETUP OK', base_id: baseId, table_id: tableId } }];"
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.IniciarSetup.out(0).to(this.Configuracoes.in(0));
        this.BaseExiste.out(0).to(this.ListarTabelasDaBaseExistente.in(0));
        this.BaseExiste.out(1).to(this.CriarBaseTabelaCampos.in(0));
        this.TabelaExiste.out(0).to(this.IdsFinais.in(0));
        this.TabelaExiste.out(1).to(this.CriarTabelaCampos.in(0));
        this.CriarBaseTabelaCampos.out(0).to(this.IdsFinais.in(0));
        this.CriarTabelaCampos.out(0).to(this.IdsFinais.in(0));
        this.ListarBasesExistentes.out(0).to(this.BaseJaExiste.in(0));
        this.ListarTabelasDaBaseExistente.out(0).to(this.TabelaJaExiste.in(0));
        this.BaseJaExiste.out(0).to(this.BaseExiste.in(0));
        this.TabelaJaExiste.out(0).to(this.TabelaExiste.in(0));
        this.Configuracoes.out(0).to(this.ListarBasesExistentes.in(0));
    }
}