const SERVICE_ID = 'service_lq91rap';
const TEMPLATE_ID = 'template_n4ns66m';
const PUBLIC_KEY = '52VtQNv4lmH3Jg7fP';

(function () {
    emailjs.init({ publicKey: PUBLIC_KEY });
})();

let storageAllowed = localStorage.getItem('storageAllowed') === null ? true : localStorage.getItem('storageAllowed') === 'true';
let solvableHistory = storageAllowed ? (JSON.parse(localStorage.getItem('solvableHistory')) || []) : [];
let unsolvableHistory = storageAllowed ? (JSON.parse(localStorage.getItem('unsolvableHistory')) || []) : [];
let currentHistoryIndex = solvableHistory.length > 0 ? solvableHistory.length - 1 : -1;
let showingUnsolvable = false;
let checkedCombinations = new Set();
const TOTAL_POSSIBLE = 1820;

window.onload = () => {
    document.getElementById('storage-toggle').checked = storageAllowed;
    if (solvableHistory.length > 0) {
        const savedIndex = localStorage.getItem('lastViewedIndex');
        if (savedIndex !== null && !isNaN(savedIndex) && savedIndex >= 0 && savedIndex < solvableHistory.length) {
            currentHistoryIndex = parseInt(savedIndex);
        } else {
            currentHistoryIndex = solvableHistory.length - 1;
        }
        navigateHistory(0);
    }
    updateNavButtons();

    // Restore active tab as early as possible after elements are present
    restoreActiveTab();
};

function restoreActiveTab() {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab && storageAllowed) {
        showPage(savedTab);
    } else {
        showPage('game');
    }
}


function updateAddButtonState() {
    const nums = getInputs();
    const btn = document.getElementById('btn-manual-add');
    if (nums.some(isNaN)) {
        btn.style.display = "none";
        return;
    }
    const key = [...nums].sort((a, b) => a - b).join(',');
    const isSolvable = solve24(nums) !== null;
    const list = isSolvable ? solvableHistory : unsolvableHistory;
    if (list.includes(key)) {
        btn.style.display = "none";
    } else {
        btn.style.display = "inline-block";
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerText = t("btn_add_hist");
    }
}

function getInputs() {
    return [1, 2, 3, 4].map(i => parseFloat(document.getElementById('n' + i).value));
}

function setInputs(nums) {
    nums.forEach((val, i) => document.getElementById('n' + (i + 1)).value = val);
}

function manualRegister() {
    const nums = getInputs();
    registerPuzzle(nums);
    updateFeedback(t("msg_saved"), "#27ae60");
    updateAddButtonState();
}

function registerPuzzle(nums) {
    if (nums.some(isNaN)) return;
    const key = [...nums].sort((a, b) => a - b).join(',');
    const isSolvable = solve24(nums) !== null;
    const targetList = isSolvable ? solvableHistory : unsolvableHistory;
    if (!targetList.includes(key)) {
        targetList.push(key);
        if (storageAllowed) {
            localStorage.setItem('solvableHistory', JSON.stringify(solvableHistory));
            localStorage.setItem('unsolvableHistory', JSON.stringify(unsolvableHistory));
        }
        if (isSolvable && !showingUnsolvable) currentHistoryIndex = solvableHistory.length - 1;
    }
    updateNavButtons();
}

function solve24(numbers) {
    const target = 24;

    function backtrack(list) {
        if (list.length === 1) return Math.abs(list[0].val - target) < 0.001 ? list[0].expr : null;
        for (let i = 0; i < list.length; i++) {
            for (let j = 0; j < list.length; j++) {
                if (i === j) continue;
                const a = list[i], b = list[j], rem = list.filter((_, idx) => idx !== i && idx !== j);
                const ops = [
                    { val: a.val + b.val, expr: `(${a.expr}+${b.expr})` },
                    { val: a.val - b.val, expr: `(${a.expr}-${b.expr})` },
                    { val: a.val * b.val, expr: `(${a.expr}*${b.expr})` },
                    { val: Math.abs(b.val) > 0.001 ? a.val / b.val : null, expr: `(${a.expr}/${b.expr})` }
                ];
                for (let op of ops) if (op.val !== null) {
                    const res = backtrack([...rem, op]);
                    if (res) return res;
                }
            }
        }
        return null;
    }

    return backtrack(numbers.map(n => ({ val: n, expr: n.toString() })));
}

