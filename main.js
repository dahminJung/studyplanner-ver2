// ==========================================
// Study Planner Dashboard - Core Logic
// ==========================================

class StudyStore {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('study-planner-data')) || {
            subjects: [],      // { id, name, color }
            todos: [],         // { id, text, subjectId, completed }
            timeBlocks: {},    // key: hour (0-23), value: subjectId
            studyRecords: {}   // key: subjectId, value: seconds
        };
    }
    save() {
        localStorage.setItem('study-planner-data', JSON.stringify(this.data));
        document.dispatchEvent(new Event('store-updated'));
    }
}

const store = new StudyStore();

// ==========================================
// 1. Subjects Management
// ==========================================
const subjectNameInput = document.getElementById('subject-name');
const subjectColorInput = document.getElementById('subject-color');
const addSubjectBtn = document.getElementById('add-subject-btn');
const subjectListEl = document.getElementById('subject-list');
const selects = [
    document.getElementById('todo-subject-select'),
    document.getElementById('timer-subject-select'),
    document.getElementById('modal-subject-select')
];

function renderSubjects() {
    subjectListEl.innerHTML = '';
    
    // Select 박스들 초기화
    selects.forEach(select => {
        const defaultOption = select.id === 'todo-subject-select' ? '<option value="">과목 없음</option>' : '';
        select.innerHTML = defaultOption;
    });

    store.data.subjects.forEach(sub => {
        // 리스트 아이템 추가
        const li = document.createElement('li');
        li.className = 'subject-item';
        li.innerHTML = `
            <div class="subject-info">
                <span class="color-dot" style="background-color: ${sub.color}"></span>
                ${sub.name}
            </div>
            <button class="del-btn" data-id="${sub.id}">×</button>
        `;
        li.querySelector('.del-btn').addEventListener('click', () => {
            store.data.subjects = store.data.subjects.filter(s => s.id !== sub.id);
            // 관련 데이터 정리
            store.data.todos.forEach(t => { if(t.subjectId === sub.id) t.subjectId = ''; });
            Object.keys(store.data.timeBlocks).forEach(h => { if(store.data.timeBlocks[h] === sub.id) delete store.data.timeBlocks[h]; });
            delete store.data.studyRecords[sub.id];
            store.save();
        });
        subjectListEl.appendChild(li);

        // Select 박스 옵션 추가
        selects.forEach(select => {
            const option = document.createElement('option');
            option.value = sub.id;
            option.textContent = sub.name;
            select.appendChild(option);
        });
    });
}

addSubjectBtn.addEventListener('click', () => {
    const name = subjectNameInput.value.trim();
    if (!name) return;
    store.data.subjects.push({
        id: 'sub_' + Date.now(),
        name,
        color: subjectColorInput.value
    });
    subjectNameInput.value = '';
    store.save();
});

// ==========================================
// 2. To-Do List
// ==========================================
const todoInput = document.getElementById('todo-input');
const todoSubjectSelect = document.getElementById('todo-subject-select');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoListEl = document.getElementById('todo-list');

function renderTodos() {
    todoListEl.innerHTML = '';
    store.data.todos.forEach(todo => {
        const sub = store.data.subjects.find(s => s.id === todo.subjectId);
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        let badgeHTML = '';
        if (sub) {
            badgeHTML = `<span class="todo-subject-badge" style="background-color: ${sub.color}">${sub.name}</span>`;
        }

        li.innerHTML = `
            <input type="checkbox" class="todo-check" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            ${badgeHTML}
            <button class="del-btn" style="color:var(--text-muted); font-size:1rem;">×</button>
        `;

        li.querySelector('.todo-check').addEventListener('change', (e) => {
            todo.completed = e.target.checked;
            store.save();
        });

        li.querySelector('.del-btn').addEventListener('click', () => {
            store.data.todos = store.data.todos.filter(t => t.id !== todo.id);
            store.save();
        });

        todoListEl.appendChild(li);
    });
}

addTodoBtn.addEventListener('click', () => {
    const text = todoInput.value.trim();
    if (!text) return;
    store.data.todos.push({
        id: 'todo_' + Date.now(),
        text,
        subjectId: todoSubjectSelect.value,
        completed: false
    });
    todoInput.value = '';
    store.save();
});

// ==========================================
// 3. Smart Timer
// ==========================================
let timerInterval;
let timerSeconds = 0;
let isRunning = false;

const displayEl = document.getElementById('timer-display');
const btnStart = document.getElementById('timer-start');
const btnStop = document.getElementById('timer-stop');
const btnReset = document.getElementById('timer-reset');
const saveArea = document.getElementById('timer-save-area');
const saveBtn = document.getElementById('timer-save-btn');
const timerSubjectSelect = document.getElementById('timer-subject-select');

function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function updateDisplay() {
    displayEl.textContent = formatTime(timerSeconds);
}

btnStart.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;
    saveArea.style.display = 'none';
    
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateDisplay();
    }, 1000);
});

function stopTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    btnStart.disabled = false;
    btnStop.disabled = true;
    
    // 시간 저장 영역 표시 (과목이 하나라도 있고, 1초 이상 측정되었을 때)
    if (timerSeconds > 0 && store.data.subjects.length > 0) {
        saveArea.style.display = 'block';
    }
}

btnStop.addEventListener('click', stopTimer);

btnReset.addEventListener('click', () => {
    stopTimer();
    timerSeconds = 0;
    updateDisplay();
    saveArea.style.display = 'none';
});

