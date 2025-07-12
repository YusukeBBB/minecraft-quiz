document.addEventListener('DOMContentLoaded', () => {
    // 画面要素の取得
    const titleScreen = document.getElementById('title-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const feedbackScreen = document.getElementById('feedback-screen');
    const resultScreen = document.getElementById('result-screen');

    // ボタン要素の取得
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');

    // クイズ関連要素
    const questionElement = document.getElementById('question');
    const choicesContainer = document.getElementById('choices');
    const scoreElement = document.getElementById('score');

    // フィードバック関連要素
    const feedbackResultElement = document.getElementById('feedback-result');
    const feedbackTextElement = document.getElementById('feedback-text');

    // リザルト関連要素
    const finalScoreElement = document.getElementById('final-score');

    // Web Audio APIの準備
    let audioContext;
    // ユーザーの操作を待ってAudioContextを初期化
    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // サウンド再生関数
    function playSound(type) {
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'correct') {
            oscillator.type = 'sine'; // なめらかな音
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // 高めの音（ラ）
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
        } else { // incorrect
            oscillator.type = 'square'; // ブロックっぽい音
            oscillator.frequency.setValueAtTime(164, audioContext.currentTime); // 低めの音（ミ）
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
        }

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    }

    let allQuestions = [];
    let currentQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;

    // quiz.jsonからクイズデータを読み込む
    fetch('quiz.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
        })
        .catch(error => console.error('クイズデータの読み込みに失敗しました:', error));

    // 配列をシャッフルする関数 (Fisher-Yates shuffle)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 画面を切り替える関数
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    // ゲーム開始
    function startGame() {
        initAudioContext(); // ★ゲーム開始時にオーディオを初期化
        // 10問をランダムに選ぶ
        currentQuestions = shuffle([...allQuestions]).slice(0, 10);
        currentQuestionIndex = 0;
        score = 0;
        scoreElement.textContent = `いまのポイント：${score}`;
        showQuestion();
        showScreen(quizScreen);
    }

    // 問題を表示
    function showQuestion() {
        choicesContainer.innerHTML = ''; // 前の選択肢をクリア
        const questionData = currentQuestions[currentQuestionIndex];
        questionElement.textContent = questionData.question;

        // 選択肢をシャッフルして表示
        const shuffledChoices = shuffle([...questionData.choices]);
        shuffledChoices.forEach(choice => {
            const button = document.createElement('button');
            button.textContent = choice;
            button.addEventListener('click', () => selectAnswer(choice));
            choicesContainer.appendChild(button);
        });
    }

    // 回答を選択
    function selectAnswer(selectedChoice) {
        const questionData = currentQuestions[currentQuestionIndex];
        const isCorrect = selectedChoice === questionData.answer;

        showFeedback(isCorrect);
    }

    // 正解・不正解のフィードバックを表示
    function showFeedback(isCorrect) {
        if (isCorrect) {
            score++;
            scoreElement.textContent = `いまのポイント：${score}`;
            feedbackResultElement.textContent = '〇';
            feedbackResultElement.className = 'correct';
            feedbackTextElement.textContent = 'せいかい！';
            playSound('correct');
        } else {
            feedbackResultElement.textContent = '×';
            feedbackResultElement.className = 'incorrect';
            feedbackTextElement.textContent = 'ざんねん！';
            playSound('incorrect');
        }
        showScreen(feedbackScreen);

        // 1.5秒後に次の問題へ
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < currentQuestions.length) {
                showQuestion();
                showScreen(quizScreen);
            } else {
                showResult();
            }
        }, 1500);
    }

    // リザルト画面を表示
    function showResult() {
        finalScoreElement.textContent = `${currentQuestions.length}もんちゅう ${score}もんせいかい！`;
        showScreen(resultScreen);
    }

    // イベントリスナーの設定
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', () => showScreen(titleScreen));
});
