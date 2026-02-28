import json
import os

with open(r"C:\Users\allin\.gemini\antigravity\brain\77333ba0-e2e6-460e-8bde-781585307550\.system_generated\steps\255\output.txt", "r", encoding="utf-8") as f:
    original = json.load(f)

data = original["data"]

node_name_map = {}

# nodes modifications
for node in data["nodes"]:
    old_name = node["name"]
    if "Claude" in node["name"]:
        node["name"] = node["name"].replace("Claude", "OpenAI")
        node_name_map[old_name] = node["name"]
        
        # swap to OpenAI API
        if node["type"] == "n8n-nodes-base.httpRequest":
            node["parameters"]["url"] = "https://api.openai.com/v1/chat/completions"
            for param in node["parameters"]["headerParameters"]["parameters"]:
                if param["name"] == "x-api-key":
                    param["name"] = "Authorization"
                    param["value"] = "Bearer {{$env.OPENAI_API_KEY}}"
                elif param["name"] == "anthropic-version":
                    param["name"] = "x-removed" # just to disable it
            
            # modify body
            body_str = node.get("parameters", {}).get("body", "")
            if body_str:
                body_str = body_str.replace("claude-opus-4-6", "gpt-4o")
                if "system: '" in body_str:
                    sys_start = body_str.find("system: '") + 9
                    sys_end = body_str.find("', messages:")
                    sys_text = body_str[sys_start:sys_end]
                    body_str = body_str[:body_str.find("system: '")] + f"messages: [{{ role: 'system', content: '{sys_text}' }}," + body_str[sys_end+12:]
                node["parameters"]["body"] = body_str

    if node["name"] == "Parsear Resposta OpenAI" or node["name"] == "Parsear Resposta Claude":
        node_name_map[old_name] = "Parsear Resposta OpenAI"
        node["name"] = "Parsear Resposta OpenAI"
        try:
            code = node["parameters"]["jsCode"]
            code = code.replace("body.content?.[0]?.text", "body.choices?.[0]?.message?.content")
            node["parameters"]["jsCode"] = code
        except:
            pass

# Replace names inside nodes expressions
for node in data["nodes"]:
    if "parameters" in node:
        params_str = json.dumps(node["parameters"])
        for old_name, new_name in node_name_map.items():
            params_str = params_str.replace(f"$node['{old_name}']", f"$node['{new_name}']")
            params_str = params_str.replace(f"$node[\"{old_name}\"]", f"$node[\"{new_name}\"]")
        node["parameters"] = json.loads(params_str)

# Remove WhatsApp node
data["nodes"] = [n for n in data["nodes"] if "WhatsApp" not in n["name"]]

new_connections = {}
for source_node, outputs in data["connections"].items():
    if "WhatsApp" in source_node:
        continue
    
    new_source = node_name_map.get(source_node, source_node)
    new_connections[new_source] = {}
    
    for output_type, targets in outputs.items(): # e.g. "main": [[...]]
        new_connections[new_source][output_type] = []
        for target_group in targets:
            new_target_group = []
            for t in target_group:
                if "WhatsApp" in t["node"]:
                    continue
                new_t = t.copy()
                new_t["node"] = node_name_map.get(t["node"], t["node"])
                new_target_group.append(new_t)
            
            # WhatsApp logic fix config where WhatsApp was intermediary
            if source_node == "Parsear Resposta Claude" or new_source == "Parsear Resposta OpenAI":
                # Ensure Responder Webhook OK is there
                has_responder = any("Responder Webhook OK" in x["node"] for x in new_target_group)
                if not has_responder:
                    new_target_group.append({"node": "Responder Webhook OK", "type": "main", "index": 0})
                    
            if new_target_group:
                new_connections[new_source][output_type].append(new_target_group)

data["connections"] = new_connections

# Remove unused x-removed header
for node in data["nodes"]:
    if node["type"] == "n8n-nodes-base.httpRequest":
        if "headerParameters" in node["parameters"]:
            params = node["parameters"]["headerParameters"]["parameters"]
            node["parameters"]["headerParameters"]["parameters"] = [p for p in params if p["name"] != "x-removed"]

with open("wf01_updated.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Updated WF 01 JSON successfully!")
