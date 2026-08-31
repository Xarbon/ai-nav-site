#!/usr/bin/env python3
"""Translate remaining payment_info fields"""
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

# Get tools missing payment_info_en
tools = query("SELECT id, name, payment_info, payment_info_en FROM tools WHERE status='active' AND payment_info IS NOT NULL AND payment_info != '' AND (payment_info_en IS NULL OR payment_info_en = '')")

print(f'需要翻译 payment_info: {len(tools)} 个\n')

# Collect unique strings
unique = set()
for t in tools:
    pi = t.get('payment_info') or ''
    if pi and pi.strip():
        unique.add(pi)

print(f'唯一字符串: {len(unique)} 个')

# Translate
cache = {}
done = 0
for s in unique:
    cache[s] = translate(s)
    done += 1
    if done % 20 == 0:
        print(f'  翻译进度: {done}/{len(unique)}')
    time.sleep(0.15)

print(f'✅ 翻译完成 {len(cache)} 个字符串\n')

# Update
count = 0
for t in tools:
    pi = t.get('payment_info') or ''
    if pi and pi.strip():
        en_pi = cache.get(pi, pi)
        sql = f"UPDATE tools SET payment_info_en = '{escape(en_pi)}' WHERE id = '{t['id']}'"
        exec_sql(sql)
        count += 1
        if count % 20 == 0:
            print(f'  💾 已保存 {count}/{len(tools)}')
        time.sleep(0.1)

print(f'\n🎉 完成！翻译了 {count} 个工具的 payment_info')
