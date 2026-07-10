/* Lisp Club — BiwaScheme REPL + Snippet Library */

// ---- BiwaScheme interpreter ----
const biwas = new BiwaScheme.Interpreter();

// ---- DOM ----
const replOutput = document.getElementById('repl-output');
const replInput = document.getElementById('repl-input');
const statusBar = document.getElementById('status-bar');

// ---- REPL state ----
let history = [];
let historyIdx = -1;
let evalCount = 0;

// ---- Output helpers ----
function appendOutput(type, text) {
  const line = document.createElement('div');
  line.className = 'output-line';
  if (type === 'input') {
    line.innerHTML = `<span class="prompt">λ&gt;</span><span class="input">${escapeHtml(text)}</span>`;
  } else if (type === 'result') {
    line.innerHTML = `<span class="result">⇒ ${escapeHtml(text)}</span>`;
  } else if (type === 'error') {
    line.innerHTML = `<span class="error">✗ ${escapeHtml(text)}</span>`;
  } else if (type === 'welcome') {
    line.innerHTML = `<span class="welcome">${text}</span>`;
  }
  replOutput.appendChild(line);
  replOutput.scrollTop = replOutput.scrollHeight;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// ---- Evaluate Scheme code ----
function evalScheme(code) {
  const expr = code.trim();
  if (!expr) return;
  appendOutput('input', expr);
  evalCount++;
  try {
    biwas.evaluate(expr, (result) => {
      if (result !== undefined) {
        appendOutput('result', BiwaScheme.to_write(result));
      }
      updateStatus();
    });
  } catch (err) {
    appendOutput('error', err.message || String(err));
    updateStatus();
  }
}

function updateStatus() {
  document.getElementById('eval-count').textContent = evalCount + ' evals';
}

// ---- Input handling ----
replInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const code = replInput.value;
    if (code.trim()) {
      history.push(code);
      historyIdx = history.length;
      evalScheme(code);
    }
    replInput.value = '';
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyIdx > 0) {
      historyIdx--;
      replInput.value = history[historyIdx];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIdx < history.length - 1) {
      historyIdx++;
      replInput.value = history[historyIdx];
    } else {
      historyIdx = history.length;
      replInput.value = '';
    }
  }
});

// Keep input focused
document.addEventListener('click', () => replInput.focus());

