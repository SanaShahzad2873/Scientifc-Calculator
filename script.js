// ============================================
// ELYSIAN CALCULATOR - REAL SCIENTIFIC MODE
// Works like a real calculator: 
// Press "cos" first, then type "8", then "="
// ============================================

class ElysianCalculator {
    constructor() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.resetScreen = false;
        this.history = [];
        this.currentMode = 'basic';
        this.pendingFunction = null;  // For scientific functions
        this.waitingForNumber = false; // Waiting for number after function
        
        this.loadHistory();
        this.init();
    }

    init() {
        this.updateDisplay();
        this.renderHistory();
        this.setupEventListeners();
        this.setupThemes();
        this.setupModeToggle();
    }

    loadHistory() {
        const saved = localStorage.getItem('elysianHistory');
        if (saved) {
            this.history = JSON.parse(saved);
        }
    }

    saveHistory() {
        localStorage.setItem('elysianHistory', JSON.stringify(this.history));
    }

    addToHistory(expression, result) {
        this.history.unshift({
            expression: expression,
            result: result,
            mode: this.currentMode.toUpperCase(),
            time: new Date().toLocaleTimeString()
        });
        
        if (this.history.length > 30) {
            this.history.pop();
        }
        
        this.saveHistory();
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<li style="text-align: center; opacity: 0.5;">No history yet</li>';
            return;
        }
        
        historyList.innerHTML = this.history.map(item => `
            <li class="history-item" data-result="${item.result}">
                <div class="history-expr">${item.expression} =</div>
                <div class="history-result">${item.result}</div>
            </li>
        `).join('');
        
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentValue = item.getAttribute('data-result');
                this.previousValue = '';
                this.operation = null;
                this.pendingFunction = null;
                this.waitingForNumber = false;
                this.resetScreen = true;
                this.updateDisplay();
                this.closeHistory();
            });
        });
    }

    updateDisplay() {
        document.getElementById('result').textContent = this.currentValue;
        
        let expr = '';
        if (this.pendingFunction && this.waitingForNumber) {
            expr = `${this.pendingFunction}(`;
            if (this.currentValue !== '0') {
                expr += this.currentValue;
            }
            expr += ')';
        } else if (this.operation && this.previousValue) {
            const symbols = { '+': '+', '-': '-', '*': '×', '/': '÷', '%': '%' };
            expr = `${this.previousValue} ${symbols[this.operation] || this.operation}`;
            if (this.currentValue !== '0') {
                expr += ` ${this.currentValue}`;
            }
        }
        document.getElementById('expression').textContent = expr;
        
        if (this.currentMode === 'programmer') {
            this.updateProgrammerInfo();
        }
    }

    updateProgrammerInfo() {
        let num = parseInt(this.currentValue);
        if (isNaN(num)) num = 0;
        
        document.getElementById('hexVal').textContent = num.toString(16).toUpperCase();
        document.getElementById('binVal').textContent = num.toString(2);
        document.getElementById('decVal').textContent = num;
    }

    // Handle number input
    appendNumber(num) {
        if (this.waitingForNumber) {
            // We're waiting for a number after a function
            this.currentValue = '0';
            this.waitingForNumber = false;
            this.resetScreen = false;
        }
        
        if (this.resetScreen) {
            this.currentValue = '';
            this.resetScreen = false;
        }
        
        if (num === '.' && this.currentValue.includes('.')) return;
        
        if (this.currentValue === '0' && num !== '.') {
            this.currentValue = num;
        } else {
            this.currentValue += num;
        }
        
        this.updateDisplay();
    }

    // Handle scientific function pressed FIRST (like real calculator)
    scientificFunction(func) {
        // Handle constants immediately
        if (func === 'pi') {
            this.currentValue = Math.PI.toString();
            this.addToHistory('π', Math.PI);
            this.resetScreen = true;
            this.updateDisplay();
            return;
        }
        
        if (func === 'e') {
            this.currentValue = Math.E.toString();
            this.addToHistory('e', Math.E);
            this.resetScreen = true;
            this.updateDisplay();
            return;
        }
        
        // Store the function and wait for number
        this.pendingFunction = func;
        this.waitingForNumber = true;
        this.resetScreen = true;
        this.updateDisplay();
    }

    // Execute the pending scientific function
    executePendingFunction() {
        if (!this.pendingFunction) return;
        
        let val = parseFloat(this.currentValue);
        if (isNaN(val)) {
            this.currentValue = 'Error';
            this.updateDisplay();
            return;
        }
        
        let result;
        let expression = `${this.pendingFunction}(${val}°)`;
        
        switch(this.pendingFunction) {
            case 'sin':
                result = Math.sin(val * Math.PI / 180);
                expression = `sin(${val}°)`;
                break;
            case 'cos':
                result = Math.cos(val * Math.PI / 180);
                expression = `cos(${val}°)`;
                break;
            case 'tan':
                result = Math.tan(val * Math.PI / 180);
                expression = `tan(${val}°)`;
                break;
            case 'sqrt':
                if (val < 0) {
                    result = 'Error';
                } else {
                    result = Math.sqrt(val);
                }
                expression = `√(${val})`;
                break;
            case 'pow2':
                result = Math.pow(val, 2);
                expression = `${val}²`;
                break;
            case 'log':
                if (val <= 0) {
                    result = 'Error';
                } else {
                    result = Math.log10(val);
                }
                expression = `log₁₀(${val})`;
                break;
            case 'ln':
                if (val <= 0) {
                    result = 'Error';
                } else {
                    result = Math.log(val);
                }
                expression = `ln(${val})`;
                break;
            case 'fact':
                result = this.factorial(val);
                expression = `${val}!`;
                break;
            default:
                return;
        }
        
        if (result === 'Error' || isNaN(result) || !isFinite(result)) {
            this.currentValue = 'Error';
        } else {
            result = parseFloat(result.toFixed(10));
            this.currentValue = result.toString();
            this.addToHistory(expression, result);
        }
        
        this.pendingFunction = null;
        this.waitingForNumber = false;
        this.resetScreen = true;
        this.updateDisplay();
    }

    factorial(n) {
        if (n < 0 || !Number.isInteger(n)) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    // Basic operations
    chooseOperation(op) {
        // If there's a pending scientific function, execute it first
        if (this.pendingFunction && !this.waitingForNumber) {
            this.executePendingFunction();
        }
        
        if (this.currentValue === '') return;
        
        if (this.previousValue !== '') {
            this.calculate();
        }
        
        this.operation = op;
        this.previousValue = this.currentValue;
        this.currentValue = '';
        this.updateDisplay();
    }

    calculate() {
        // Execute any pending scientific function first
        if (this.pendingFunction && !this.waitingForNumber) {
            this.executePendingFunction();
        }
        
        let result;
        const prev = parseFloat(this.previousValue);
        const current = parseFloat(this.currentValue);
        
        if (isNaN(prev) || isNaN(current)) return;
        
        const expression = `${prev} ${this.operation} ${current}`;
        
        switch (this.operation) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/': 
                if (current === 0) result = 'Error';
                else result = prev / current;
                break;
            case '%': result = (prev * current) / 100; break;
            default: return;
        }
        
        if (result === 'Error') {
            this.currentValue = 'Error';
        } else {
            result = parseFloat(result.toFixed(10));
            this.currentValue = result.toString();
            this.addToHistory(expression, result);
        }
        
        this.operation = null;
        this.previousValue = '';
        this.resetScreen = true;
        this.updateDisplay();
    }

    // Equals button
    equals() {
        // Execute pending scientific function
        if (this.pendingFunction && !this.waitingForNumber) {
            this.executePendingFunction();
        }
        // Or calculate pending operation
        else if (this.operation && this.currentValue !== '' && this.previousValue !== '') {
            this.calculate();
        }
    }

    // Programmer Functions
    programmerFunction(func) {
        let val = parseInt(this.currentValue);
        if (isNaN(val)) val = 0;
        
        let result;
        let expression = '';
        
        switch(func) {
            case 'hex':
                result = val.toString(16).toUpperCase();
                expression = `DEC→HEX: ${val}`;
                this.currentValue = result;
                break;
            case 'dec':
                result = val.toString();
                expression = `HEX→DEC: ${val}`;
                this.currentValue = result;
                break;
            case 'bin':
                result = val.toString(2);
                expression = `DEC→BIN: ${val}`;
                this.currentValue = result;
                break;
            case 'oct':
                result = val.toString(8);
                expression = `DEC→OCT: ${val}`;
                this.currentValue = result;
                break;
            case 'and':
                if (this.previousValue) {
                    const prev = parseInt(this.previousValue);
                    result = prev & val;
                    expression = `${prev} AND ${val}`;
                    this.currentValue = result.toString();
                    this.addToHistory(expression, result);
                    this.previousValue = '';
                    this.operation = null;
                } else {
                    this.previousValue = this.currentValue;
                    this.currentValue = '';
                    this.operation = 'AND';
                    this.updateDisplay();
                    return;
                }
                break;
            case 'or':
                if (this.previousValue) {
                    const prev = parseInt(this.previousValue);
                    result = prev | val;
                    expression = `${prev} OR ${val}`;
                    this.currentValue = result.toString();
                    this.addToHistory(expression, result);
                    this.previousValue = '';
                    this.operation = null;
                } else {
                    this.previousValue = this.currentValue;
                    this.currentValue = '';
                    this.operation = 'OR';
                    this.updateDisplay();
                    return;
                }
                break;
            case 'xor':
                if (this.previousValue) {
                    const prev = parseInt(this.previousValue);
                    result = prev ^ val;
                    expression = `${prev} XOR ${val}`;
                    this.currentValue = result.toString();
                    this.addToHistory(expression, result);
                    this.previousValue = '';
                    this.operation = null;
                } else {
                    this.previousValue = this.currentValue;
                    this.currentValue = '';
                    this.operation = 'XOR';
                    this.updateDisplay();
                    return;
                }
                break;
            case 'not':
                result = ~val;
                expression = `NOT ${val}`;
                this.currentValue = result.toString();
                this.addToHistory(expression, result);
                break;
            case 'lshift':
                result = val << 1;
                expression = `${val} << 1`;
                this.currentValue = result.toString();
                this.addToHistory(expression, result);
                break;
            case 'rshift':
                result = val >> 1;
                expression = `${val} >> 1`;
                this.currentValue = result.toString();
                this.addToHistory(expression, result);
                break;
            case 'A': case 'B': case 'C': case 'D': case 'E': case 'F':
                this.appendNumber(func);
                return;
            default: return;
        }
        
        this.resetScreen = true;
        this.updateDisplay();
        if (func !== 'hex' && func !== 'dec' && func !== 'bin' && func !== 'oct') {
            this.addToHistory(expression, result);
        }
    }

    clear() {
        this.currentValue = '0';
        this.previousValue = '';
        this.operation = null;
        this.pendingFunction = null;
        this.waitingForNumber = false;
        this.resetScreen = false;
        this.updateDisplay();
    }

    delete() {
        if (this.currentValue === 'Error') {
            this.clear();
            return;
        }
        
        if (this.waitingForNumber) {
            this.pendingFunction = null;
            this.waitingForNumber = false;
            this.currentValue = '0';
        } else if (this.currentValue.length === 1 || (this.currentValue === '0' && !this.resetScreen)) {
            this.currentValue = '0';
        } else {
            this.currentValue = this.currentValue.slice(0, -1);
        }
        
        this.updateDisplay();
    }

    setupThemes() {
        const themes = {
            dark: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
            aurora: 'linear-gradient(135deg, #064e3b, #0f766e, #0891b2)',
            sunset: 'linear-gradient(135deg, #831843, #be185d, #f97316)'
        };

        document.querySelectorAll('.ring').forEach(ring => {
            ring.addEventListener('click', () => {
                const theme = ring.getAttribute('data-theme');
                document.body.style.background = themes[theme];
                document.querySelectorAll('.ring').forEach(r => r.classList.remove('active'));
                ring.classList.add('active');
            });
        });
    }

    setupModeToggle() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        const scientificGrid = document.getElementById('scientificGrid');
        const programmerGrid = document.getElementById('programmerGrid');
        const programmerInfo = document.getElementById('programmerInfo');
        
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentMode = btn.getAttribute('data-mode');
                
                scientificGrid.classList.remove('show');
                programmerGrid.classList.remove('show');
                programmerInfo.classList.remove('show');
                
                if (this.currentMode === 'scientific') {
                    scientificGrid.classList.add('show');
                } else if (this.currentMode === 'programmer') {
                    programmerGrid.classList.add('show');
                    programmerInfo.classList.add('show');
                }
                
                this.clear();
            });
        });
    }

    closeHistory() {
        document.getElementById('historyPanel').classList.remove('open');
    }

    setupEventListeners() {
        // Numbers
        document.querySelectorAll('[data-num]').forEach(btn => {
            btn.addEventListener('click', () => this.appendNumber(btn.getAttribute('data-num')));
        });
        
        // Operators
        document.querySelectorAll('[data-op]').forEach(btn => {
            btn.addEventListener('click', () => this.chooseOperation(btn.getAttribute('data-op')));
        });
        
        // Scientific functions (NOW WORKS: press function first, then number)
        document.querySelectorAll('[data-func]').forEach(btn => {
            btn.addEventListener('click', () => this.scientificFunction(btn.getAttribute('data-func')));
        });
        
        // Programmer
        document.querySelectorAll('[data-prog]').forEach(btn => {
            btn.addEventListener('click', () => this.programmerFunction(btn.getAttribute('data-prog')));
        });
        
        // Clear
        document.querySelector('[data-action="clear"]').addEventListener('click', () => this.clear());
        
        // Delete
        document.querySelector('[data-action="delete"]').addEventListener('click', () => this.delete());
        
        // Equals
        document.querySelector('[data-action="equals"]').addEventListener('click', () => this.equals());
        
        // History
        document.getElementById('historyToggle').addEventListener('click', () => {
            document.getElementById('historyPanel').classList.toggle('open');
        });
        
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
        
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('historyPanel');
            const toggle = document.getElementById('historyToggle');
            if (!panel.contains(e.target) && !toggle.contains(e.target) && panel.classList.contains('open')) {
                panel.classList.remove('open');
            }
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9' || e.key === '.') {
                this.appendNumber(e.key);
            } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/' || e.key === '%') {
                this.chooseOperation(e.key);
            } else if (e.key === 'Enter' || e.key === '=') {
                this.equals();
            } else if (e.key === 'Escape') {
                this.clear();
            } else if (e.key === 'Backspace') {
                this.delete();
            }
        });
    }
}

// Start the calculator
new ElysianCalculator();