function checkUserSolution() {
    const expr = document.getElementById('userExpr').value;
    const nums = getInputs();
    if (nums.some(isNaN) || !expr.trim()) return;
    try {
        if (/[^0-9+\-*/().\s]/.test(expr)) {
            updateFeedback(t("msg_invalid_char"), "#e74c3c");
            return;
        }
        let tempExpr = expr;
        let allNumsUsed = true;
        const sortedInputs = [...nums].sort((a, b) => b - a);
        for (let n of sortedInputs) {
            if (tempExpr.includes(n.toString())) {
                tempExpr = tempExpr.replace(n.toString(), "");
            } else {
                allNumsUsed = false;
                break;
            }
        }
        const result = eval(expr);
        if (!allNumsUsed) {
            updateFeedback(t("msg_use_all"), "#e74c3c");
        } else if (Math.abs(result - 24) < 0.001) {
            updateFeedback(t("msg_correct"), "var(--success)");
        } else {
            updateFeedback(t("msg_incorrect", { result }), "#e74c3c");
        }
    } catch (e) {
        updateFeedback(t("msg_invalid_expr"), "#e74c3c");
    }
}

function generateSolvable(updateUI = true) {
    if (checkedCombinations.size >= TOTAL_POSSIBLE) {
        if (updateUI) updateFeedback(t("msg_all_checked"), "#e74c3c");
        return;
    }
    let randomNums, key, isSolvable = false;
    let attempts = 0;
    do {
        isSolvable = false;
        randomNums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
        key = [...randomNums].sort((a, b) => a - b).join(',');
        if (!checkedCombinations.has(key)) {
            const solution = solve24(randomNums);
            checkedCombinations.add(key);
            if (solution) isSolvable = true;
            else if (!unsolvableHistory.includes(key)) unsolvableHistory.push(key);
        } else {
            isSolvable = solvableHistory.includes(key);
        }
        attempts++;
    } while ((!isSolvable || solvableHistory.includes(key)) && attempts < 5000);

    if (isSolvable && !solvableHistory.includes(key)) {
        if (updateUI) {
            setInputs(randomNums);
            registerPuzzle(randomNums);
            clearSolutionArea();
            updateAddButtonState();
        } else {
            solvableHistory.push(key);
            if (storageAllowed) {
                localStorage.setItem('solvableHistory', JSON.stringify(solvableHistory));
            }
        }
    } else {
        if (updateUI) {
            updateFeedback(t("msg_not_found"), "#e74c3c");
        }
    }
}

function generateAll() {
    const initialCount = solvableHistory.length;
    for (let i = 0; i < TOTAL_POSSIBLE; i++) {
        generateSolvable(false); // Pass false to not update UI
    }
    const generatedCount = solvableHistory.length - initialCount;
    updateFeedback(t("msg_gen_success", { count: generatedCount }), "var(--success)");
    updateNavButtons();
}

function navigateHistory(direction) {
    const list = showingUnsolvable ? unsolvableHistory : solvableHistory;
    if (list.length === 0) return;
    currentHistoryIndex = Math.max(0, Math.min(list.length - 1, currentHistoryIndex + direction));
    setInputs(list[currentHistoryIndex].split(',').map(Number));
    if (storageAllowed && !showingUnsolvable) {
        localStorage.setItem('lastViewedIndex', currentHistoryIndex);
    }
    clearSolutionArea();
    updateNavButtons();
    updateAddButtonState();
}