// ---- Snippets ----
const SNIPPETS = [
  { cat: '基础运算', code: '(+ 1 2 3 4 5)', title: '加法', preview: '1+2+3+4+5' },
  { cat: '基础运算', code: '(* 6 7)', title: '乘法', preview: '6×7' },
  { cat: '基础运算', code: '(/ 100 3)', title: '除法', preview: '100÷3' },
  { cat: '基础运算', code: '(expt 2 10)', title: '幂运算', preview: '2^10=1024' },
  { cat: '基础运算', code: '(sqrt 144)', title: '平方根', preview: '√144' },
  { cat: '基础运算', code: '(gcd 48 180)', title: '最大公约数', preview: 'gcd(48,180)' },

  { cat: '列表操作', code: '(car (list 1 2 3 4 5))', title: 'car — 取首元素', preview: '→ 1' },
  { cat: '列表操作', code: '(cdr (list 1 2 3 4 5))', title: 'cdr — 取剩余列表', preview: '→ (2 3 4 5)' },
  { cat: '列表操作', code: '(cons 1 (list 2 3 4))', title: 'cons — 构造列表', preview: '→ (1 2 3 4)' },
  { cat: '列表操作', code: '(length (list 1 2 3 4 5))', title: 'length — 列表长度', preview: '→ 5' },
  { cat: '列表操作', code: '(reverse (list 1 2 3 4 5))', title: 'reverse — 反转', preview: '→ (5 4 3 2 1)' },
  { cat: '列表操作', code: '(append (list 1 2) (list 3 4))', title: 'append — 拼接', preview: '→ (1 2 3 4)' },
  { cat: '列表操作', code: '(map (lambda (x) (* x x)) (list 1 2 3 4 5))', title: 'map — 映射平方', preview: '→ (1 4 9 16 25)' },
  { cat: '列表操作', code: '(filter (lambda (x) (> x 3)) (list 1 2 3 4 5 6))', title: 'filter — 筛选', preview: '→ (4 5 6)' },

  { cat: '递归', code: '(define (fact n)\n  (if (<= n 1) 1 (* n (fact (- n 1)))))\n(fact 10)', title: '阶乘 (递归)', preview: '10! = 3628800' },
  { cat: '递归', code: '(define (fib n)\n  (if (<= n 1) n (+ (fib (- n 1)) (fib (- n 2)))))\n(fib 20)', title: '斐波那契 (递归)', preview: 'fib(20)' },

  { cat: 'Lambda', code: '((lambda (x y) (+ (* x x) (* y y))) 3 4)', title: '匿名函数', preview: 'x²+y², x=3,y=4' },
  { cat: 'Lambda', code: '(define square (lambda (x) (* x x)))\n(square 12)', title: '命名 Lambda', preview: 'square(12)=144' },
  { cat: 'Lambda', code: '(define (compose f g)\n  (lambda (x) (f (g x))))\n((compose (lambda (x) (* x x)) (lambda (x) (+ x 1))) 5)', title: '函数组合', preview: '(x+1)², x=5' },

  { cat: '条件', code: '(define (sign n)\n  (cond ((> n 0) "positive")\n        ((< n 0) "negative")\n        (else "zero")))\n(sign -7)', title: 'cond — 多分支', preview: '判断正负零' },
  { cat: '条件', code: '(if (> 5 3) "yes" "no")', title: 'if — 二分支', preview: '5>3 → yes' },

  { cat: '经典算法', code: '(define (fizzbuzz n)\n  (cond ((= (modulo n 15) 0) "FizzBuzz")\n        ((= (modulo n 3) 0) "Fizz")\n        ((= (modulo n 5) 0) "Buzz")\n        (else n)))\n(map fizzbuzz (iota 30 1))', title: 'FizzBuzz', preview: '1到30的FizzBuzz' },
  { cat: '经典算法', code: '(define (prime? n)\n  (define (try d)\n    (cond ((> (* d d) n) #t)\n          ((= (modulo n d) 0) #f)\n          (else (try (+ d 1)))))\n  (try 2))\n(filter prime? (iota 50 2))', title: '素数筛', preview: '2-50的素数' },
  { cat: '经典算法', code: '(define (qsort lst)\n  (if (null? lst) ()\n    (let ((pivot (car lst))\n          (rest (cdr lst)))\n      (append (qsort (filter (lambda (x) (< x pivot)) rest))\n              (list pivot)\n              (qsort (filter (lambda (x) (>= x pivot)) rest))))))\n(qsort (list 3 1 4 1 5 9 2 6))', title: '快速排序', preview: 'Quicksort' },
];

// ---- Render snippets ----
function renderSnippets() {
  const list = document.getElementById('snippet-list');
  let currentCat = '';
  SNIPPETS.forEach((snip, i) => {
    if (snip.cat !== currentCat) {
      currentCat = snip.cat;
      const catEl = document.createElement('div');
      catEl.className = 'snippet-cat';
      catEl.textContent = currentCat;
      list.appendChild(catEl);
    }
    const item = document.createElement('div');
    item.className = 'snippet-item';
    item.innerHTML = `
      <div>
        <div class="snip-title">${snip.title}</div>
        <div class="snip-preview">${snip.preview}</div>
      </div>
      <span class="run-icon">▶</span>
    `;
    // Click: insert into REPL
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('run-icon')) {
        // Direct execute
        evalScheme(snip.code);
      } else {
        // Insert into input
        replInput.value = snip.code;
        replInput.focus();
      }
    });
    list.appendChild(item);
  });
}

// ---- Init ----
function init() {
  appendOutput('welcome', `
╔══════════════════════════════════════╗
║   λ Lisp Club — BiwaScheme REPL    ║
║   欢迎来到 Scheme 交互式编程环境      ║
║                                      ║
║   输入 Scheme 表达式，回车执行        ║
║   ↑↓ 浏览历史                        ║
║   右侧代码片段点击即可载入            ║
║   ▶ 按钮直接执行片段                 ║
║                                      ║
║   试试看: (+ 1 2)                    ║
╚══════════════════════════════════════╝`);
  renderSnippets();
  updateStatus();
  replInput.focus();
}

// Init when BiwaScheme is loaded
if (typeof BiwaScheme !== 'undefined') {
  init();
} else {
  // Wait for script to load
  document.getElementById('repl-input').placeholder = '加载 BiwaScheme...';
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof BiwaScheme !== 'undefined') {
        init();
      } else {
        appendOutput('error', 'BiwaScheme 加载失败，请刷新页面');
      }
    }, 500);
  });
}
