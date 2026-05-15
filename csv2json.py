#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
csv2json.py — Googleスプレッドシートから書き出したCSVを data.json / events.json に変換します。

使い方:
  1. Googleスプレッドシートの「人物」シートを「ファイル → ダウンロード → カンマ区切り（.csv）」
     でダウンロード、ファイル名を 01_人物.csv にして spreadsheet-template/ に置く。
  2. 同様に「事件解説」シートを 02_事件解説.csv として置く。
  3. このサイトのフォルダで次を実行:
        python scripts/csv2json.py
  4. data.json と events.json が更新されます。

要件: Python 3.7 以上（標準ライブラリのみ使用、追加インストール不要）

オプション:
  --csv-dir <path>   CSVが置かれたフォルダ（デフォルト: spreadsheet-template）
  --out-dir <path>   data.json / events.json を出力するフォルダ（デフォルト: カレント）
  --check-only       書き出さず、CSVのバリデーションだけを行う
"""

import csv
import json
import os
import sys
import re
import argparse


# 配列項目をセル内で区切るデリミタ（半角セミコロン＋スペース）
ARRAY_DELIM = ';'


def split_array(cell):
    """セル内の `; ` 区切り文字列を配列に分解。空セルは空リスト。"""
    if cell is None:
        return []
    s = str(cell).strip()
    if not s:
        return []
    items = [x.strip() for x in s.split(ARRAY_DELIM)]
    return [x for x in items if x]


def parse_year(value):
    """生没年セルを文字列または None として返す。空欄は None。"""
    if value is None:
        return None
    s = str(value).strip()
    return s if s else ""


def read_people_csv(path):
    """人物CSVを読み、辞書のリストを返す。"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"人物CSVが見つかりません: {path}")
    out = []
    with open(path, 'r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        # 必須列の確認
        needed = ['ID', '人物名', '動画タイトル', '動画URL']
        missing = [c for c in needed if c not in reader.fieldnames]
        if missing:
            raise ValueError(f"CSVに必須列が足りません: {missing}\n見つかった列: {reader.fieldnames}")
        for i, row in enumerate(reader, start=2):  # 2行目から（1行目はヘッダ）
            if not row.get('ID', '').strip() and not row.get('人物名', '').strip():
                continue  # 空行はスキップ
            entry = {
                'id': row.get('ID', '').strip(),
                'name': row.get('人物名', '').strip(),
                'reading': row.get('読み', '').strip(),
                'title': row.get('動画タイトル', '').strip(),
                'url': row.get('動画URL', '').strip(),
                'birth': parse_year(row.get('生年')),
                'death': parse_year(row.get('没年')),
                'era': row.get('時代', '').strip(),
                'country': row.get('国', '').strip(),
                'events': split_array(row.get('関連事件')),
                'keywords': split_array(row.get('関連キーワード')),
                'role': row.get('役割', '').strip(),
                'themes': split_array(row.get('テーマ')),
                'summary': row.get('要約', '').strip(),
                '_row': i,
            }
            out.append(entry)
    return out


def read_events_csv(path):
    """事件解説CSVを読み、辞書を返す（キー=事件名）。"""
    if not os.path.exists(path):
        raise FileNotFoundError(f"事件解説CSVが見つかりません: {path}")
    out = {}
    with open(path, 'r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        needed = ['事件名', '概要']
        missing = [c for c in needed if c not in reader.fieldnames]
        if missing:
            raise ValueError(f"CSVに必須列が足りません: {missing}\n見つかった列: {reader.fieldnames}")
        for i, row in enumerate(reader, start=2):
            name = row.get('事件名', '').strip()
            if not name:
                continue
            out[name] = {
                'year': row.get('年', '').strip(),
                'era': row.get('時代', '').strip(),
                'summary': row.get('概要', '').strip(),
                'key_people': split_array(row.get('主要人物')),
                'see_also': split_array(row.get('関連事件')),
            }
    return out


def validate_people(people):
    """人物データの簡単なバリデーション。エラー件数を返す。"""
    errors = 0
    seen_ids = set()
    seen_urls = set()
    for p in people:
        row = p.get('_row', '?')
        if not p['id']:
            print(f"  [WARN] 行{row}: ID が空です ({p.get('name', '?')})")
            errors += 1
        elif p['id'] in seen_ids:
            print(f"  [ERROR] 行{row}: ID '{p['id']}' が重複しています")
            errors += 1
        else:
            seen_ids.add(p['id'])
        if not p['name']:
            print(f"  [WARN] 行{row}: 人物名が空です (ID={p.get('id', '?')})")
            errors += 1
        if not p['url']:
            print(f"  [WARN] 行{row}: 動画URLが空です ({p.get('name', '?')})")
        elif not p['url'].startswith('http'):
            print(f"  [ERROR] 行{row}: 動画URLが http で始まっていません: {p['url']}")
            errors += 1
        elif p['url'] in seen_urls:
            # 同じURLの重複は警告のみ（「再投稿」など意図的なケースもあるため）
            print(f"  [INFO] 行{row}: URL重複 ({p['name']}): {p['url']}")
        else:
            seen_urls.add(p['url'])
        if not p['country']:
            print(f"  [WARN] 行{row}: 国が空です ({p['name']})")
            errors += 1
    return errors


def validate_events(events, people):
    """事件解説と人物の整合性をチェック（参照リンクが存在するか）。"""
    warnings = 0
    event_keys = set(events.keys())
    # 人物の events タグが、事件解説に存在するか
    referenced_events = set()
    for p in people:
        for e in p.get('events', []):
            referenced_events.add(e)
    # 解説のない事件タグ
    no_desc = referenced_events - event_keys
    if no_desc:
        print(f"  [INFO] 人物に紐付いているが解説がない事件 ({len(no_desc)}件): {sorted(no_desc)[:10]}{'...' if len(no_desc)>10 else ''}")
    # see_also チェック
    for ev_name, ev in events.items():
        for sa in ev.get('see_also', []):
            if sa not in event_keys:
                # see_also の参照先がないのは普通（未追加事件）。情報のみ。
                pass
    return warnings


def write_people_json(people, out_path):
    """JSONファイルとして書き出し。"""
    clean = []
    for p in people:
        e = {k: v for k, v in p.items() if k != '_row'}
        # 空文字列は値として残す（タイプ一貫性のため）
        clean.append(e)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(clean, f, ensure_ascii=False, indent=2)


def write_events_json(events, out_path):
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(events, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description='CSV→JSON converter for kisaki-historia')
    parser.add_argument('--csv-dir', default=None, help='CSVが置かれたフォルダ')
    parser.add_argument('--out-dir', default=None, help='JSONを出力するフォルダ')
    parser.add_argument('--check-only', action='store_true', help='書き出さず検証のみ')
    args = parser.parse_args()

    # スクリプトの位置からプロジェクトルートを推定
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    csv_dir = args.csv_dir or os.path.join(project_dir, 'spreadsheet-template')
    out_dir = args.out_dir or project_dir

    people_csv = os.path.join(csv_dir, '01_人物.csv')
    events_csv = os.path.join(csv_dir, '02_事件解説.csv')

    print(f"📥 入力: {csv_dir}")
    print(f"📤 出力: {out_dir}")
    print()

    try:
        print("=== 人物CSV読み込み ===")
        people = read_people_csv(people_csv)
        print(f"  {len(people)}名を読み込み")

        print()
        print("=== 事件解説CSV読み込み ===")
        events = read_events_csv(events_csv)
        print(f"  {len(events)}件を読み込み")

        print()
        print("=== バリデーション ===")
        errors = validate_people(people)
        validate_events(events, people)
        if errors > 0:
            print(f"\n❌ {errors}件のエラーがあります。修正してから再実行してください。")
            sys.exit(1)
        else:
            print("  ✅ エラーなし")

        if args.check_only:
            print("\n--check-only モードのため書き出しはスキップしました。")
            return

        print()
        print("=== JSON書き出し ===")
        data_json = os.path.join(out_dir, 'data.json')
        events_json = os.path.join(out_dir, 'events.json')
        write_people_json(people, data_json)
        print(f"  ✅ {data_json}")
        write_events_json(events, events_json)
        print(f"  ✅ {events_json}")

        print()
        # サマリー
        jp = sum(1 for p in people if p.get('country') == '日本')
        non_jp = len(people) - jp
        print(f"📊 完了：人物 {len(people)}名（日本{jp} / 世界{non_jp}）／事件解説 {len(events)}件")
        print(f"📌 サイトをローカルで確認: python -m http.server 8000 → http://localhost:8000")
        print(f"📌 公開する場合は {out_dir} のフォルダ全体をホスティングサービスに再アップロード")

    except FileNotFoundError as e:
        print(f"\n❌ {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ エラーが発生しました: {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
