#!/usr/bin/env python3
"""
Fast batch translator - translates unique strings once, maps back to tools
"""
import subprocess, json, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_NAME = 'aiqury-db'
TOKEN = 'os.environ.get('CLOUDFLARE_API_TOKEN', 'YOUR_TOKEN_HERE')'

def d1_query(sql):
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute {DB_NAME} --remote --command="{sql}" --json 2>/dev/null'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    try:
        return json.loads(r.stdout)[0]['results']
    except:
        return []

def d1_exec_sql_file(sql_content):
    with open('/tmp/d1_batch.sql', 'w') as f:
        f.write(sql_content)
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute {DB_NAME} --remote --file=/tmp/d1_batch.sql 2>/dev/null'
    subprocess.run(cmd, shell=True, timeout=60)

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
    except Exception as e:
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
    # Translate all items in parallel
    with ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(translate, arr))
    return json.dumps(results, ensure_ascii=False)

def escape_sql(s):
    return s.replace("'", "''")

def main():
    print('🌐 快速批量翻译...\n')
    
    # 1. Get all tools
    tools = d1_query("SELECT id, slug, name, opc_scenario, core_capabilities, pros, cons, business_question_list, payment_info, opc_scenario_en, core_capabilities_en FROM tools WHERE status = 'active'")
    print(f'📦 找到 {len(tools)} 个工具')
    
    need = [t for t in tools if not (t.get('opc_scenario_en') and t['opc_scenario_en'] != '[]' and t.get('core_capabilities_en') and t['core_capabilities_en'] != '[]')]
    print(f'🔄 需要翻译: {len(need)} 个\n')
    
    # 2. Collect ALL unique strings to translate
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
    
    print(f'📝 唯一字符串: {len(unique_strings)} 个需要翻译\n')
    
    # 3. Translate all unique strings with progress
    translation_cache = {}
    total = len(unique_strings)
    done = 0
    
    # Use ThreadPoolExecutor for parallel translation
    strings_list = list(unique_strings)
    
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(translate, s): s for s in strings_list}
        for future in as_completed(futures):
            s = futures[future]
            done += 1
            t = future.result()
            translation_cache[s] = t
            if done % 20 == 0 or done == total:
                print(f'  翻译进度: {done}/{total} ({done*100//total}%)')
    
    print(f'\n✅ 翻译完成 {len(translation_cache)} 个唯一字符串\n')
    
    # 4. Generate SQL for each tool
    batch_size = 20
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
                    en_arr = [translation_cache.get(s, s) for s in arr]
                    en_json = json.dumps(en_arr, ensure_ascii=False)
                    updates.append(f"{en_field} = '{escape_sql(en_json)}'")
                except:
                    pass
        
        pi = t.get('payment_info', '')
        if pi and pi.strip():
            en_pi = translation_cache.get(pi, pi)
            updates.append(f"payment_info_en = '{escape_sql(en_pi)}'")
        
        if updates:
            sql = f"UPDATE tools SET {', '.join(updates)} WHERE id = '{t['id']}';"
            sql_batch.append(sql)
            count += 1
            
            if len(sql_batch) >= batch_size:
                print(f'  💾 保存 {len(sql_batch)} 条 (累计 {count}/{len(need)})')
                d1_exec_sql_file('\n'.join(sql_batch))
                sql_batch = []
    
    if sql_batch:
        print(f'  💾 保存最后 {len(sql_batch)} 条')
        d1_exec_sql_file('\n'.join(sql_batch))
    
    print(f'\n🎉 全部完成！翻译了 {count} 个工具')

if __name__ == '__main__':
    main()
