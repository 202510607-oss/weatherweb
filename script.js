// State Management
let todos = JSON.parse(localStorage.getItem('focus-planner-todos')) || [];
let currentTab = 'today';

// DOM Elements
const todoInput = document.getElementById('todo-input');
const prioritySelect = document.getElementById('priority-select');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const currentTabTitle = document.getElementById('current-tab-title');
const navItems = document.querySelectorAll('.nav-item');
const currentDateEl = document.getElementById('current-date');

// Initialize App
function init() {
    updateDate();
    renderTodos();
    updateStats();
    
    // Add Event Listeners
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            currentTab = item.dataset.tab;
            currentTabTitle.textContent = item.querySelector('span').textContent;
            renderTodos();
        });
    });
}

// Update Current Date
function updateDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    currentDateEl.textContent = now.toLocaleDateString('ko-KR', options);
}

// Add New Todo
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        id: Date.now(),
        text: text,
        priority: prioritySelect.value,
        completed: false,
        createdAt: new Date().toISOString(),
        important: currentTab === 'important'
    };

    todos.unshift(newTodo);
    saveTodos();
    todoInput.value = '';
    renderTodos();
    updateStats();
}

// Toggle Todo Status
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    saveTodos();
    renderTodos();
    updateStats();
}

// Delete Todo
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
}

// Save to LocalStorage
function saveTodos() {
    localStorage.setItem('focus-planner-todos', JSON.stringify(todos));
}

// Render Todo List
function renderTodos() {
    todoList.innerHTML = '';
    
    let filteredTodos = todos;
    if (currentTab === 'important') {
        filteredTodos = todos.filter(t => t.priority === 'high' || t.important);
    } else if (currentTab === 'completed') {
        filteredTodos = todos.filter(t => t.completed);
    } else {
        // Today tab: show non-completed first, or just all
        filteredTodos = todos.filter(t => !t.completed || currentTab === 'all');
    }

    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="clipboard-list"></i>
                <p>${getEmptyMessage()}</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})">
                <i data-lucide="check"></i>
            </div>
            <span class="todo-text">${todo.text}</span>
            <span class="priority-tag ${todo.priority}">${getPriorityLabel(todo.priority)}</span>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">
                <i data-lucide="trash-2"></i>
            </button>
        `;
        todoList.appendChild(li);
    });
    
    lucide.createIcons();
}

function getPriorityLabel(priority) {
    const labels = { low: '낮음', medium: '보통', high: '긴급' };
    return labels[priority];
}

function getEmptyMessage() {
    if (currentTab === 'important') return '중요한 할 일이 없습니다.';
    if (currentTab === 'completed') return '완료된 할 일이 없습니다.';
    return '할 일이 없습니다. 새로운 하루를 시작해 보세요!';
}

// Update Stats
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% 완료`;
}

// Run App
init();
