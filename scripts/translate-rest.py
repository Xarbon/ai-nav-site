#!/usr/bin/env python3
"""Translate remaining _en fields: core_capabilities, pros, cons, business_question_list, payment_info"""
import subprocess, json, urllib.request, urllib.parse, time

TOKEN = 'REDACTED_CLOUDFLARE_TOKEN'

def query(sql):
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute aiqury-db --remote --command="{sql}" --json 2>/dev/null'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    try: return json.loads(r.stdout)[0]['results']
    except: return []

def exec_sql(sql):
    with open('/tmp/d1.sql', 'w') as f: f.write(sql)
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
    except: pass
    return text

def escape(s): return s.replace("'", "''")

# Get tools missing any _en field
tools = query("""SELECT id, name, 
  core_capabilities, core_capabilities_en,
  pros, pros_en, cons, cons_en,
  business_question_list, business_question_list_en,
  payment_info, payment_info_en
FROM tools WHERE status='active' 
AND (
  (core_capabilities IS NOT NULL AND core_capabilities != '[]' AND (core_capabilities_en IS NULL OR core_capabilities_en = '[]'))
  OR (pros IS NOT NULL AND pros != '[]' AND (pros_en IS NULL OR pros_en = '[]'))
  OR (cons IS NOT NULL AND cons != '[]' AND (cons_en IS NULL OR cons_en = '[]'))
  OR (business_question_list IS NOT NULL AND business_question_list != '[]' AND (business_question_list_en IS NULL OR business_question_list_en = '[]'))
  OR (payment_info IS NOT NULL AND payment_info != '' AND (payment_info_en IS NULL OR payment_info_en = ''))
)""")

print(f'需要补充翻译: {len(tools)} 个工具\n')

# First collect all unique strings
unique = set()
for t in tools:
    for field in ['core_capabilities', 'pros', 'cons', 'business_question_list']:
        val = t.get(field) or ''
        if val and val != '[]':
            try:
                for s in json.loads(val):
                    if isinstance(s, str) and s.strip():
                        unique.add(s)
            except: pass
    pi = t.get('payment_info') or ''
    if pi and pi.strip():
        unique.add(pi)

print(f'唯一字符串: {len(unique)} 个')

# Translate all unique strings
cache = {}
done = 0
for s in unique:
    cache[s] = translate(s)
    done += 1
    if done % 50 == 0:
        print(f'  翻译进度: {done}/{len(unique)}')
    time.sleep(0.15)

print(f'✅ 翻译完成 {len(cache)} 个字符串\n')

# Now update each tool
count = 0
for t in tools:
    updates = []
    for zh_f, en_f in [('core_capabilities','core_capabilities_en'),('pros','pros_en'),
                       ('cons','cons_en'),('business_question_list','business_question_list_en')]:
        zh_val = t.get(zh_f) or ''
        en_val = t.get(en_f) or ''
        if zh_val and zh_val != '[]' and (not en_val or en_val == '[]'):
            try:
                arr = json.loads(zh_val)
                en_arr = [cache.get(s, s) for s in arr]
                updates.append(f"{en_f} = '{escape(json.dumps(en_arr, ensure_ascii=False))}'")
            except: pass
    
    pi = t.get('payment_info') or ''
    pi_en = t.get('payment_info_en') or ''
    if pi and pi.strip() and not pi_en:
        updates.append(f"payment_info_en = '{escape(cache.get(pi, pi))}'")
    
    if updates:
        sql = f"UPDATE tools SET {', '.join(updates)} WHERE id = '{t['id']}'"
        exec_sql(sql)
        count += 1
        if count % 20 == 0:
            print(f'  💾 已保存 {count}/{len(tools)}')
        time.sleep(0.1)

print(f'\n🎉 完成！补充翻译了 {count} 个工具')
