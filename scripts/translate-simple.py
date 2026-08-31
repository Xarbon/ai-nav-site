#!/usr/bin/env python3
import subprocess, json, urllib.request, urllib.parse, time

TOKEN = 'os.environ.get('CLOUDFLARE_API_TOKEN', 'YOUR_TOKEN_HERE')'

def query(sql):
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute aiqury-db --remote --command="{sql}" --json 2>/dev/null'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    try:
        return json.loads(r.stdout)[0]['results']
    except:
        return []

def exec_sql(sql):
    with open('/tmp/d1.sql', 'w') as f:
        f.write(sql)
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute aiqury-db --remote --file=/tmp/d1.sql 2>/dev/null'
    subprocess.run(cmd, shell=True, timeout=30)

def translate(text):
    if not text: return text
    try:
        q = urllib.parse.quote(text[:500])
        url = f'https://api.mymemory.translated.net/get?q={q}&langpair=zh-CN|en-US'
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if data.get('responseStatus') == 200:
                return data['responseData']['translatedText']
    except:
        pass
    return text

def escape(s):
    return s.replace("'", "''")

# Get tools missing English data
tools = query("SELECT id, name, opc_scenario, core_capabilities, pros, cons, business_question_list, payment_info, opc_scenario_en, core_capabilities_en FROM tools WHERE status='active' AND (opc_scenario_en IS NULL OR opc_scenario_en='[]' OR core_capabilities_en IS NULL OR core_capabilities_en='[]') LIMIT 50")

print(f'找到 {len(tools)} 个需要翻译的工具\n')

for i, tool in enumerate(tools):
    print(f'[{i+1}/{len(tools)}] {tool["name"]}')
    
    updates = []
    
    # Translate opc_scenario
    if tool.get('opc_scenario') and (not tool.get('opc_scenario_en') or tool['opc_scenario_en'] == '[]'):
        try:
            arr = json.loads(tool['opc_scenario'])
            en_arr = [translate(s) for s in arr[:5]]  # Limit to 5 items
            time.sleep(0.2)
            en_json = json.dumps(en_arr, ensure_ascii=False)
            updates.append(f"opc_scenario_en = '{escape(en_json)}'")
        except:
            pass
    
    # Translate core_capabilities
    if tool.get('core_capabilities') and (not tool.get('core_capabilities_en') or tool['core_capabilities_en'] == '[]'):
        try:
            arr = json.loads(tool['core_capabilities'])
            en_arr = [translate(s) for s in arr[:5]]
            time.sleep(0.2)
            en_json = json.dumps(en_arr, ensure_ascii=False)
            updates.append(f"core_capabilities_en = '{escape(en_json)}'")
        except:
            pass
    
    # Translate pros
    if tool.get('pros'):
        try:
            arr = json.loads(tool['pros'])
            en_arr = [translate(s) for s in arr[:3]]
            time.sleep(0.2)
            en_json = json.dumps(en_arr, ensure_ascii=False)
            updates.append(f"pros_en = '{escape(en_json)}'")
        except:
            pass
    
    # Translate cons
    if tool.get('cons'):
        try:
            arr = json.loads(tool['cons'])
            en_arr = [translate(s) for s in arr[:3]]
            time.sleep(0.2)
            en_json = json.dumps(en_arr, ensure_ascii=False)
            updates.append(f"cons_en = '{escape(en_json)}'")
        except:
            pass
    
    # Translate business_question_list
    if tool.get('business_question_list'):
        try:
            arr = json.loads(tool['business_question_list'])
            en_arr = [translate(s) for s in arr[:3]]
            time.sleep(0.2)
            en_json = json.dumps(en_arr, ensure_ascii=False)
            updates.append(f"business_question_list_en = '{escape(en_json)}'")
        except:
            pass
    
    # Translate payment_info
    if tool.get('payment_info') and not tool.get('payment_info_en'):
        en_pi = translate(tool['payment_info'])
        time.sleep(0.2)
        updates.append(f"payment_info_en = '{escape(en_pi)}'")
    
    if updates:
        sql = f"UPDATE tools SET {', '.join(updates)} WHERE id = '{tool['id']}'"
        exec_sql(sql)
        print(f'  ✓ 已翻译并保存')
    
    time.sleep(0.3)

print('\n✅ 完成！')
