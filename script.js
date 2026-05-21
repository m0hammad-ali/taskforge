const taskInput = document.getElementById('task-input');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const undoBtn = document.getElementById('undo-btn');
const taskList = document.getElementById('task-list');

let savedTasks = JSON.parse(localStorage.getItem('tasks_v2')) || [];
let currentFilter = 'all';

let undoStack = [];
let notificationQueue = [];
let isProcessingQueue = false;

function saveStateToStack() {
  const snapshot = JSON.stringify(savedTasks);
  undoStack.push(snapshot);
  if (undoStack.length > 10) undoStack.shift();
}

window.undoAction = function() {
  if (undoStack.length === 0) {
    enqueueNotification("Nothing to undo!");
    return;
  }
  const previousState = undoStack.pop();
  savedTasks = JSON.parse(previousState);
  saveAndRefresh();
  enqueueNotification("Action undone successfully.");
}

function enqueueNotification(message) {
  notificationQueue.push(message);
  if (!isProcessingQueue) {
    processingQueue();
  }
}

function processQueue() {
  if (notification.length === 0) {
    isProcessingQueue = false;
    return;
  }
  isProcessingQueue = true;
  const message = notificationQueue.shift();
  const container = document.getElementById('notification-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
    processingQueue();
  },2000);
}

function addTask() {
  const text = taskInput.value.trim();
  if (text === '') return alert('Task cannot be empty!');
  saveStateToStack();
  const newTask={
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date()
  };
  savedTasks.push(newTask);
  saveAndRefresh();
  taskInput.value = '';
  enqueueNotification("Task added: " + text);
}

function renderTasks() {
  taskList.innerHTML = '';
  const searchQuery = searchInput.value.toLowerCase();
  savedTasks.forEach((task) => {
    if (currentFilter === 'active' && task.completed) return;
    if (currentFilter === 'completed' && !task.completed) return;
    if(!task.text.toLowerCase().includes(searchQuery)) return;

    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.style.opacity = '0.5';
    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})" style="margin-right: 10px; cursor:pointer;">
      <span style="${task.completed ? 'text-decoration: line-through;' : ''}">${task.text}</span>
      <button onclick="deleteTask(${task.id})" style="background: #ef4444; padding: 4px 8px; float: right; font-size: 11px;">Delete</button>
    `;
    taskList.appendChild(li);
  });
}

window.toggleTask = function(id) {
  saveStateToStack();
  savedTasks = savedTasks.map(task => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveAndRefresh();
  enqueueNotification("Task status updated.");
}

window.deleteTask = function(id) {
  saveStateToStack();
  savedTasks = savedTasks.filter(task => task.id !== id);
  saveAndRefresh();
  enqueueNotification("Task permanently deleted.");
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
undoBtn.addEventListener('click', undoAction);
taskInput.addEventListener('keypress', (e) => {if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', renderTasks);
renderTasks();
