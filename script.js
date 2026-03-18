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
    if (solvableHistory.length > 0) navigateHistory(0);
    updateNavButtons();
};

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
        btn.innerText = "Add to History";
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
    updateFeedback("Saved!", "#27ae60");
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
            updateFeedback("Invalid characters!", "#e74c3c");
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
            updateFeedback("Use all four numbers!", "#e74c3c");
        } else if (Math.abs(result - 24) < 0.001) {
            updateFeedback("Correct!", "var(--success)");
        } else {
            updateFeedback(`Incorrect: ${result}`, "#e74c3c");
        }
    } catch (e) {
        updateFeedback("Invalid expression", "#e74c3c");
    }
}

function generateSolvable(updateUI = true) {
    if (checkedCombinations.size >= TOTAL_POSSIBLE) {
        updateFeedback("All combinations checked!", "#e74c3c");
        return;
    }
    let randomNums, key, isSolvable = false;
    let attempts = 0;
    do {
        randomNums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
        key = [...randomNums].sort((a, b) => a - b).join(',');
        if (!checkedCombinations.has(key)) {
            const solution = solve24(randomNums);
            checkedCombinations.add(key);
            if (solution) isSolvable = true;
            else if (!unsolvableHistory.includes(key)) unsolvableHistory.push(key);
        }
        attempts++;
    } while ((!isSolvable || solvableHistory.includes(key)) && attempts < 5000);
    if (isSolvable) {
        if (updateUI) {
            setInputs(randomNums);
            registerPuzzle(randomNums);
            clearSolutionArea();
            updateAddButtonState();
        } else {
            // Register in history silently without navigating to it or changing the board
            solvableHistory.push(key);
            if (storageAllowed) {
                localStorage.setItem('solvableHistory', JSON.stringify(solvableHistory));
            }
            updateNavButtons();
        }
    }
}

function generateAll() {
    const initialCount = solvableHistory.length;
    for (let i = 0; i < TOTAL_POSSIBLE; i++) {
        generateSolvable(false); // Pass false to not update UI
    }
    const generatedCount = solvableHistory.length - initialCount;
    updateFeedback(`Generated ${generatedCount} new puzzles!`, "var(--success)");
}

function navigateHistory(direction) {
    const list = showingUnsolvable ? unsolvableHistory : solvableHistory;
    if (list.length === 0) return;
    currentHistoryIndex = Math.max(0, Math.min(list.length - 1, currentHistoryIndex + direction));
    setInputs(list[currentHistoryIndex].split(',').map(Number));
    clearSolutionArea();
    updateNavButtons();
    updateAddButtonState();
}

function updateNavButtons() {
    const list = showingUnsolvable ? unsolvableHistory : solvableHistory;
    document.getElementById('btn-back').disabled = (currentHistoryIndex <= 0);
    document.getElementById('btn-next').disabled = (currentHistoryIndex >= list.length - 1 || list.length === 0);
    document.getElementById('puzzle-counter').innerText = `Puzzle #${list.length === 0 ? 0 : currentHistoryIndex + 1} of ${list.length}`;

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
        updateFeedback(`Please enter a number between 1 and ${list.length}`, "#e74c3c");
        return;
    }
    currentHistoryIndex = inputVal - 1;
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
    document.getElementById('link-' + p).classList.add('active');
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
    document.getElementById('result').innerText = sol ? `Solution: ${sol}` : "No solution found.";
    registerPuzzle(nums);
    updateAddButtonState();
}

document.getElementById('contact-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const btn = this.querySelector('button');
    const status = document.getElementById('status');
    btn.innerText = 'Sending...';
    btn.disabled = true;
    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, this)
        .then(() => {
            status.innerText = 'Message sent!';
            status.style.color = 'var(--success)';
            this.reset();
        },
            (error) => {
                status.innerText = 'Failed to send.';
                status.style.color = 'var(--error)';
            })
        .finally(() => {
            btn.innerText = 'Send Message';
            btn.disabled = false;
        });
});

function clearAllHistory() {
    if (confirm("Delete all saved puzzles?")) {
        solvableHistory = [];
        unsolvableHistory = [];
        checkedCombinations.clear();
        currentHistoryIndex = -1;
        if (storageAllowed) {
            localStorage.removeItem('solvableHistory');
            localStorage.removeItem('unsolvableHistory');
        }
        setInputs(["", "", "", ""]);
        clearSolutionArea();
        updateNavButtons();
        updateAddButtonState();
        updateFeedback("History Cleared", "#e74c3c");
    }
}

function toggleStoragePreference() {
    storageAllowed = document.getElementById('storage-toggle').checked;
    localStorage.setItem('storageAllowed', storageAllowed);
    if (!storageAllowed) {
        localStorage.removeItem('solvableHistory');
        localStorage.removeItem('unsolvableHistory');
    }
}
