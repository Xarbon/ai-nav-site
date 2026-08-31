#!/usr/bin/env python3
"""
Fast translator v3 - uses wrangler CLI for each batch, but faster
"""
import subprocess, json, sys, time, urllib.request, urllib.parse, re

DB_NAME = 'aiqury-db'
TOKEN = 'REDACTED_CLOUDFLARE_TOKEN'

def d1_query(sql):
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute {DB_NAME} --remote --command="{sql}" --json 2>/dev/null'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    try:
        return json.loads(r.stdout)[0]['results']
    except:
        return []

def d1_exec_batch(sql_list):
    """Execute SQL batch via wrangler --file"""
    sql_content = ';\n'.join(sql_list) + ';'
    with open('/tmp/d1_batch.sql', 'w') as f:
        f.write(sql_content)
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute {DB_NAME} --remote --file=/tmp/d1_batch.sql 2>/dev/null'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    return r.returncode == 0

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

def escape_sql(s):
    return s.replace("'", "''")

def main():
    print('🌐 批量翻译 v3...\n')
    
    tools = d1_query("SELECT id, slug, name, opc_scenario, core_capabilities, pros, cons, business_question_list, payment_info, opc_scenario_en, core_capabilities_en, pros_en, cons_en, business_question_list_en, payment_info_en FROM tools WHERE status = 'active'")
    print(f'📦 找到 {len(tools)} 个工具')
    
    # Filter tools that still need translation for any field
    need = []
    for t in tools:
        needs_work = False
        for zh_f, en_f in [('opc_scenario','opc_scenario_en'),('core_capabilities','core_capabilities_en'),
                           ('pros','pros_en'),('cons','cons_en'),('business_question_list','business_question_list_en')]:
            zh_val = t.get(zh_f, '') or ''
            en_val = t.get(en_f, '') or ''
            if zh_val and zh_val != '[]' and (not en_val or en_val == '[]'):
                needs_work = True
                break
        pi = t.get('payment_info', '') or ''
        pi_en = t.get('payment_info_en', '') or ''
        if pi and pi.strip() and not pi_en:
            needs_work = True
        if needs_work:
            need.append(t)
    
    print(f'🔄 需要翻译: {len(need)} 个\n')
    
    # Translate unique strings first
    unique_strings = set()
    for t in need:
        for field in ['opc_scenario', 'core_capabilities', 'pros', 'cons', 'business_question_list']:
            val = t.get(field, '') or ''
            if val and val != '[]':
                try:
                    for s in json.loads(val):
                        if isinstance(s, str) and s.strip():
                            unique_strings.add(s)
                except:
                    pass
        pi = t.get('payment_info', '') or ''
        if pi and pi.strip():
            unique_strings.add(pi)
    
    print(f'📝 唯一字符串: {len(unique_strings)} 个')
    
    cache = {}
    done = 0
    for s in unique_strings:
        cache[s] = translate(s)
        done += 1
        if done % 50 == 0:
            print(f'  翻译进度: {done}/{len(unique_strings)}')
        time.sleep(0.15)
    
    print(f'✅ 翻译完成 {len(cache)} 个字符串\n')
    
    # Build SQL updates
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
            zh_val = t.get(zh_field, '') or ''
            en_val = t.get(en_field, '') or ''
            if zh_val and zh_val != '[]' and (not en_val or en_val == '[]'):
                try:
                    arr = json.loads(zh_val)
                    en_arr = [cache.get(s, s) for s in arr]
                    en_json = json.dumps(en_arr, ensure_ascii=False)
                    updates.append(f"{en_field} = '{escape_sql(en_json)}'")
                except:
                    pass
        
        pi = t.get('payment_info', '') or ''
        pi_en = t.get('payment_info_en', '') or ''
        if pi and pi.strip() and not pi_en:
            en_pi = cache.get(pi, pi)
            updates.append(f"payment_info_en = '{escape_sql(en_pi)}'")
        
        if updates:
            sql_batch.append(f"UPDATE tools SET {', '.join(updates)} WHERE id = '{t['id']}'")
            count += 1
            
            if len(sql_batch) >= 10:
                print(f'  💾 保存 {len(sql_batch)} 条 (累计 {count}/{len(need)})')
                ok = d1_exec_batch(sql_batch)
                if not ok:
                    print(f'  ⚠️ 批量保存失败，尝试逐条保存')
                    for sql in sql_batch:
                        d1_exec_batch([sql])
                sql_batch = []
    
    if sql_batch:
        print(f'  💾 保存最后 {len(sql_batch)} 条')
        d1_exec_batch(sql_batch)
    
    print(f'\n🎉 全部完成！翻译了 {count} 个工具')

if __name__ == '__main__':
    main()
