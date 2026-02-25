import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : [LifeOrganizer] Reflexão Semanal
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
    id: "lHlXYAMRpI7jQ6Pt",
    name: "[LifeOrganizer] Reflexão Semanal",
    active: false,
    settings: {timezone:"America/Sao_Paulo",callerPolicy:"workflowsFromSameOwner",availableInMCP:false}
})
export class [lifeorganizer]ReflexãoSemanalWorkflow {

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
            "value": "0 18 * * 5"
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
        "sendHeaders": true,
        "url": "https://wcdwpxvljvptnjjzzn.supabase.co/functions/v1/update-weekly-learning"
    };


    // =====================================================================
// ROUTAGE ET CONNEXIONS
// =====================================================================

    @links()
    defineRouting() {
        this.ScheduleTrigger.out(0).to(this.HttpRequest.in(0));
    }
}