function updateNavButtons() {
    const list = showingUnsolvable ? unsolvableHistory : solvableHistory;
    document.getElementById('btn-back').disabled = (currentHistoryIndex <= 0);
    document.getElementById('btn-next').disabled = (currentHistoryIndex >= list.length - 1 || list.length === 0);

    // Update Puzzle Counter String dynamically
    const currentNum = list.length === 0 ? 0 : currentHistoryIndex + 1;
    document.getElementById('puzzle-counter').innerText = t("puzzle_counter", { current: currentNum, total: list.length });

    const gotoSection = document.getElementById('goto-section');
    if (list.length >= 5) {
        gotoSection.style.display = 'flex';
        document.getElementById('goto-input').max = list.length;
    } else {
        gotoSection.style.display = 'none';
    }
    validateGoToInput();
}

function validateGoToInput() {
    const list = showingUnsolvable ? unsolvableHistory : solvableHistory;
    const inputVal = parseInt(document.getElementById('goto-input').value);
    const btn = document.getElementById('btn-goto');
    if (!isNaN(inputVal) && inputVal >= 1 && inputVal <= list.length) {
        btn.classList.add('btn-goto-highlight');
        btn.disabled = false;
    } else {
        btn.classList.remove('btn-goto-highlight');
        btn.disabled = true;
    }
}

function goToPuzzle() {
    const list = showingUnsolvable ? unsolvableHistory : solvableHistory;
    const inputVal = parseInt(document.getElementById('goto-input').value);
    if (isNaN(inputVal) || inputVal < 1 || inputVal > list.length) {
        updateFeedback(t("msg_enter_between", { max: list.length }), "#e74c3c");
        return;
    }
    currentHistoryIndex = inputVal - 1;
    if (storageAllowed && !showingUnsolvable) {
        localStorage.setItem('lastViewedIndex', currentHistoryIndex);
    }
    setInputs(list[currentHistoryIndex].split(',').map(Number));
    clearSolutionArea();
    updateNavButtons();
    updateAddButtonState();
    document.getElementById('goto-input').value = '';
    validateGoToInput();
}

function showPage(p) {
    document.querySelectorAll('.page').forEach(pg => pg.classList.remove('active'));
    document.getElementById(p + '-page').classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if (document.getElementById('link-' + p)) document.getElementById('link-' + p).classList.add('active');
    if (storageAllowed) localStorage.setItem('activeTab', p);
    if (p === 'capture') initFractionCapture();
}

function updateFeedback(m, c) {
    const f = document.getElementById('feedback');
    f.innerText = m;
    f.style.color = c;
}

function clearSolutionArea() {
    document.getElementById('userExpr').value = "";
    document.getElementById('feedback').innerText = "";
    document.getElementById('result').innerText = "";
}

function runSolver() {
    const nums = getInputs();
    if (nums.some(isNaN)) return;
    const sol = solve24(nums);
    document.getElementById('result').innerText = sol ? t("msg_solution_found", { sol }) : t("msg_no_solution");
    registerPuzzle(nums);
    updateAddButtonState();
}

document.getElementById('contact-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const btn = this.querySelector('button');
    const status = document.getElementById('status');
    btn.innerText = t("msg_sending");
    btn.disabled = true;
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, this)
        .then(() => {
            status.innerText = t("msg_sent_success");
            status.style.color = 'var(--success)';
            this.reset();
        },
            (error) => {
                status.innerText = t("msg_sent_fail");
                status.style.color = 'var(--error)';
            })
        .finally(() => {
            // Need to set button text back to original localized string, not hardcoded english
            btn.innerText = t("btn_send");
            btn.disabled = false;
        });
});

