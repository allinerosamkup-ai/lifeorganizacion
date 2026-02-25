import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : [LifeOrganizer] Sugestão Diária
// Nodes   : 2  |  Connections: 1
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ScheduleTrigger                    scheduleTrigger            
// HttpRequest                        httpRequest                
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// ScheduleTrigger
//    → HttpRequest
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: "qijvAVHztJMkJ7ES",
    name: "[LifeOrganizer] Sugestão Diária",
    active: false,
    settings: {timezone:"America/Sao_Paulo",callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class [lifeorganizer]SugestãoDiáriaWorkflow {

    // =====================================================================
// CONFIGURATION DES NOEUDS
// =====================================================================

    @node({
        name: "Schedule Trigger",
        type: "n8n-nodes-base.scheduleTrigger",
        version: 1,
        position: [0, 0]
    })
    ScheduleTrigger = {
        "rule": {
            "type": "cron",
            "value": "0 6 * * *"
        }
    };

    @node({
        name: "HTTP Request",
        type: "n8n-nodes-base.httpRequest",
        version: 4,
        position: [200, 0]
    })
    HttpRequest = {
        "authentication": "predefinedCredentialType",
        "bodyParameters": {
            "parameters": [
                {
                    "name": "date",
                    "value": "{{$today}}"
                }
            ]
        },
        "headerParameters": {
            "parameters": [
                {
                    "name": "Authorization",
                    "value": "Bearer {{$credentials.serviceRolePassword}}"
                }
            ]
        },
        "method": "POST",
        "nodeCredentialType": "supabaseApi",
        "sendBody": true,
        "sendHeaders": true,
        "url": "https://wcdwpxvljvptnjjzzn.supabase.co/functions/v1/generate-daily-suggestions"
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.HttpRequest.in(0));
    }
}