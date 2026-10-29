# today-calendar

日本時間の今日の日にちと曜日を、卓上カレンダー風の SVG 画像で返すプログラムです。Scrapbox（現 Cosense）のページに URL を貼っておくと、毎日その日の日付が表示されます。

![カレンダーの表示例](docs/preview.svg)

## 使い方

Scrapbox のページに、次のどちらかを貼ります。

```text
[https://<公開URL>/today/jp.svg]
[https://<公開URL>/today/en.svg]
```

- `jp.svg` は「日 月 火 水 木 金 土」、`en.svg` は「Sun Mon Tue Wed Thu Fri Sat」で曜日を表示します。
- 日曜・祝日の曜日は赤、土曜は青になります。
- 日付は日本時間の 0 時に切り替わります。開いたままのページは自動では変わらないので、再読み込みしてください。
- OS やブラウザがダークモードのときは暗い配色になります。Scrapbox のテーマ設定とは連動しません。

## 仕組み

実装はすべて [`src/index.ts`](src/index.ts) にあります。

- `Date.now()` に 9 時間を足し、UTC の各フィールドから日本時間の日付を取得します。
- 祝日は現行の祝日法のルール（固定日・ハッピーマンデー・春分／秋分・振替休日・国民の休日）で計算します。祝日法が変わったときはコードの更新が必要です。
- 400×300 の SVG を、枠の `rect` と日にち・曜日の 2 つの `text` で組み立てます。
- `Cache-Control: no-store` で返します。Scrapbox の ServiceWorker は画像をネットワーク優先で取得するため、固定 URL でもページを開き直せば更新されます。

## 自分で動かす

Node.js（バージョンは [`.nvmrc`](.nvmrc)）、npm、Cloudflare アカウントを用意します。

```bash
npm ci
npm run dev    # http://localhost:8787/today/jp.svg で確認
```

Cloudflare Workers へのデプロイ:

```bash
npx wrangler login
npm run deploy
```

Worker の名前は [`wrangler.jsonc`](wrangler.jsonc) の `name` で変えられます。デプロイ後に表示される URL を、「使い方」と同じ形で Scrapbox に貼ります。

## 開発

```bash
npm run check    # 型チェック・Oxlint・Biome のフォーマット確認
npm run fix      # Oxlint の自動修正とフォーマット
npm run lint     # リントのみ
npm run format   # フォーマットのみ
```

## クレジット・ライセンス

daiiz さんの「Today」（`apps.daiiz.dev/today/jp.svg`）を参考に作りました。

MIT License。詳細は [LICENSE](LICENSE) を参照してください。
