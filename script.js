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
    processQueue();
  }
}

function processQueue() {
  if (notificationQueue.length === 0) {
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
    processQueue();
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

function saveAndRefresh() {
  localStorage.setItem('tasks_v2', JSON.stringify(savedTasks));
  renderTasks();
}

addBtn.addEventListener('click', addTask);
undoBtn.addEventListener('click', undoAction);
taskInput.addEventListener('keypress', (e) => {if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', renderTasks);
renderTasks();

window.triggerBubbleSort = function() {
  if (savedTasks.length <= 1) return;
  let n = savedTasks.length;
  let swapped;

  const startTime = performance.now();
  do {
    swapped = false;
    for (let i = 0; i < n - 1; i++) {
      if (savedTasks[i].text.length > savedTasks[i + 1].text.length) {
        let temp = savedTasks[i];
        savedTasks[i] = savedTasks[i + 1];
        savedTasks[i + 1] = temp;
        swapped = true;
      }
    }
    n--;
  } while (swapped);

  const endTime = performance.now();
  saveAndRefresh();
  enqueueNotification(`Bubble Sorted in ${(endTime - startTime).toFixed(4)}ms!`);
}
function quickSortEngine(arr) {
  if (arr.length <= 1) return arr;
  const pivotIndex = Math.floor(arr.length / 2);
  const pivot = arr[pivotIndex];

  const left = [];
  const right = [];
  const equal = [];

  for (let task of arr) {
    if (task.text.length < pivot.text.length) {
      left.push(task);
    } else if (task.text.length > pivot.text.length) {
      right.push(task);
    } else {
      equal.push(task);
    }
  }
  return [...quickSortEngine(left), ...equal, ...quickSortEngine(right)];
}
window.triggerQuickSort = function() {
  if (savedTasks.length <= 1) return;
  const startTime = performance.now();

  savedTasks = quickSortEngine(savedTasks);

  const endTime = performance.now();
  saveAndRefresh();
  enqueueNotification(`Quick Sorted in ${(endTime - startTime).toFixed(4)}ms!`);  
}