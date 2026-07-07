/* Fallacy Detective — Game Logic */

// ---- Case data ----
const cases = [
  {
    id: 'gambler',
    icon: '🎰',
    title: '案件一：赌徒的执念',
    titleEn: 'Case 1: The Gambler\'s Conviction',
    fallacy: '赌徒谬误',
    fallacyEn: 'Gambler\'s Fallacy',
    tag: 'The Gambler\'s Fallacy',
    scene: '深夜的赌场，空气弥漫着雪茄和焦虑。你观察一位赌客——他已经连续抛出了 <em>6 次正面</em>。他深吸一口气，笃定地说："下一次<em>必定是反面</em>。正面已经太多了，反面该\'补偿\'了。"',
    sceneEn: 'Late night at the casino. A gambler has just flipped <em>6 heads in a row</em>. He takes a deep breath and says with certainty: "The next one <em>must be tails</em>. There have been too many heads — tails is \'due.\'"',
    type: 'interactive',
    question: '硬币没有记忆。每一次抛掷都是独立事件，正面概率始终是 50%。赌徒的"补偿"直觉是一种认知偏误。\n\n下面你来试试 —— 看你自己会不会也掉进这个陷阱：',
    questionEn: 'The coin has no memory. Each flip is independent — the probability of heads is always 50%. The gambler\'s "compensation" intuition is a cognitive bias.\n\nNow try it yourself — see if you fall into the same trap:',
    explanation: '硬币没有记忆。每次抛掷是独立事件，正面概率恒为 50%。连续 6 次正面后，第 7 次正面的概率……还是 50%。过去的结果不影响未来——这是概率论最基础的原理。赌徒谬误之所以强大，是因为我们的大脑进化出"模式识别"的本能，在随机序列中看到根本不存在的规律。',
  },
  {
    id: 'dilemma',
    icon: '🚪',
    title: '案件二：两扇门',
    titleEn: 'Case 2: The Two Doors',
    fallacy: '假两难',
    fallacyEn: 'False Dilemma',
    tag: 'False Dilemma',
    scene: '一位政客在演讲中宣称："公民们，你们只有两个选择——<em>要么无条件支持我们的安全政策，要么就是站在敌人那边</em>，危害国家安全。现在做出你的选择吧。"台下的人群陷入沉默，似乎真的只有两条路可走。',
    sceneEn: 'A politician declares: "Citizens, you have only two choices — <em>either unconditionally support our security policy, or you stand with the enemy</em> and endanger national security. Make your choice now." The crowd falls silent, as if there truly are only two paths.',
    type: 'choice',
    question: '这段话犯了什么谬误？',
    questionEn: 'What fallacy does this argument commit?',
    options: [
      { text: 'A. 只有两个选项是合理的，安全问题上不能妥协', correct: false },
      { text: 'B. 刻意将复杂问题简化为非此即彼的二选一，忽略了中间的无数可能（如：支持安全目标但反对具体手段）', correct: true },
      { text: 'C. 政客的观点是正确的，因为他代表了多数民意', correct: false },
      { text: 'D. 这是一个有效的逻辑推理，因为前提蕴含结论', correct: false },
    ],
    explanation: '假两难谬误的核心：将复杂的谱系问题强行压缩为两极对立。现实中存在无数中间立场——支持安全目标但质疑具体手段、要求更透明的监督机制、提议替代方案等等。非黑即白的框架本身就是一种操纵。',
  },
  {
    id: 'strawman',
    icon: '🎭',
    title: '案件三：扭曲的镜子',
    titleEn: 'Case 3: The Distorted Mirror',
    fallacy: '稻草人论证',
    fallacyEn: 'Strawman Argument',
    tag: 'Strawman',
    scene: '甲说："我觉得我们应该适当减少军事开支，把更多预算投入教育和医疗。"\n乙回应："<em>所以你想彻底解散军队，让国家毫无防御能力，任人宰割？</em>你这种天真的想法会毁了这个国家！"',
    sceneEn: 'A: "I think we should moderately reduce military spending and allocate more to education and healthcare."\nB: "<em>So you want to completely disband the military, leave the country defenseless?</em> Your naive thinking would destroy this nation!"',
    type: 'choice',
    question: '乙的回应犯了什么谬误？',
    questionEn: 'What fallacy does B\'s response commit?',
    options: [
      { text: 'A. 诉诸人身——乙攻击了甲的人格', correct: false },
      { text: 'B. 稻草人论证——乙把甲的"适当减少"扭曲为"彻底解散"，攻击一个甲根本没说过的极端版本', correct: true },
      { text: 'C. 滑坡谬误——乙正确地推理了削减军费的后果', correct: false },
      { text: 'D. 诉诸权威——乙暗示自己拥有军事专业知识', correct: false },
    ],
    explanation: '稻草人论证：歪曲对方的观点，将其替换为一个更容易攻击的"稻草人"版本。甲说的是"适当减少"，乙将其替换为"彻底解散"——一个完全不同且极端得多的主张。攻击稻草人很容易，但它跟甲的实际论证毫无关系。',
  },
  {
    id: 'adhominem',
    icon: '🎯',
    title: '案件四：面具背后',
    titleEn: 'Case 4: Behind the Mask',
    fallacy: '诉诸人身',
    fallacyEn: 'Ad Hominem',
    tag: 'Ad Hominem',
    scene: '一位经济学家发布了一篇关于税收改革的详尽研究报告。评论区的热门回复写道："<em>这个专家自己去年还因为税务问题被调查过，</em>他有什么资格谈税改？他的话一句都不能信。"',
    sceneEn: 'An economist publishes a detailed research report on tax reform. The top comment reads: "<em>This expert was investigated for tax issues last year.</em> Why should we listen to anything he says about tax reform?"',
    type: 'choice',
    question: '这条热门评论犯了什么谬误？',
    questionEn: 'What fallacy does this comment commit?',
    options: [
      { text: 'A. 合理地质疑了专家的可信度——个人税务问题确实与税改主张相关', correct: false },
      { text: 'B. 诉诸人身——评论者攻击经济学家的人格/背景，而非其研究报告中的数据、逻辑和论证本身', correct: true },
      { text: 'C. 窃取论点——评论者预设了经济学家的论证是错的', correct: false },
      { text: 'D. 诉诸群众——热门评论本身就说明它是正确的', correct: false },
    ],
    explanation: '诉诸人身谬误：攻击论证者本人（人格、动机、背景），而非论证本身的内容。即使这位经济学家有税务问题，他的研究报告中的数据、逻辑和分析仍然需要被独立评估。一个人的品格和其论证的有效性是两回事。',
  },
];