function clearAllHistory() {
    if (confirm(t("msg_del_confirm"))) {
        solvableHistory = [];
        unsolvableHistory = [];
        checkedCombinations.clear();
        currentHistoryIndex = -1;
        if (storageAllowed) {
            localStorage.removeItem('solvableHistory');
            localStorage.removeItem('unsolvableHistory');
            localStorage.removeItem('lastViewedIndex');
        }
        setInputs(["", "", "", ""]);
        clearSolutionArea();
        updateNavButtons();
        updateAddButtonState();
        updateFeedback(t("msg_hist_cleared"), "#e74c3c");
    }
}

function toggleStoragePreference() {
    storageAllowed = document.getElementById('storage-toggle').checked;
    localStorage.setItem('storageAllowed', storageAllowed);
    if (!storageAllowed) {
        localStorage.removeItem('solvableHistory');
        localStorage.removeItem('unsolvableHistory');
        localStorage.removeItem('lastViewedIndex');
    }
}
/* ================= FRACTION CAPTURE GAME LOGIC ================= */

let captureTarget = { n: 0, d: 1 };
let captureIngredients = [];
let selectedIngIndices = [];
let selectedCaptureOp = null;
let captureGameOver = false;

// Simple Fraction helper
function gcd(a, b) { return b ? gcd(b, a % b) : a; }
function simplify(n, d) {
    const common = gcd(Math.abs(n), Math.abs(d));
    return { n: n / common, d: d / common };
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function initFractionCapture() {
    captureGameOver = false;
    selectedIngIndices = [];
    selectedCaptureOp = null;
    document.getElementById('pot-display').classList.remove('sealed');
    document.getElementById('capture-feedback').innerText = "";
    document.querySelectorAll('.op-btn').forEach(b => b.classList.remove('selected'));

    const denoms = [2, 3, 4, 5, 6, 8, 10];
    let ingredients = [];
    for (let i = 0; i < 4; i++) {
        let d = denoms[Math.floor(Math.random() * denoms.length)];
        let n = Math.floor(Math.random() * (d - 1)) + 1;
        ingredients.push(simplify(n, d));
    }

    const idx1 = 0, idx2 = 1;
    const ops = ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let res = calculateFrac(ingredients[idx1], ingredients[idx2], op);

    if (res.n <= 0 || res.d > 20 || res.n > 50) return initFractionCapture();
    captureTarget = simplify(res.n, res.d);
    captureIngredients = shuffle(ingredients);

    console.log("Target Generated:", captureTarget);
    renderTarget();
    renderIngredients();
}

function calculateFrac(f1, f2, op) {
    let n, d;
    if (op === '+') { n = f1.n * f2.d + f2.n * f1.d; d = f1.d * f2.d; }
    else if (op === '-') { n = f1.n * f2.d - f2.n * f1.d; d = f1.d * f2.d; }
    else if (op === '*') { n = f1.n * f2.n; d = f1.d * f2.d; }
    else if (op === '/') { n = f1.n * f2.d; d = f1.d * f2.n; }
    return simplify(n, d);
}

function renderTarget() {
    const el = document.getElementById('target-fraction');
    if (!el) return;
    el.innerHTML = `<div class="frac"><span class="n">${captureTarget.n}</span><span class="d">${captureTarget.d}</span></div>`;
    // Add a data attribute for easy inspection
    el.setAttribute('data-target', `${captureTarget.n}/${captureTarget.d}`);
}

function renderIngredients() {
    const grid = document.getElementById('ingredients-grid');
    grid.innerHTML = "";
    captureIngredients.forEach((f, i) => {
        const tile = document.createElement('div');
        tile.className = 'cork-tile';
        if (selectedIngIndices.includes(i)) tile.classList.add('selected');
        tile.onclick = () => selectIng(i);
        tile.innerHTML = `<div class="frac"><span class="n">${f.n}</span><span class="d">${f.d}</span></div>`;
        grid.appendChild(tile);
    });
}

function selectIng(index) {
    if (captureGameOver) return;
    document.getElementById('capture-feedback').innerText = "";
    const pos = selectedIngIndices.indexOf(index);
    if (pos > -1) {
        selectedIngIndices.splice(pos, 1);
    } else {
        if (selectedIngIndices.length < 2) {
            selectedIngIndices.push(index);
        } else {
            selectedIngIndices = [index];
        }
    }
    renderIngredients();
    updateCapturePreview();
    checkCaptureWin();
}

function selectOp(op) {
    if (captureGameOver) return;
    document.getElementById('capture-feedback').innerText = "";
    selectedCaptureOp = op;
    document.querySelectorAll('.op-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.innerText === (op === '*' ? '×' : op === '/' ? '÷' : op)) b.classList.add('selected');
    });
    updateCapturePreview();
    checkCaptureWin();
}

