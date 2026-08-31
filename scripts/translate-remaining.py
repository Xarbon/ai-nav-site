#!/usr/bin/env python3
"""Translate remaining missing _en fields"""
import subprocess, json, urllib.request, urllib.parse, time

TOKEN = 'REDACTED_CLOUDFLARE_TOKEN'

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

# Get tools missing ANY _en field
tools = query("""SELECT id, name, 
  opc_scenario, opc_scenario_en,
  core_capabilities, core_capabilities_en,
  pros, pros_en,
  cons, cons_en,
  business_question_list, business_question_list_en,
  payment_info, payment_info_en
FROM tools WHERE status='active' 
AND (
  (core_capabilities IS NOT NULL AND core_capabilities != '[]' AND (core_capabilities_en IS NULL OR core_capabilities_en = '[]'))
  OR (pros IS NOT NULL AND pros != '[]' AND (pros_en IS NULL OR pros_en = '[]'))
  OR (cons IS NOT NULL AND cons != '[]' AND (cons_en IS NULL OR cons_en = '[]'))
  OR (business_question_list IS NOT NULL AND business_question_list != '[]' AND (business_question_list_en IS NULL OR business_question_list_en = '[]'))
  OR (payment_info IS NOT NULL AND payment_info != '' AND (payment_info_en IS NULL OR payment_info_en = ''))
)
LIMIT 100""")

print(f'找到 {len(tools)} 个需要补充翻译的工具\n')

fields_to_translate = [
    ('core_capabilities', 'core_capabilities_en'),
    ('pros', 'pros_en'),
    ('cons', 'cons_en'),
    ('business_question_list', 'business_question_list_en'),
]

translated_count = 0

for i, tool in enumerate(tools):
    updates = []
    
    for zh_field, en_field in fields_to_translate:
        zh_val = tool.get(zh_field) or ''
        en_val = tool.get(en_field) or ''
        
        if zh_val and zh_val != '[]' and (not en_val or en_val == '[]' or en_val == ''):
            try:
                arr = json.loads(zh_val)
                en_arr = []
                for s in arr[:5]:
                    if isinstance(s, str) and s.strip():
                        en_arr.append(translate(s))
                        time.sleep(0.15)
                    else:
                        en_arr.append(s)
                en_json = json.dumps(en_arr, ensure_ascii=False)
                updates.append(f"{en_field} = '{escape(en_json)}'")
            except:
                pass
    
    # Check payment_info
    pi = tool.get('payment_info') or ''
    pi_en = tool.get('payment_info_en') or ''
    if pi and pi.strip() and not pi_en:
        en_pi = translate(pi)
        time.sleep(0.15)
        updates.append(f"payment_info_en = '{escape(en_pi)}'")
    
    if updates:
        print(f'[{i+1}/{len(tools)}] {tool["name"]} - {len(updates)} 个字段')
        sql = f"UPDATE tools SET {', '.join(updates)} WHERE id = '{tool['id']}'"
        exec_sql(sql)
        translated_count += 1
        time.sleep(0.2)

print(f'\n✅ 完成！补充翻译了 {translated_count} 个工具')
