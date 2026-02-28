import sys
import json

def process_workflow(input_file, output_file):
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        if "data" in data:
            data = data["data"]

    deleted_nodes = set()
    for n in data["nodes"]:
        if "WhatsApp" in n["name"] or n["name"] == "WhatsApp" or (n["type"] == "n8n-nodes-base.httpRequest" and "EVOLUTION" in json.dumps(n)):
            deleted_nodes.add(n["name"])
    
    node_name_map = {}
    for node in data["nodes"]:
        old_name = node["name"]
        if "Claude" in node["name"]:
            node["name"] = node["name"].replace("Claude", "OpenAI")
            node_name_map[old_name] = node["name"]
            
            if node["type"] == "n8n-nodes-base.httpRequest":
                node["parameters"]["url"] = "https://api.openai.com/v1/chat/completions"
                if "headerParameters" in node["parameters"]:
                    params = node["parameters"]["headerParameters"]["parameters"]
                    new_params = []
                    for p in params:
                        if p["name"] == "x-api-key":
                            new_params.append({"name": "Authorization", "value": "Bearer {{$env.OPENAI_API_KEY}}"})
                        elif p["name"] == "anthropic-version":
                            pass 
                        else:
                            new_params.append(p)
                    node["parameters"]["headerParameters"]["parameters"] = new_params
                
                body_str = node.get("parameters", {}).get("body", "")
                if body_str:
                    body_str = body_str.replace("claude-opus-4-6", "gpt-4o")
                    body_str = body_str.replace("claude-haiku-4-5-20251001", "gpt-4o-mini")
                    
                    if "system: '" in body_str:
                        sys_start = body_str.find("system: '") + 9
                        sys_end = body_str.find("', messages:")
                        sys_text = body_str[sys_start:sys_end]
                        body_str = body_str[:body_str.find("system: '")] + f"messages: [{{ role: 'system', content: '{sys_text}' }}," + body_str[sys_end+12:]
                    node["parameters"]["body"] = body_str

        if "Parsear" in node["name"] or "Preparar" in node["name"]:
            if "Claude" in node["name"]:
                node_name_map[old_name] = node["name"].replace("Claude", "OpenAI")
                node["name"] = node["name"].replace("Claude", "OpenAI")
            if "jsCode" in node.get("parameters", {}):
                code = node["parameters"]["jsCode"]
                code = code.replace("content?.[0]?.text", "choices?.[0]?.message?.content")
                node["parameters"]["jsCode"] = code

    for node in data["nodes"]:
        if "parameters" in node:
            params_str = json.dumps(node["parameters"])
            for old_name, new_name in node_name_map.items():
                params_str = params_str.replace(f"$node['{old_name}']", f"$node['{new_name}']")
                params_str = params_str.replace(f"$node[\"{old_name}\"]", f"$node[\"{new_name}\"]")
            node["parameters"] = json.loads(params_str)

    data["nodes"] = [n for n in data["nodes"] if n["name"] not in deleted_nodes]

    conns = data.get("connections", {})
    mapped_conns = {}
    for src, outputs in conns.items():
        mapped_src = node_name_map.get(src, src)
        mapped_conns[mapped_src] = {}
        for typ, type_outputs in outputs.items():
            mapped_conns[mapped_src][typ] = []
            for group in type_outputs:
                new_group = []
                for tgt in group:
                    new_tgt = dict(tgt)
                    new_tgt["node"] = node_name_map.get(tgt["node"], tgt["node"])
                    new_group.append(new_tgt)
                mapped_conns[mapped_src][typ].append(new_group)

    def resolve_deletions(targets):
        resolved = []
        for t in targets:
            if t["node"] in deleted_nodes:
                if t["node"] in mapped_conns and t["type"] in mapped_conns[t["node"]]:
                    # Forward deleted node's children
                    for c_group in mapped_conns[t["node"]][t["type"]]:
                        resolved.extend(resolve_deletions(c_group))
            else:
                resolved.append(t)
        # Dedupe targets
        seen = set()
        unique_resolved = []
        for ur in resolved:
            k = f"{ur['node']}-{ur['type']}-{ur['index']}"
            if k not in seen:
                seen.add(k)
                unique_resolved.append(ur)
        return unique_resolved

    final_conns = {}
    for src, outputs in mapped_conns.items():
        if src in deleted_nodes:
            continue
        final_conns[src] = {}
        for typ, type_outputs in outputs.items():
            final_conns[src][typ] = []
            for group in type_outputs:
                resolved_group = resolve_deletions(group)
                final_conns[src][typ].append(resolved_group)

    data["connections"] = final_conns

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Processed workflow saved to {output_file}")

if __name__ == "__main__":
    process_workflow(sys.argv[1], sys.argv[2])
