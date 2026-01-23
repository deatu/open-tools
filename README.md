# open-tools

ブックマークレット・ユーティリティスクリプト集

<!--
設定:
  GITHUB_USER: deatu
  REPO_NAME: open-tools
-->

## 使い方

### GitHub Pages 経由で読み込み

Base URL: `https://deatu.github.io/open-tools/`

| バージョン | ファイル |
|-----------|---------|
| 安定版 | `zipArchiver.js` |
| 開発版 | `zipArchiver-dev.js` |

### ブックマークレット

**zipArchiver（統一版）**
```javascript
javascript:(function(){var k='za_t',n=Date.now(),l=+localStorage.getItem(k)||0,d=n-l<600;localStorage.setItem(k,n);if(d){clearTimeout(window._za);var s=document.createElement('script');s.src='https://deatu.github.io/open-tools/zipArchiver-dev.js';document.body.appendChild(s)}else{window._za=setTimeout(function(){var s=document.createElement('script');s.src='https://deatu.github.io/open-tools/zipArchiver.js';document.body.appendChild(s)},600)}})();
```

| 操作 | 結果 |
|------|------|
| 1回実行 | 600ms後に安定版 |
| 素早く2回実行 | 開発版のみ（安定版はキャンセル） |

<details>
<summary>個別版（従来）</summary>

**zipArchiver 安定版**
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://deatu.github.io/open-tools/zipArchiver.js';document.body.appendChild(s);})();
```

**zipArchiver 開発版**
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://deatu.github.io/open-tools/zipArchiver-dev.js';document.body.appendChild(s);})();
```

</details>

---

## 機能一覧

### キーボードショートカット

| キー | ボタン名 | 機能 |
|------|---------|------|
| `a` | all | 全選択/解除 |
| `c` | copy | 選択アイテムをJSONコピー |
| `d` | download | ダウンロード（ZIP） |
| `v` | open-tabs-vid | 選択動画を新タブで開く |
| `p` | open-tabs-page | 選択ページを新タブで開く |
| `s` | sort-by-group | グループ順でソート |
| `i` | sort-by-index | インデックス順でソート |
| `r` | remove | 選択アイテムを削除 |
| `g` | remove-groups | 選択グループを削除 |
| `t` | toggle-text | テキスト表示切替 |
| `f` | fetch-url | 外部URLから取得 |
| `j` | add-json | JSONからアイテム追加 |
| `k` | check | リンク有効性チェック |
| `m` | move-top | 選択を先頭に移動 |
| `l` | select-json | JSONから選択状態を復元 |
| - | match-remove | テキストマッチで非表示 |
| - | range-toggle | 範囲選択切替 |
| - | undo | 直前の状態に戻す |
| - | reset | 初期状態にリセット |
| - | set-threshold | 分割サイズ設定 |

### デバッグ専用（開発版のみ）

| キー | ボタン名 | 機能 |
|------|---------|------|
| `e` | ext-dl | 拡張機能経由で個別DL |
| `z` | ext-zip | 拡張機能経由でZIP DL |
| `b` | toggle-debug-mode | デバッグモード切替 |
| `x` | toggle-ext | 拡張機能有効/無効切替 |

---

## バージョン情報

`version.json` に各バージョンのソースコミットと日時が記録されています。

<details>
<summary>CDN（参考・現在未使用）</summary>

```
安定版: https://cdn.jsdelivr.net/gh/deatu/open-tools@main/zipArchiver.js
開発版: https://cdn.jsdelivr.net/gh/deatu/open-tools@main/zipArchiver-dev.js
```

</details>

## ライセンス

All Rights Reserved - 再利用・再配布を禁止します
