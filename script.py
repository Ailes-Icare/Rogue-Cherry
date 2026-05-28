import json
import re

log_file = r'C:\Users\inso\.gemini\antigravity\brain\aa087876-85d5-44e5-a6e2-f60d8d5d4027\.system_generated\logs\overview.txt'

try:
    with open(log_file, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
        
    # We want to find the LAST multi_replace_file_content or write_to_file that modified App.jsx
    import re
    # Just look for 'App.jsx' in the tool calls
    matches = re.finditer(r'\{[^{}]*"name"\s*:\s*"multi_replace_file_content"[^{}]*"App\.jsx"[^{}]*\}', content)
    # Actually json parsing is safer, but overview.txt has lines of json
    lines = content.split('\n')
    last_content = None
    
    for line in reversed(lines):
        if 'multi_replace_file_content' in line and 'App.jsx' in line:
            try:
                data = json.loads(line)
                for call in data.get('tool_calls', []):
                    if call['name'] == 'multi_replace_file_content' and 'App.jsx' in call['args']['TargetFile']:
                        print("Found a replace chunk! But we need the full file.")
            except:
                pass
except Exception as e:
    print('Error:', e)