saveBtn.addEventListener('click', () => {
    const subId = timerSubjectSelect.value;
    if (!subId) return alert('과목을 선택해주세요.');
    
    if (!store.data.studyRecords[subId]) store.data.studyRecords[subId] = 0;
    store.data.studyRecords[subId] += timerSeconds;
    
    timerSeconds = 0;
    updateDisplay();
    saveArea.style.display = 'none';
    store.save();
});

// 브라우저 탭 이탈 시 자동 정지 (핵심 요구사항)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRunning) {
        stopTimer();
        alert('탭을 벗어나 타이머가 일시 정지되었습니다.');
    }
});


// ==========================================
// 4. Time Table (24 Hours)
// ==========================================
const timeLabelsEl = document.getElementById('time-labels');
const timeGridEl = document.getElementById('time-grid');
const modalOverlay = document.getElementById('modal-overlay');
let selectedHour = null;

function initTimeTable() {
    timeLabelsEl.innerHTML = '';
    timeGridEl.innerHTML = '';
    
    for (let i = 0; i < 24; i++) {
        // Labels
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = `${i}:00`;
        timeLabelsEl.appendChild(label);

        // Slots
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.dataset.hour = i;
        slot.addEventListener('click', () => openModal(i));
        timeGridEl.appendChild(slot);
    }
}

function renderTimeTable() {
    const slots = timeGridEl.querySelectorAll('.time-slot');
    slots.forEach(slot => {
        const hour = slot.dataset.hour;
        const subId = store.data.timeBlocks[hour];
        if (subId) {
            const sub = store.data.subjects.find(s => s.id === subId);
            if (sub) {
                slot.style.backgroundColor = sub.color;
                slot.textContent = sub.name;
                return;
            }
        }
        slot.style.backgroundColor = 'transparent';
        slot.textContent = '';
    });
}

function openModal(hour) {
    if (store.data.subjects.length === 0) return alert('먼저 과목을 등록해주세요.');
    selectedHour = hour;
    const currentSub = store.data.timeBlocks[hour];
    document.getElementById('modal-subject-select').value = currentSub || '';
    modalOverlay.style.display = 'flex';
}

document.getElementById('modal-cancel').addEventListener('click', () => { modalOverlay.style.display = 'none'; });
document.getElementById('modal-clear').addEventListener('click', () => {
    delete store.data.timeBlocks[selectedHour];
    modalOverlay.style.display = 'none';
    store.save();
});
document.getElementById('modal-confirm').addEventListener('click', () => {
    const subId = document.getElementById('modal-subject-select').value;
    if (subId) store.data.timeBlocks[selectedHour] = subId;
    modalOverlay.style.display = 'none';
    store.save();
});

// ==========================================
// 5. Statistics (No Framework, CSS only)
// ==========================================
const totalTimeVal = document.getElementById('total-time-val');
const todoRateVal = document.getElementById('todo-rate-val');
const pieChart = document.getElementById('pie-chart');
const chartLegend = document.getElementById('chart-legend');
const barChart = document.getElementById('bar-chart');

function renderStats() {
    // 1. 총 학습 시간 및 투두 달성률
    let totalSec = 0;
    Object.values(store.data.studyRecords).forEach(sec => totalSec += sec);
    totalTimeVal.textContent = `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`;

    const totalTodos = store.data.todos.length;
    const completedTodos = store.data.todos.filter(t => t.completed).length;
    const rate = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);
    todoRateVal.textContent = `${rate}%`;

    // 2. Pie Chart (과목별 비중) & Legend
    chartLegend.innerHTML = '';
    if (totalSec === 0) {
        pieChart.style.background = '#e5e7eb';
        barChart.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; margin:auto;">데이터가 없습니다.</p>';
        return;
    }

    let gradientString = [];
    let currentDegree = 0;
    
    barChart.innerHTML = ''; // 바 차트 초기화

    // 가장 많이 공부한 과목의 시간을 기준으로 바 차트 높이 계산 (maxHeight = 100%)
    const maxSec = Math.max(...Object.values(store.data.studyRecords));

    store.data.subjects.forEach(sub => {
        const sec = store.data.studyRecords[sub.id] || 0;
        if (sec > 0) {
            // Pie Chart 로직
            const degree = (sec / totalSec) * 360;
            gradientString.push(`${sub.color} ${currentDegree}deg ${currentDegree + degree}deg`);
            currentDegree += degree;

            // Legend 추가
            const percent = Math.round((sec / totalSec) * 100);
            const li = document.createElement('li');
            li.innerHTML = `<span style="display:flex; align-items:center; gap:5px;"><span class="color-dot" style="background-color:${sub.color}"></span> ${sub.name}</span> <span>${percent}%</span>`;
            chartLegend.appendChild(li);

            // Bar Chart 로직
            const heightPercent = (sec / maxSec) * 100;
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.backgroundColor = sub.color;
            bar.style.height = `${heightPercent}%`;
            bar.dataset.label = sub.name.substring(0, 3); // 과목명 앞 3글자
            bar.dataset.time = `${Math.round(sec / 60)}m`;
            barChart.appendChild(bar);
        }
    });

    pieChart.style.background = `conic-gradient(${gradientString.join(', ')})`;
}

// ==========================================
// Initialization & Subscription
// ==========================================
document.addEventListener('store-updated', () => {
    renderSubjects();
    renderTodos();
    renderTimeTable();
    renderStats();
});

// App Start
initTimeTable();
document.dispatchEvent(new Event('store-updated'));
