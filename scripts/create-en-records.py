#!/usr/bin/env python3
"""
为每个 zh 工具创建 en 副本记录
en 记录的 slug 加 -en 后缀以避免唯一约束冲突
"""
import subprocess, json, time

TOKEN = 'REDACTED_CLOUDFLARE_TOKEN'

def d1_exec(sql):
    with open('/tmp/d1.sql', 'w') as f: f.write(sql)
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute aiqury-db --remote --file=/tmp/d1.sql 2>/dev/null'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
    return r.returncode == 0

def d1_query(sql):
    cmd = f'CLOUDFLARE_API_TOKEN={TOKEN} npx wrangler d1 execute aiqury-db --remote --command="{sql}" --json 2>/dev/null'
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
    try: return json.loads(r.stdout)[0]['results']
    except: return []

def esc(s):
    return (s or '').replace("'", "''")

print('检查当前状态...')
result = d1_query("SELECT locale, COUNT(*) as cnt FROM tools GROUP BY locale")
for r in result:
    print(f'  {r.get("locale","NULL")}: {r["cnt"]} 条')

# 检查是否已有 en 记录
en_count = d1_query("SELECT COUNT(*) as cnt FROM tools WHERE locale = 'en'")
if en_count and en_count[0]['cnt'] > 0:
    print(f'\n已有 {en_count[0]["cnt"]} 个 en 记录，跳过创建')
else:
    print('\n开始创建 en 记录...')
    tools = d1_query("SELECT * FROM tools WHERE locale = 'zh' OR locale IS NULL")
    print(f'找到 {len(tools)} 个 zh 工具')
    
    count = 0
    for t in tools:
        # en 记录使用 -en 后缀的 slug
        en_slug = t.get('slug', '') + '-en'
        
        # en 记录使用 _en 字段作为主字段
        name = t.get('name_en') or t.get('name', '')
        desc = t.get('description_en') or t.get('description', '')
        detail = t.get('detail_en') or t.get('detail', '')
        opc = t.get('opc_scenario_en') or t.get('opc_scenario', '[]')
        cap = t.get('core_capabilities_en') or t.get('core_capabilities', '[]')
        pros = t.get('pros_en') or t.get('pros', '[]')
        cons = t.get('cons_en') or t.get('cons', '[]')
        biz = t.get('business_question_list_en') or t.get('business_question_list', '[]')
        pay = t.get('payment_info_en') or t.get('payment_info', '')
        
        import uuid
        en_id = str(uuid.uuid4())
        
        sql = f"""INSERT INTO tools (id, slug, name, name_en, url, description, description_en, detail, detail_en, icon_url, category, sub_category, audience_tags, pricing, pricing_detail, language, rating, tags, is_hot, is_recommended, is_new, affiliate_url, workflow, sort_order, status, run_mode, hardware_level, learn_level, hardware_note, commercial_notice, business_question_list, seo_title, seo_meta_desc, opc_scenario, payment_info, cn_access, pros, cons, core_capabilities, copyright_note, pricing_note, access_note, difficulty_note, capability_note, scenario_note, opc_scenario_en, core_capabilities_en, pros_en, cons_en, business_question_list_en, payment_info_en, locale)
VALUES ('{esc(en_id)}', '{esc(en_slug)}', '{esc(name)}', '{esc(t.get("name_en",""))}', '{esc(t.get("url",""))}', '{esc(desc)}', '{esc(t.get("description_en",""))}', '{esc(detail)}', '{esc(t.get("detail_en",""))}', '{esc(t.get("icon_url",""))}', '{esc(t.get("category",""))}', '{esc(t.get("sub_category",""))}', '{esc(t.get("audience_tags",""))}', '{esc(t.get("pricing",""))}', '{esc(t.get("pricing_detail",""))}', '{esc(t.get("language",""))}', {t.get("rating",0) or 0}, '{esc(t.get("tags",""))}', {1 if t.get("is_hot") else 0}, {1 if t.get("is_recommended") else 0}, {1 if t.get("is_new") else 0}, '{esc(t.get("affiliate_url",""))}', '{esc(t.get("workflow",""))}', {t.get("sort_order",0) or 0}, '{esc(t.get("status","active"))}', '{esc(t.get("run_mode",""))}', '{esc(t.get("hardware_level",""))}', '{esc(t.get("learn_level",""))}', '{esc(t.get("hardware_note",""))}', '{esc(t.get("commercial_notice",""))}', '{esc(biz)}', '{esc(t.get("seo_title",""))}', '{esc(t.get("seo_meta_desc",""))}', '{esc(opc)}', '{esc(pay)}', '{esc(t.get("cn_access",""))}', '{esc(pros)}', '{esc(cons)}', '{esc(cap)}', '{esc(t.get("copyright_note",""))}', '{esc(t.get("pricing_note",""))}', '{esc(t.get("access_note",""))}', '{esc(t.get("difficulty_note",""))}', '{esc(t.get("capability_note",""))}', '{esc(t.get("scenario_note",""))}', '{esc(t.get("opc_scenario_en",""))}', '{esc(t.get("core_capabilities_en",""))}', '{esc(t.get("pros_en",""))}', '{esc(t.get("cons_en",""))}', '{esc(t.get("business_question_list_en",""))}', '{esc(t.get("payment_info_en",""))}', 'en')"""
        
        d1_exec(sql)
        count += 1
        if count % 50 == 0:
            print(f'  已创建 {count}/{len(tools)} 个 en 记录')
        time.sleep(0.1)
    
    print(f'\n✅ 完成！创建了 {count} 个 en 记录')

# 最终验证
print('\n最终状态:')
result = d1_query("SELECT locale, COUNT(*) as cnt FROM tools GROUP BY locale")
for r in result:
    print(f'  {r.get("locale","NULL")}: {r["cnt"]} 条')
