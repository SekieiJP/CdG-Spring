# アシスト機能計画（カード取得おすすめ）

## 目的
現在のターン・ステータス・研修候補カードを入力すると、PRO/FRESHの優秀方略に沿った「おすすめ取得カード」を返すアシストJSを提供する。

## 生成物
- `trainingAdvisor.js`
  - pure function中心の推薦モジュール
  - 本編UI未依存（単体テストしやすい）
- `README.md`
  - 呼び出しI/Fと本編統合手順

## I/F（初版）
- 入力
  - `difficulty`: `'pro' | 'fresh'`（初版はPRO重視、FRESHは簡易）
  - `turn`: `0..7`
  - `status`: `{ experience, enrollment, satisfaction, accounting }`
  - `options`: `string[] | CardLike[]`
    - `CardLike`: `{ cardName, category?, rarity?, effect? }`
  - `cardLookup`（任意）: `{ [cardName]: { category, rarity, effect } }`
- 出力
  - `recommendedCardName`
  - `ranking`: `[{ cardName, score, reasonTags }]`
  - `needsSnapshot`（不足/過剰の判定）
  - `summary`（UI表示向け1文）

## 方針（PRO）
- 指標は `S>=8` / `A+>=7` を重視。
- 退塾（= 経理不足 + 満足不足）抑制を前提にしつつ、満足の過剰取得は抑える。
- 入退差(入塾-退塾)と体験の不足を優先して埋める。
- カード名バイアスを最小限導入（低得点偏重カードは抑制、高得点寄与カードは加点）。

## 本編統合案
1. `main.js` から `trainingAdvisor.js` を import。
2. 研修候補提示時に `recommendTrainingCard(...)` を実行。
3. 推薦1位カードに「おすすめ」バッジを表示。
4. 任意で「理由表示」トグルを追加し `summary` を表示。
5. 実プレイログを収集し、`reasonTags` と実際の選択差分を検証。

## 観測項目（実装時）
- 推薦一致率（プレイヤー選択が推薦1位だった割合）
- 推薦追従時の最終ランク分布（S/A+/A...）
- 推薦追従時の満足過剰率（`satisfaction > 15`）

## 次の改良候補
- PRO専用で候補3枚の組み合わせ相性（次ターン期待値）を導入。
- 発想/整理/情熱トークン見込みを評価項目へ追加。
- `solver/autoplay-agent.mjs` の重みを JSON 化し、同一重みをアシスト側で再利用。
