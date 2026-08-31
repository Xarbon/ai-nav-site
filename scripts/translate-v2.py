#!/usr/bin/env python3
"""
Fast translator v2 - uses D1 HTTP API directly, avoids slow wrangler CLI
"""
import subprocess, json, sys, time, urllib.request, urllib.parse, os, re

DB_ID = 'c5523847-81df-448f-b2bf-0a5ea8ed6ab9'
TOKEN = 'REDACTED_CLOUDFLARE_TOKEN'

# Get account ID from wrangler
def get_account_id():
    try:
        cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler whoami 2>/dev/null'
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
        m = re.search(r'[0-9a-f]{32}', r.stdout)
        if m:
            return m.group(0)
    except:
        pass
    return None

ACCOUNT_ID = get_account_id()
print(f'Account ID: {ACCOUNT_ID}')

def d1_query(sql):
    """Use Cloudflare D1 REST API directly"""
    url = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query'
    data = json.dumps({'sql': sql}).encode()
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            if result.get('success') and result.get('result', [{}])[0].get('results'):
                return result['result'][0]['results']
    except Exception as e:
        print(f'D1 query error: {e}')
    return []

def d1_exec(sql_list):
    """Execute multiple SQL statements via API"""
    combined = ';\n'.join(sql_list) + ';'
    url = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/d1/database/{DB_ID}/query'
    data = json.dumps({'sql': combined}).encode()
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
            return result.get('success', False)
    except Exception as e:
        print(f'D1 exec error: {e}')
        return False

def translate(text):
    if not text or not text.strip():
        return text
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

def translate_array(json_str):
    if not json_str:
        return '[]'
    try:
        arr = json.loads(json_str)
    except:
        return json_str
    if not arr:
        return '[]'
    results = [translate(s) if isinstance(s, str) and s.strip() else s for s in arr]
    return json.dumps(results, ensure_ascii=False)

def escape_sql(s):
    return s.replace("'", "''")

def main():
    if not ACCOUNT_ID:
        print('❌ Cannot get account ID')
        return
        
    print('🌐 快速批量翻译 v2 (D1 HTTP API)...\n')
    
    tools = d1_query("SELECT id, slug, name, opc_scenario, core_capabilities, pros, cons, business_question_list, payment_info, opc_scenario_en, core_capabilities_en FROM tools WHERE status = 'active'")
    print(f'📦 找到 {len(tools)} 个工具')
    
    need = [t for t in tools if not (t.get('opc_scenario_en') and t['opc_scenario_en'] != '[]' and t.get('core_capabilities_en') and t['core_capabilities_en'] != '[]')]
    print(f'🔄 需要翻译: {len(need)} 个\n')
    
    # Collect unique strings
    unique_strings = set()
    for t in need:
        for field in ['opc_scenario', 'core_capabilities', 'pros', 'cons', 'business_question_list']:
            val = t.get(field, '')
            if val and val != '[]':
                try:
                    arr = json.loads(val)
                    for s in arr:
                        if isinstance(s, str) and s.strip():
                            unique_strings.add(s)
                except:
                    pass
        pi = t.get('payment_info', '')
        if pi and pi.strip():
            unique_strings.add(pi)
    
    print(f'📝 唯一字符串: {len(unique_strings)} 个\n')
    
    # Translate all unique strings
    cache = {}
    done = 0
    for s in unique_strings:
        cache[s] = translate(s)
        done += 1
        if done % 50 == 0:
            print(f'  翻译进度: {done}/{len(unique_strings)} ({done*100//len(unique_strings)}%)')
        time.sleep(0.1)  # Small delay
    
    print(f'\n✅ 翻译完成 {len(cache)} 个唯一字符串\n')
    
    # Generate SQL updates
    sql_batch = []
    count = 0
    
    for t in need:
        updates = []
        for zh_field, en_field in [
            ('opc_scenario', 'opc_scenario_en'),
            ('core_capabilities', 'core_capabilities_en'),
            ('pros', 'pros_en'),
            ('cons', 'cons_en'),
            ('business_question_list', 'business_question_list_en'),
        ]:
            val = t.get(zh_field, '')
            if val and val != '[]':
                try:
                    arr = json.loads(val)
                    en_arr = [cache.get(s, s) for s in arr]
                    en_json = json.dumps(en_arr, ensure_ascii=False)
                    updates.append(f"{en_field} = '{escape_sql(en_json)}'")
                except:
                    pass
        
        pi = t.get('payment_info', '')
        if pi and pi.strip():
            en_pi = cache.get(pi, pi)
            updates.append(f"payment_info_en = '{escape_sql(en_pi)}'")
        
        if updates:
            sql_batch.append(f"UPDATE tools SET {', '.join(updates)} WHERE id = '{t['id']}'")
            count += 1
            
            if len(sql_batch) >= 50:
                print(f'  💾 批量保存 {len(sql_batch)} 条...')
                d1_exec(sql_batch)
                sql_batch = []
    
    if sql_batch:
        print(f'  💾 保存最后 {len(sql_batch)} 条')
        d1_exec(sql_batch)
    
    print(f'\n🎉 全部完成！翻译了 {count} 个工具')

if __name__ == '__main__':
    main()
