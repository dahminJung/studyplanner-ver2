// ==========================================
// Study Planner Pro - Logic
// ==========================================

class StudyStore {
    constructor() {
        this.data = JSON.parse(localStorage.getItem('study-planner-data')) || {
            subjects: [],      // { id, name, color }
            todos: [],         // { id, text, subjectId, completed }
            timeBlocks: {},    // key: hour (6-23), value: subjectId
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
// 0. Navigation (Page Toggle)
// ==========================================
const btnPlanner = document.getElementById('nav-planner');
const btnStats = document.getElementById('nav-stats');
const pagePlanner = document.getElementById('planner-page');
const pageStats = document.getElementById('stats-page');

btnPlanner.addEventListener('click', () => {
    btnPlanner.classList.add('active');
    btnStats.classList.remove('active');
    pagePlanner.classList.add('active');
    pageStats.classList.remove('active');
});

btnStats.addEventListener('click', () => {
    btnStats.classList.add('active');
    btnPlanner.classList.remove('active');
    pageStats.classList.add('active');
    pagePlanner.classList.remove('active');
});

// ==========================================
// 1. Subjects Management & Color Palette
// ==========================================
const subjectNameInput = document.getElementById('subject-name');
const addSubjectBtn = document.getElementById('add-subject-btn');
const subjectListEl = document.getElementById('subject-list');
const colorBtns = document.querySelectorAll('.color-btn');
let selectedColor = '#ffb3ba'; // Default color

colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.dataset.color;
    });
});

const selects = [
    document.getElementById('todo-subject-select'),
    document.getElementById('timer-subject-select')
];

