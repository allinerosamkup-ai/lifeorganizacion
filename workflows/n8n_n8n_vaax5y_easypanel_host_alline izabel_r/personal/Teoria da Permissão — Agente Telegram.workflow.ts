import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Teoria da Permissão — Agente Telegram
// Nodes   : 7  |  Connections: 6
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// TelegramTrigger                    telegramTrigger            
// GoogleDocsTeoria                   googleDocs                 
// GoogleDocsMemoriaPessoal           googleDocs                 
// SetOrganizarMensagem               set                        
// SetRespostaFinal                   set                        
// SendATextMessage                   telegram                   
// Gemini1                            googleGemini               
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// TelegramTrigger
//    → SetOrganizarMensagem
//      → GoogleDocsTeoria
//        → GoogleDocsMemoriaPessoal
//          → Gemini1
//            → SetRespostaFinal
//              → SendATextMessage
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "yUhLMMaNgPgGXDxI",
    name: "Teoria da Permissão — Agente Telegram",
    active: false,
    settings: {executionOrder:"v1",callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class TeoriaDaPermissão—AgenteTelegramWorkflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        name: "Telegram Trigger",
        type: "n8n-nodes-base.telegramTrigger",
        version: 1.2,
        position: [-592, -128]
    })
    TelegramTrigger = {
        "additionalFields": {},
        "updates": [
            "message"
        ]
    };

    @node({
        name: "Google Docs - Teoria",
        type: "n8n-nodes-base.googleDocs",
        version: 2,
        position: [-352, -128]
    })
    GoogleDocsTeoria = {
        "documentURL": "1WLhBuyqpFjgmr5pVW9fLB4NE1mMKfW64oKxhVI7WzNo",
        "operation": "get"
    };

    @node({
        name: "Google Docs - Memória Pessoal",
        type: "n8n-nodes-base.googleDocs",
        version: 2,
        position: [-224, 80]
    })
    GoogleDocsMemoriaPessoal = {
        "documentURL": "1O_4K63JaffT6eJSaJ1OQMCdsiRUMxCpI2rggUFHDwcw",
        "operation": "get"
    };

    @node({
        name: "Set - Organizar Mensagem",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [-480, 64]
    })
    SetOrganizarMensagem = {
        "jsonOutput": "={\n  \"chat_id\": \"={{ $json.message.chat.id }}\",\n  \"texto\": \"={{ $json.message.text }}\",\n  \"usuario\": \"={{ $json.message.from.first_name }}\"\n}\n",
        "mode": "raw",
        "options": {}
    };

    @node({
        name: "Set – Resposta Final",
        type: "n8n-nodes-base.set",
        version: 3.4,
        position: [272, 96]
    })
    SetRespostaFinal = {
        "jsonOutput": "={\n  \"chat_id\": \"={{ $node['Telegram Trigger'].json.message.chat.id }}\",\n \"resposta\": \"={{ '🧠 Análise:\\n\\n' + $node['gemini1'].json.content.parts[0].text + '\\n\\n🚀 Próxima ação: executar imediatamente.' }}\"\n}",
        "mode": "raw",
        "options": {}
    };

    @node({
        name: "Send a text message",
        type: "n8n-nodes-base.telegram",
        version: 1.2,
        position: [528, 96]
    })
    SendATextMessage = {
        "additionalFields": {},
        "chatId": "=8573163457\n",
        "text": "={{ $json.resposta }}"
    };

    @node({
        name: "gemini1",
        type: "@n8n/n8n-nodes-langchain.googleGemini",
        version: 1.1,
        position: [-16, 96]
    })
    Gemini1 = {
        "builtInTools": {},
        "messages": {
            "values": [
                {
                    "content": "=VOCÊ É UM AGENTE AUTÔNOMO DE ANÁLISE, DECISÃO E EXECUÇÃO.\n\nTEORIA DA PERMISSÃO:\n{{ $node[\"Google Docs - Teoria\"].json.content }}\n\nMEMÓRIA PESSOAL DA USUÁRIA:\n{{ $node[\"Google Docs - Memória Pessoal\"].json.content }}\n\ntexto:\n{{ $node[\"Set - Organizar Mensagem\"].json.texto }}\n\nResponda claramente à mensagem abaixo:\nMensagem:{{ $json.message.text}}\n"
                }
            ]
        },
        "modelId": {
            "__rl": true,
            "cachedResultName": "models/gemini-2.5-flash",
            "mode": "list",
            "value": "models/gemini-2.5-flash"
        },
        "options": {}
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.GoogleDocsMemoriaPessoal.out(0).to(this.Gemini1.in(0));
        this.GoogleDocsTeoria.out(0).to(this.GoogleDocsMemoriaPessoal.in(0));
        this.SetOrganizarMensagem.out(0).to(this.GoogleDocsTeoria.in(0));
        this.SetRespostaFinal.out(0).to(this.SendATextMessage.in(0));
        this.TelegramTrigger.out(0).to(this.SetOrganizarMensagem.in(0));
        this.Gemini1.out(0).to(this.SetRespostaFinal.in(0));
    }
}