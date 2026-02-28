import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : Get OpenAI Key Temporary
// Nodes   : 2  |  Connections: 1
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Trigger                            manualTrigger
// Code                               code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Trigger
//    → Code
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'YMItCh9HnwAWTL9N',
    name: 'Get OpenAI Key Temporary',
    active: false,
    settings: {
        executionOrder: 'v1',
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        saveManualExecutions: true,
        saveExecutionProgress: true,
        callerPolicy: 'workflowsFromSameOwner',
        availableInMCP: false,
    },
})
export class GetOpenaiKeyTemporaryWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        name: 'Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [100, 100],
    })
    Trigger = {};

    @node({
        name: 'Code',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [300, 100],
    })
    Code = {
        jsCode: 'return { key: $env.OPENAI_API_KEY };',
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Trigger.out(0).to(this.Code.in(0));
    }
}
