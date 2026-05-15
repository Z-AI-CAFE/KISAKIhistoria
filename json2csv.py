#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
json2csv.py — 現在の data.json / events.json を CSV に書き出します。

用途:
  * 初期セットアップ時、最新のJSONからスプレッドシート用のCSVテンプレートを作る
  * JSONを直接編集した後、その変更をスプレッドシート側にも反映するため
  * バックアップ用途

使い方:
  python scripts/json2csv.py

要件: Python 3.7 以上（標準ライブラリのみ）

オプション:
  --csv-dir <path>   CSV出力フォルダ（デフォルト: spreadsheet-template）
  --out-dir <path>   CSV出力フォルダの上位（指定された場合に csv-dir に解決）
"""

import csv
import json
import os
import sys
import argparse


ARRAY_DELIM = '; '


def join_array(arr):
    if not arr:
        return ''
    return ARRAY_DELIM.join(str(x) for x in arr if x)


def write_people_csv(people, path):
    headers = ['ID', '人物名', '読み', '動画タイトル', '動画URL', '生年', '没年',
               '時代', '国', '関連事件', '関連キーワード', '役割', 'テーマ', '要約']
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL)
        w.writerow(headers)
        for p in people:
            w.writerow([
                p.get('id', ''),
                p.get('name', ''),
                p.get('reading', ''),
                p.get('title', ''),
                p.get('url', ''),
                p.get('birth') if p.get('birth') is not None else '',
                p.get('death') if p.get('death') is not None else '',
                p.get('era', ''),
                p.get('country', ''),
                join_array(p.get('events', [])),
                join_array(p.get('keywords', [])),
                p.get('role', ''),
                join_array(p.get('themes', [])),
                p.get('summary', ''),
            ])


def write_events_csv(events, path):
    headers = ['事件名', '年', '時代', '概要', '主要人物', '関連事件']
    with open(path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL)
        w.writerow(headers)
        for name, ev in events.items():
            w.writerow([
                name,
                ev.get('year', ''),
                ev.get('era', ''),
                ev.get('summary', ''),
                join_array(ev.get('key_people', [])),
                join_array(ev.get('see_also', [])),
            ])


def main():
    parser = argparse.ArgumentParser(description='JSON→CSV exporter for kisaki-historia')
    parser.add_argument('--csv-dir', default=None, help='CSV出力フォルダ')
    parser.add_argument('--data', default=None, help='data.jsonへのパス')
    parser.add_argument('--events', default=None, help='events.jsonへのパス')
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    csv_dir = args.csv_dir or os.path.join(project_dir, 'spreadsheet-template')
    data_json = args.data or os.path.join(project_dir, 'data.json')
    events_json = args.events or os.path.join(project_dir, 'events.json')

    if not os.path.exists(data_json):
        print(f"❌ {data_json} が見つかりません")
        sys.exit(1)
    if not os.path.exists(events_json):
        print(f"❌ {events_json} が見つかりません")
        sys.exit(1)

    os.makedirs(csv_dir, exist_ok=True)

    print(f"📥 入力: {data_json}, {events_json}")
    print(f"📤 出力: {csv_dir}")
    print()

    with open(data_json, 'r', encoding='utf-8') as f:
        people = json.load(f)
    with open(events_json, 'r', encoding='utf-8') as f:
        events = json.load(f)

    people_csv = os.path.join(csv_dir, '01_人物.csv')
    events_csv = os.path.join(csv_dir, '02_事件解説.csv')

    write_people_csv(people, people_csv)
    print(f"  ✅ {people_csv}（{len(people)}行）")
    write_events_csv(events, events_csv)
    print(f"  ✅ {events_csv}（{len(events)}行）")

    print()
    print("📌 これらのCSVをGoogleスプレッドシートに「ファイル → インポート → アップロード」で取り込んでください。")
    print("📌 取り込み後は、シート側で編集 → ダウンロード → csv2json.py で再変換、というループで運用できます。")


if __name__ == '__main__':
    main()
