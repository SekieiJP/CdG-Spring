# Training Advisor (Game Assist)

`trainingAdvisor.js` は、現在ターン・ステータス・研修候補からおすすめ取得カードを返す補助モジュールです。

## Export
- `recommendTrainingCard(input)`
- `recommendCardName(input)`
- `explainTopChoice(input)`

## Input
```js
{
  difficulty: 'pro' | 'fresh',
  strategyProfile: 'stable' | 'smax' | 'upside', // optional, default: 'stable'
  turn: 0..7,
  status: {
    experience: number,
    enrollment: number,
    satisfaction: number,
    accounting: number
  },
  options: [
    'カード名A',
    { cardName: 'カード名B', category: '教務', rarity: 'SR', effect: '+2入塾' }
  ],
  cardLookup: {
    'カード名A': { category: '庶務', rarity: 'R', effect: '...' }
  }
}
```

## Output
```js
{
  recommendedCardName: '振込用紙印刷',
  ranking: [
    { cardName: '振込用紙印刷', category: '庶務', rarity: 'R', score: 4.23, reasonTags: ['acc', 'diff'] }
  ],
  needsSnapshot: { ... },
  summary: 'おすすめ: 振込用紙印刷（重視: 入退差・退塾抑制）'
}
```

## Usage Example
```js
import {
  buildCardLookup,
  recommendTrainingCard,
  explainTopChoice
} from './assist/trainingAdvisor.js';

const advisorInput = {
  difficulty: 'pro',
  turn: game.gameState.turn,
  status: {
    experience: game.gameState.player.experience,
    enrollment: game.gameState.player.enrollment,
    satisfaction: game.gameState.player.satisfaction,
    accounting: game.gameState.player.accounting
  },
  options: game.gameState.currentTrainingCards,
  cardLookup: buildCardLookup(game.cardManager.allCards || [])
};

const result = recommendTrainingCard(advisorInput);

console.log(result.recommendedCardName);
console.log(explainTopChoice(advisorInput));
```

## Integration Notes
- 研修候補表示直後に呼び出して、推薦1位カードにバッジを付与する運用を想定。
- PROの重みは `solver/autoplay-agent.mjs` の優秀方略（現時点は stable 寄り）をベースにしている。
- 将来は solver 側重みをJSON化し、アシストと共通化する。
