const taskInput = document.getElementById('task-input');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');

let savedTasks = JSON.parse(localStorage.getItem('tasks_v2')) || [];
let currentFilter = 'all';

function renderTasks() {
  taskList.innerHTML = '';
  const searchQuery = searchInput.value.toLowerCase();
  savedTasks.forEach((task) => {
    if (currentFilter === 'active' && task.completed) return;
    if (currentFilter === 'completed' && !tack.completed) return;

    if(!task.text.toLowerCase().includes(searchQuery)) return;

    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.style.opacity = '0.5';
    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask($task.id})" style="margin-right: 10px; cursor:pointer;">
      <span style="${task.completed ? 'task-decoration: line-through;' : ''}">${task.text}</span>
      <button onclick="deleteTask($task.id})" style="backgroud: #ef4444; padding: 4px 8px; float: right; font-size: 11px;">Delete</button>
    `;
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (text === '') return alert('Task cannot be empty!');
  const newTask={
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date()
  };
  savedTasks.push(newTask);
  saveAndRefresh();
  taskInput.value = '';
}

window.toggleTask = function(id) {
  savedTasks = savedTasks.map(task => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveAndRefresh();
}

window.deleteTask = function(index) {
  savedTasks = savedTasks.filter(task => task.id !== id);
  saveAndRefresh();
}

window.setFilter = function(filterValue) {
  currentFilter = filterValue;
  renderTasks();
}

function saveAndRefresh() {
  localStorage.setItem('tasks_v2', JSON.stringify(savedTasks));
  renderTasks();
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', renderTasks);
renderTasks();