// ---- State ----
let gameState = {
  completed: {},    // { caseId: true/false }
  score: 0,
  totalAttempts: 0,
  correctAttempts: 0,
  currentCase: null,
};

// ---- Coin game state (for gambler case) ----
let coinState = {
  history: [],
  flips: 0,
  totalFlips: 12,
  betOnHeads: 0,
  betOnTails: 0,
  correctBets: 0,
  answered: false,
  stage: 'betting', // 'betting' | 'done'
};

// ---- DOM ----
const app = document.getElementById('app');

// ---- Load state ----
try {
  const saved = localStorage.getItem('fallacy-detective');
  if (saved) gameState = { ...gameState, ...JSON.parse(saved) };
} catch(e) {}

function save() {
  try { localStorage.setItem('fallacy-detective', JSON.stringify(gameState)); } catch(e) {}
}

// ---- Render ----
function renderCaseList() {
  gameState.currentCase = null;
  const completed = Object.values(gameState.completed).filter(Boolean).length;
  const accuracy = gameState.totalAttempts > 0
    ? Math.round((gameState.correctAttempts / gameState.totalAttempts) * 100)
    : 0;

  app.innerHTML = `
    <header>
      <h1>🔍 谬误侦探</h1>
      <div class="sub">Fallacy Detective</div>
    </header>
    <div id="score-bar">
      <div class="score-item">
        <div class="score-val">${completed}/${cases.length}</div>
        <div class="score-label">已破案件</div>
      </div>
      <div class="score-item">
        <div class="score-val">${accuracy}%</div>
        <div class="score-label">准确率</div>
      </div>
      <div class="score-item">
        <div class="score-val">${gameState.score}</div>
        <div class="score-label">侦探积分</div>
      </div>
    </div>
    <div id="case-list">
      ${cases.map((c, i) => {
        const done = gameState.completed[c.id];
        const locked = i > 0 && !gameState.completed[cases[i-1].id];
        return `
          <div class="case-card ${locked ? 'locked' : ''} ${done ? 'completed' : ''}"
               data-id="${c.id}" ${locked ? '' : 'onclick="openCase(\'' + c.id + '\')"'}
          >
            <div class="case-icon">${locked ? '🔒' : done ? '✅' : c.icon}</div>
            <div class="case-info">
              <div class="case-title">${c.title}</div>
              <div class="case-desc">${c.fallacy} · ${c.tag}</div>
            </div>
            <div class="case-status">${done ? '已破案' : locked ? '待解锁' : '调查中'}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openCase(id) {
  const c = cases.find(x => x.id === id);
  if (!c) return;
  gameState.currentCase = id;

  if (c.type === 'interactive') {
    renderGamblerCase(c);
  } else {
    renderChoiceCase(c);
  }
}

// ---- Coin flip helper ----
function flipCoin() {
  return Math.random() < 0.5 ? 'H' : 'T';
}

// ---- Gambler case ----
function renderGamblerCase(c) {
  coinState = {
    history: [],
    flips: 0,
    totalFlips: 12,
    betOnHeads: 0,
    betOnTails: 0,
    correctBets: 0,
    answered: false,
    stage: 'betting',
  };

  // Generate first 6 flips with a streak
  coinState.history = ['H','H','H','H','H','H'];
  coinState.flips = 6;

  app.innerHTML = `
    <div id="case-detail" class="active">
      <button class="back-btn" onclick="renderCaseList()">← 返回案件列表</button>
      <div class="case-header">
        <h2>${c.title}</h2>
        <span class="fallacy-tag">${c.fallacy} · ${c.tag}</span>
      </div>
      <div class="scene-box">${c.scene}</div>

      <div class="scene-box">
        <p style="margin-bottom:12px;color:#c0b8a8;">${c.question}</p>
        <div class="coin-area">
          <div id="coin-result">🪙</div>
          <div class="coin-history" id="coin-history"></div>
          <div class="coin-stats" id="coin-stats"></div>
          <div class="bet-btns" id="bet-btns">
            <button class="bet-btn" onclick="placeBet('H')">正面 Heads</button>
            <button class="bet-btn" onclick="placeBet('T')">反面 Tails</button>
          </div>
        </div>
        <p id="coin-feedback" style="text-align:center;margin-top:12px;font-size:13px;min-height:20px;"></p>
      </div>

      <div class="feedback" id="final-feedback"></div>
    </div>
  `;
  updateCoinDisplay();
}

function updateCoinDisplay() {
  const historyEl = document.getElementById('coin-history');
  const statsEl = document.getElementById('coin-stats');
  const resultEl = document.getElementById('coin-result');
  if (!historyEl) return;

  historyEl.innerHTML = coinState.history.map(h =>
    `<div class="coin-dot ${h === 'H' ? 'heads' : 'tails'}">${h === 'H' ? '正' : '反'}</div>`
  ).join('');

  const hCount = coinState.history.filter(x => x === 'H').length;
  const tCount = coinState.history.filter(x => x === 'T').length;
  statsEl.textContent = `正面 ${hCount} 次 · 反面 ${tCount} 次 · 剩余 ${coinState.totalFlips - coinState.flips} 次`;

  // Show last result
  const last = coinState.history[coinState.history.length - 1];
  if (last === 'H') resultEl.textContent = '🪙 → 🔆';
  else if (last === 'T') resultEl.textContent = '🪙 → 🌑';
}

function placeBet(bet) {
  if (coinState.answered || coinState.flips >= coinState.totalFlips) return;

  const outcome = flipCoin();
  coinState.history.push(outcome);
  coinState.flips++;

  if (bet === 'H') coinState.betOnHeads++;
  else coinState.betOnTails++;

  const correct = bet === outcome;
  if (correct) coinState.correctBets++;

  const fb = document.getElementById('coin-feedback');
  const emoji = correct ? ' ✓' : ' ✗';
  const emojiColor = correct ? 'color:#8c8' : 'color:#c66';
  fb.innerHTML = `你押了<span style="color:#d4b060">${bet==='H'?'正面':'反面'}</span>，结果是<span style="${emojiColor}">${outcome==='H'?'正面':'反面'}${emoji}</span>`;

  updateCoinDisplay();

  // Disable buttons briefly for animation
  const btns = document.querySelectorAll('.bet-btn');
  btns.forEach(b => b.disabled = true);
  setTimeout(() => {
    if (coinState.flips < coinState.totalFlips) {
      btns.forEach(b => b.disabled = false);
    }
  }, 600);

  if (coinState.flips >= coinState.totalFlips) {
    setTimeout(endGamblerRound, 800);
  }
}

function endGamblerRound() {
  coinState.answered = true;
  const total = coinState.betOnHeads + coinState.betOnTails || 1;
  const accuracy = Math.round((coinState.correctBets / total) * 100);

  // Bias detection
  const hCount = coinState.history.filter(x => x === 'H').length;
  let biasMsg = '';
  if (coinState.betOnTails > coinState.betOnHeads + 2) {
    biasMsg = '你倾向押反面——你可能陷入了赌徒谬误：认为"正面太多了，反面该出现了"。';
  } else if (coinState.betOnHeads > coinState.betOnTails + 2) {
    biasMsg = '你倾向押正面——你相信"热手效应"（趋势会延续）。这都是认知偏误。';
  } else {
    biasMsg = '你的投注比较均衡——你保持了理性，没有明显被赌徒谬误影响。';
  }

  const isCorrect = accuracy >= 45; // close to 50% means rational

  const c = cases.find(x => x.id === 'gambler');
  const fbEl = document.getElementById('final-feedback');
  fbEl.className = `feedback show ${isCorrect ? 'correct' : 'wrong'}`;
  fbEl.innerHTML = `
    <strong>${accuracy >= 45 ? '✓ 案件洞察' : '⚠ 你也中招了'}</strong><br>
    你的预测准确率：${accuracy}%（理想值是50%）<br>
    ${biasMsg}<br><br>
    <em style="color:#aaa;font-size:12px;">${c.explanation}</em>
  `;

  // Mark completed
  if (accuracy >= 45) {
    gameState.completed[c.id] = true;
    gameState.score += 50;
    gameState.correctAttempts++;
  } else {
    gameState.completed[c.id] = true;
    gameState.score += 20;
  }
  gameState.totalAttempts++;

  // Show next button
  const btnArea = document.getElementById('bet-btns');
  if (btnArea) {
    btnArea.innerHTML = `
      <button class="next-btn show" onclick="renderCaseList()">返回案件列表 →</button>
    `;
  }
  save();
}

// ---- Choice case (dilemma, strawman, ad hominem) ----
function renderChoiceCase(c) {
  app.innerHTML = `
    <div id="case-detail" class="active">
      <button class="back-btn" onclick="renderCaseList()">← 返回案件列表</button>
      <div class="case-header">
        <h2>${c.title}</h2>
        <span class="fallacy-tag">${c.fallacy} · ${c.tag}</span>
      </div>
      <div class="scene-box">${c.scene}</div>
      <p style="margin-bottom:14px;color:#c0b8a8;font-size:14px;">${c.question}</p>
      <div class="options" id="options">
        ${c.options.map((o, i) => `
          <button class="option-btn" data-idx="${i}" onclick="answerChoice(${i})">${o.text}</button>
        `).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
      <button class="next-btn" id="next-btn" onclick="renderCaseList()" style="display:none;margin:0 auto;">返回案件列表 →</button>
    </div>
  `;
}

function answerChoice(idx) {
  const c = cases.find(x => x.id === gameState.currentCase);
  if (!c) return;

  const opt = c.options[idx];
  const fb = document.getElementById('feedback');
  const allBtns = document.querySelectorAll('.option-btn');
  allBtns.forEach(b => b.disabled = true);

  if (opt.correct) {
    allBtns[idx].classList.add('correct');
    fb.className = 'feedback show correct';
    fb.innerHTML = `<strong>✓ 正确！</strong> ${c.tag}<br><br><em style="color:#aaa;font-size:12px;">${c.explanation}</em>`;
    gameState.completed[c.id] = true;
    gameState.score += 50;
    gameState.correctAttempts++;
  } else {
    allBtns[idx].classList.add('wrong');
    // Highlight correct
    const correctIdx = c.options.findIndex(o => o.correct);
    allBtns[correctIdx].classList.add('correct');
    fb.className = 'feedback show wrong';
    fb.innerHTML = `<strong>✗ 再想想</strong> 正确答案已标出。<br><br><em style="color:#aaa;font-size:12px;">${c.explanation}</em>`;
    gameState.completed[c.id] = true;
    gameState.score += 20;
  }
  gameState.totalAttempts++;

  document.getElementById('next-btn').classList.add('show');
  save();
}

// ---- Boot ----
renderCaseList();
