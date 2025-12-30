# open-tools

ブックマークレット・ユーティリティスクリプト集

<!--
設定:
  GITHUB_USER: deatu
  REPO_NAME: open-tools
-->

## 使い方

### jsDelivr CDN 経由で読み込み

Base URL: `https://cdn.jsdelivr.net/gh/deatu/open-tools/`

| バージョン | ファイル |
|-----------|---------|
| 安定版 | `zipArchiver.js` |
| 開発版 | `zipArchiver-dev.js` |

### ブックマークレット

**zipArchiver（統一版）**
```javascript
javascript:(function(){var k='za_t',n=Date.now(),l=+localStorage.getItem(k)||0,d=n-l<600;localStorage.setItem(k,n);if(d){clearTimeout(window._za);var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/deatu/open-tools@main/zipArchiver-dev.js';document.body.appendChild(s)}else{window._za=setTimeout(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/deatu/open-tools@main/zipArchiver.js';document.body.appendChild(s)},600)}})();
```

| 操作 | 結果 |
|------|------|
| 1回実行 | 600ms後に安定版 |
| 素早く2回実行 | 開発版のみ（安定版はキャンセル） |

<details>
<summary>個別版（従来）</summary>

**zipArchiver 安定版**
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/deatu/open-tools@main/zipArchiver.js';document.body.appendChild(s);})();
```

**zipArchiver 開発版**
```javascript
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/deatu/open-tools@main/zipArchiver-dev.js';document.body.appendChild(s);})();
```

</details>

## バージョン情報

`version.json` に各バージョンのソースコミットと日時が記録されています。

## ライセンス

All Rights Reserved - 再利用・再配布を禁止します
