// Study Planner Pro Core Logic
class StudyPlanner {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('study-tasks')) || [];
        this.filter = 'all';
        
        this.input = document.getElementById('task-input');
        this.addBtn = document.getElementById('add-btn');
        this.taskList = document.getElementById('task-list');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        this.filterBtns = document.querySelectorAll('.filter-btn');

        this.init();
    }

    init() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filter = e.target.dataset.filter;
                this.render();
            });
        });

        this.render();
    }

    save() {
        localStorage.setItem('study-tasks', JSON.stringify(this.tasks));
        this.updateProgress();
    }

    addTask() {
        const text = this.input.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now(),
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.input.value = '';
        this.save();
        this.render();
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.save();
        this.render();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.save();
        this.render();
    }

    updateProgress() {
        if (this.tasks.length === 0) {
            this.progressFill.style.width = '0%';
            this.progressText.textContent = '0%';
            return;
        }
        const completedCount = this.tasks.filter(t => t.completed).length;
        const percent = Math.round((completedCount / this.tasks.length) * 100);
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}%`;
    }

    render() {
        this.taskList.innerHTML = '';
        
        const filteredTasks = this.tasks.filter(task => {
            if (this.filter === 'pending') return !task.completed;
            if (this.filter === 'completed') return task.completed;
            return true;
        });

        if (filteredTasks.length === 0) {
            this.taskList.innerHTML = `<li class="placeholder" style="text-align:center; padding: 2rem; color: var(--text-dim);">표시할 할 일이 없습니다.</li>`;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-card ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${task.text}</span>
                <button class="delete-btn" title="삭제">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            `;

            li.querySelector('input').addEventListener('change', () => this.toggleTask(task.id));
            li.querySelector('.delete-btn').addEventListener('click', () => this.deleteTask(task.id));

            this.taskList.appendChild(li);
        });

        this.updateProgress();
    }
}

// 앱 실행
document.addEventListener('DOMContentLoaded', () => {
    new StudyPlanner();
});