function checkCaptureWin() {
    if (selectedIngIndices.length !== 2 || !selectedCaptureOp) return;

    const f1 = captureIngredients[selectedIngIndices[0]];
    const f2 = captureIngredients[selectedIngIndices[1]];
    
    // Try both orders for subtraction/division
    const res1 = calculateFrac(f1, f2, selectedCaptureOp);
    const res2 = calculateFrac(f2, f1, selectedCaptureOp);

    if ((res1.n === captureTarget.n && res1.d === captureTarget.d) || 
        (res2.n === captureTarget.n && res2.d === captureTarget.d)) {
        
        captureGameOver = true;
        document.getElementById('pot-display').classList.add('sealed');
        document.getElementById('capture-feedback').innerText = t("msg_win_capture");
        document.getElementById('capture-feedback').style.color = "var(--success)";
        updateCapturePreview();
    } else {
        document.getElementById('capture-feedback').innerText = t("msg_incorrect", { result: "" }).replace("{result}", "");
        document.getElementById('capture-feedback').style.color = "var(--error)";
        updateCapturePreview();
    }
}

function updateCapturePreview() {
    const preview = document.getElementById('expr-preview');
    if (!preview) return;
    if (selectedIngIndices.length === 0) {
        preview.innerHTML = "";
        return;
    }
    const f1 = captureIngredients[selectedIngIndices[0]];
    const f2 = selectedIngIndices.length > 1 ? captureIngredients[selectedIngIndices[1]] : null;
    const op = selectedCaptureOp || "?";
    
    let html = `<div class="frac"><span class="n">${f1.n}</span><span class="d">${f1.d}</span></div> `;
    html += ` <span style="margin: 0 10px;">${op === '*' ? '&times;' : op === '/' ? '&divide;' : op}</span> `;
    if (f2) {
        html += `<div class="frac"><span class="n">${f2.n}</span><span class="d">${f2.d}</span></div>`;
        const res = calculateFrac(f1, f2, selectedCaptureOp || "+");
        html += ` = <div class="frac"><span class="n">${res.n}</span><span class="d">${res.d}</span></div>`;
    } else {
        html += ` <span style="opacity: 0.3;">?</span>`;
    }
    preview.innerHTML = html;
}

function showFractionSolution() {
    // Find solution
    const ops = ['+', '-', '*', '/'];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (i === j) continue;
            for (let op of ops) {
                const res = calculateFrac(captureIngredients[i], captureIngredients[j], op);
                if (res.n === captureTarget.n && res.d === captureTarget.d) {
                    const f1 = captureIngredients[i];
                    const f2 = captureIngredients[j];
                    const solStr = `${f1.n}/${f1.d} ${op === '*' ? '×' : op === '/' ? '÷' : op} ${f2.n}/${f2.d}`;
                    document.getElementById('capture-feedback').innerText = t("msg_sol_is", { sol: solStr });
                    document.getElementById('capture-feedback').style.color = "var(--accent)";
                    return;
                }
            }
        }
    }
}

function toggleRules(type) {
    const box = document.getElementById('rules-' + type);
    if (box.style.display === "none") {
        box.style.display = "block";
    } else {
        box.style.display = "none";
    }
}


// End of Fraction Capture Logic