function renderSubjects() {
    subjectListEl.innerHTML = '';
    
    selects.forEach(select => {
        const defaultOption = select.id === 'todo-subject-select' ? '<option value="">과목 선택</option>' : '';
        select.innerHTML = defaultOption;
    });

    store.data.subjects.forEach(sub => {
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
            store.data.todos.forEach(t => { if(t.subjectId === sub.id) t.subjectId = ''; });
            Object.keys(store.data.timeBlocks).forEach(h => { if(store.data.timeBlocks[h] === sub.id) delete store.data.timeBlocks[h]; });
            delete store.data.studyRecords[sub.id];
            store.save();
        });
        subjectListEl.appendChild(li);

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
        color: selectedColor
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
        if (sub) badgeHTML = `<span class="todo-subject-badge" style="background-color: ${sub.color}; color: #333;">${sub.name}</span>`;

        li.innerHTML = `
            <input type="checkbox" class="todo-check" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            ${badgeHTML}
            <button class="del-btn" style="color:var(--text-muted); font-size:1.2rem;">×</button>
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

function updateDisplay() { displayEl.textContent = formatTime(timerSeconds); }

btnStart.addEventListener('click', () => {
    if (isRunning) return;
    isRunning = true;
    btnStart.disabled = true; btnStop.disabled = false;
    saveArea.style.display = 'none';
    timerInterval = setInterval(() => { timerSeconds++; updateDisplay(); }, 1000);
});

function stopTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    btnStart.disabled = false; btnStop.disabled = true;
    if (timerSeconds > 0 && store.data.subjects.length > 0) saveArea.style.display = 'flex';
}

btnStop.addEventListener('click', stopTimer);
btnReset.addEventListener('click', () => {
    stopTimer(); timerSeconds = 0; updateDisplay(); saveArea.style.display = 'none';
});

saveBtn.addEventListener('click', () => {
    const subId = timerSubjectSelect.value;
    if (!subId) return alert('과목을 선택해주세요.');
    if (!store.data.studyRecords[subId]) store.data.studyRecords[subId] = 0;
    store.data.studyRecords[subId] += timerSeconds;
    timerSeconds = 0; updateDisplay(); saveArea.style.display = 'none'; store.save();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRunning) {
        stopTimer();
        alert('탭을 벗어나 타이머가 일시 정지되었습니다.');
    }
});

// ==========================================
// 4. Time Table (Drag & Popup)
// ==========================================
const timeGridContainer = document.getElementById('time-grid-container');
const subjectPopup = document.getElementById('subject-popup');
const popupColorsContainer = document.getElementById('popup-colors');
const popupClearBtn = document.getElementById('popup-clear');
const popupCloseBtn = document.getElementById('popup-close');

let isDragging = false;
let dragSelectedHours = new Set();

function initTimeTable() {
    timeGridContainer.innerHTML = '';
    
    // 글로벌 마우스 업 이벤트 (드래그 종료)
    document.addEventListener('mouseup', handleDragEnd);
    
    for (let i = 6; i < 24; i++) {
        const row = document.createElement('div');
        row.className = 'time-row';
        
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = `${i < 10 ? '0'+i : i}:00`;

        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.dataset.hour = i;
        
        // 드래그 시작
        slot.addEventListener('mousedown', (e) => {
            if (store.data.subjects.length === 0) {
                alert('과목을 먼저 등록해주세요.');
                return;
            }
            if(e.button !== 0) return; // 좌클릭만 허용
            isDragging = true;
            dragSelectedHours.clear();
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            subjectPopup.style.display = 'none';
            
            dragSelectedHours.add(i);
            slot.classList.add('selected');
        });
        
        // 드래그 중
        slot.addEventListener('mouseenter', () => {
            if (isDragging) {
                dragSelectedHours.add(i);
                slot.classList.add('selected');
            }
        });

        row.appendChild(label);
        row.appendChild(slot);
        timeGridContainer.appendChild(row);
    }
}

function handleDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    
    if (dragSelectedHours.size > 0) {
        showSubjectPopup(e.pageX, e.pageY);
    }
}

function showSubjectPopup(x, y) {
    popupColorsContainer.innerHTML = '';
    
    store.data.subjects.forEach(sub => {
        const dot = document.createElement('div');
        dot.className = 'popup-color-dot';
        dot.style.backgroundColor = sub.color;
        dot.title = sub.name;
        
        dot.addEventListener('click', () => {
            dragSelectedHours.forEach(hour => {
                store.data.timeBlocks[hour] = sub.id;
            });
            closePopupAndSave();
        });
        popupColorsContainer.appendChild(dot);
    });
    
    // 팝업 위치 조정 (마우스 커서 근처)
    subjectPopup.style.left = `${x + 15}px`;
    subjectPopup.style.top = `${y + 15}px`;
    subjectPopup.style.display = 'flex';
}

function closePopupAndSave() {
    subjectPopup.style.display = 'none';
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    dragSelectedHours.clear();
    store.save();
}

popupClearBtn.addEventListener('click', () => {
    dragSelectedHours.forEach(hour => {
        delete store.data.timeBlocks[hour];
    });
    closePopupAndSave();
});

popupCloseBtn.addEventListener('click', () => {
    subjectPopup.style.display = 'none';
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    dragSelectedHours.clear();
});

function renderTimeTable() {
    const slots = timeGridContainer.querySelectorAll('.time-slot');
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

// ==========================================
// 5. Statistics
// ==========================================
const totalTimeVal = document.getElementById('total-time-val');
const todoRateVal = document.getElementById('todo-rate-val');
const pieChart = document.getElementById('pie-chart');
const chartLegend = document.getElementById('chart-legend');
const barChart = document.getElementById('bar-chart');

function renderStats() {
    let totalSec = 0;
    Object.values(store.data.studyRecords).forEach(sec => totalSec += sec);
    totalTimeVal.textContent = `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`;

    const totalTodos = store.data.todos.length;
    const completedTodos = store.data.todos.filter(t => t.completed).length;
    const rate = totalTodos === 0 ? 0 : Math.round((completedTodos / totalTodos) * 100);
    todoRateVal.textContent = `${rate}%`;

    chartLegend.innerHTML = '';
    if (totalSec === 0) {
        pieChart.style.background = '#eee';
        barChart.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; margin:auto;">데이터가 없습니다.</p>';
        return;
    }

    let gradientString = [];
    let currentDegree = 0;
    barChart.innerHTML = '';
    const maxSec = Math.max(...Object.values(store.data.studyRecords));

    store.data.subjects.forEach(sub => {
        const sec = store.data.studyRecords[sub.id] || 0;
        if (sec > 0) {
            const degree = (sec / totalSec) * 360;
            gradientString.push(`${sub.color} ${currentDegree}deg ${currentDegree + degree}deg`);
            currentDegree += degree;

            const percent = Math.round((sec / totalSec) * 100);
            const li = document.createElement('li');
            li.innerHTML = `<span style="display:flex; align-items:center; gap:5px;"><span class="color-dot" style="background-color:${sub.color}"></span> ${sub.name}</span> <span>${percent}%</span>`;
            chartLegend.appendChild(li);

            const heightPercent = (sec / maxSec) * 100;
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.backgroundColor = sub.color;
            bar.style.height = `${heightPercent}%`;
            bar.dataset.label = sub.name.substring(0, 3);
            bar.dataset.time = `${Math.round(sec / 60)}m`;
            barChart.appendChild(bar);
        }
    });

    pieChart.style.background = `conic-gradient(${gradientString.join(', ')})`;
}

// ==========================================
// Init
// ==========================================
document.addEventListener('store-updated', () => {
    renderSubjects(); renderTodos(); renderTimeTable(); renderStats();
});

initTimeTable();
document.dispatchEvent(new Event('store-updated'));
