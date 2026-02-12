/**
 * Main - エントリーポイント
 * v20260208-1200: 中断・再開機能実装
 */
import { Logger } from './logger.js?v=20260212-2350';
import { GameState } from './gameState.js?v=20260212-2350';
import { CardManager } from './cardManager.js?v=20260212-2350';
import { TurnManager } from './turnManager.js?v=20260212-2350';
import { ScoreManager } from './scoreManager.js?v=20260212-2350';
import { UIController } from './uiController.js?v=20260212-2350';
import { SaveManager } from './saveManager.js?v=20260212-2350';

const CACHE_BUSTER = 'v20260212-2350';

// ビルドバージョンをグローバルに公開
window.BUILD_VERSION = CACHE_BUSTER;

class Game {
    constructor() {
        this.logger = new Logger();
        this.gameState = new GameState(this.logger);
        this.cardManager = new CardManager(this.logger);
        this.turnManager = new TurnManager(this.gameState, this.cardManager, this.logger);
        this.scoreManager = new ScoreManager(this.logger);
        this.saveManager = new SaveManager(this.logger);
        this.uiController = new UIController(
            this.gameState,
            this.cardManager,
            this.turnManager,
            this.scoreManager,
            this.logger,
            this.saveManager
        );
    }

    async initialize() {
        this.logger.log('カードで学習塾 起動中...', 'info');
        this.logger.log(`ビルドバージョン: ${CACHE_BUSTER}`, 'info');

        // ログUI初期化
        this.logger.init();

        // カードデータロード
        const success = await this.cardManager.loadCards('data/cardsV2.csv');
        if (!success) {
            this.logger.log('カードデータの読み込みに失敗しました', 'error');
            alert('ゲームの初期化に失敗しました。ページを再読み込みしてください。');
            return;
        }

        // UI初期化
        this.uiController.init();

        // セーブデータ復元チェック
        if (this.saveManager.hasSaveData()) {
            const saveData = this.saveManager.load();
            if (saveData) {
                // ビルドバージョンチェック
                if (!this.saveManager.isVersionMatch(saveData)) {
                    this.logger.log('ゲームが更新されたため、セーブデータをリセットします', 'info');
                    alert(`ゲームが更新されました。\n\n保存時: ${saveData.buildVersion}\n現在: ${CACHE_BUSTER}\n\n新しいゲームを開始してください。`);
                    this.saveManager.clear();
                } else {
                    // ゲーム状態を復元
                    this.restoreFromSave(saveData);
                    return;
                }
            }
        }

        // URLからスコアを読み込み（共有リンクの場合）
        const sharedScore = this.scoreManager.loadScoreFromURL();
        if (sharedScore) {
            this.showSharedScore(sharedScore);
        }

        this.logger.log('初期化完了: ゲーム開始ボタンを押してください', 'info');
    }

    /**
     * セーブデータからゲームを復元
     */
    restoreFromSave(saveData) {
        console.log('[SAVE-DEBUG] restoreFromSave: 開始');
        console.log('[SAVE-DEBUG] restoreFromSave: savedPhase=', saveData.gameState?.phase, ', savedTurn=', saveData.gameState?.turn);
        console.log('[SAVE-DEBUG] restoreFromSave: currentTrainingCards=', saveData.gameState?.currentTrainingCards?.map(c => c.cardName));

        this.logger.log('前回のゲームを復元しています...', 'info');

        // 研修デッキを復元
        this.saveManager.restoreTrainingDecks(this.cardManager, saveData.trainingDecks);

        // ゲーム状態を復元
        this.saveManager.restoreGameState(this.gameState, saveData.gameState);

        console.log('[SAVE-DEBUG] restoreFromSave: 復元後 phase=', this.gameState.phase, ', turn=', this.gameState.turn);
        console.log('[SAVE-DEBUG] restoreFromSave: 復元後 currentTrainingCards=', this.gameState.currentTrainingCards?.map(c => c.cardName));

        // UIを復元
        this.uiController.restoreUI();

        this.logger.log(`ゲームを復元しました (ターン${this.gameState.turn}, ${this.gameState.phase})`, 'info');
        console.log('[SAVE-DEBUG] restoreFromSave: 完了');
    }

    showSharedScore(score) {
        const message = `
共有されたスコア:
目標ポイント: ${score.points}
退塾数: ${score.withdrawal}
動員合計: ${score.mobilization}
入退差: ${score.enrollmentDiff}

詳細:
体験: ${score.experience}
入塾: ${score.enrollment}
満足: ${score.satisfaction}
経理: ${score.accounting}
        `.trim();

        alert(message);
        this.logger.log('共有スコアを表示しました', 'info');
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', async () => {
    const game = new Game();

    // デバッグ用: ゲームインスタンスをwindowに公開
    window.game = game;
    console.log('[DEBUG] ゲームインスタンスがwindow.gameに公開されました');

    // デバッグモード: URLパラメータまたはコンソールから設定可能
    window.debugCards = {
        training: [], // 研修会場に出したいカード名のリスト
        hand: []      // 手札に出したいカード名のリスト
    };

    // デバッグ関数: 研修候補に特定のカードを出す
    window.setDebugTrainingCards = function (cardNames) {
        window.debugCards.training = Array.isArray(cardNames) ? cardNames : [cardNames];
        console.log('[DEBUG] 研修候補設定:', window.debugCards.training);
    };

    // デバッグ関数: 手札に特定のカードを出す
    window.setDebugHandCards = function (cardNames) {
        window.debugCards.hand = Array.isArray(cardNames) ? cardNames : [cardNames];
        console.log('[DEBUG] 手札候補設定:', window.debugCards.hand);
    };

    // デバッグ関数: カード名で検索
    window.findCard = function (searchTerm) {
        const matches = game.cardManager.allCards.filter(c =>
            c.cardName.includes(searchTerm) || c.effect.includes(searchTerm)
        );
        console.table(matches.map(c => ({ name: c.cardName, category: c.category, rarity: c.rarity, effect: c.effect })));
        return matches;
    };

    // URLからデバッグ設定を読み込み
    const params = new URLSearchParams(window.location.search);
    if (params.has('debug_training')) {
        window.debugCards.training = params.get('debug_training').split(',');
        console.log('[DEBUG] URL: 研修候補設定:', window.debugCards.training);
    }
    if (params.has('debug_hand')) {
        window.debugCards.hand = params.get('debug_hand').split(',');
        console.log('[DEBUG] URL: 手札候補設定:', window.debugCards.hand);
    }

    await game.initialize();
});
