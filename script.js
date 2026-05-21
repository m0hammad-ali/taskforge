const taskInput = document.getElementById('task-input');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const undoBtn = document.getElementById('undo-btn');
const taskList = document.getElementById('task-list');

let savedTasks = JSON.parse(localStorage.getItem('tasks_v3')) || [];
let currentFilter = 'all';
let undoStack = [];
let notificationQueue = [];
let isProcessingQueue = false;
let dependencyGraph = JSON.parse(localStorage.getItem('dependency_graph')) || {};

function saveStateToStack() {
  undoStack.push(JSON.stringify({ tasks: savedTasks, graph: dependencyGraph}));
  if (undoStack.length > 10) undoStack.shift();
}

window.undoAction = function() {
  if (undoStack.length === 0) return enqueueNotification("Nothing to undo!");
  const previousState = JSON.parse(undoStack.pop());
  savedTasks = previousState.tasks;
  dependencyGraph = previousState.graph;
  saveAndRefresh();
  enqueueNotification("Action undone.");
}

function enqueueNotification(message) {
  notificationQueue.push(message);
  if (!isProcessingQueue) processQueue();
}

function processQueue() {
  if (notificationQueue.length === 0) {
    isProcessingQueue = false;
    return;
  }
  isProcessingQueue = true;
  const message = notificationQueue.shift();
  const container = document.getElementById('notification-container');
  if (!container) return; 

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
    processQueue();
  }, 2000);
}

function addTask() {
  const text = taskInput.value.trim();
  if (text === '') return alert('Task cannot be empty!');
  saveStateToStack();
  
  const newTask = {
    id: Date.now(),
    text: text,
    completed: false,
    subtasks: [], 
    createdAt: new Date()
  };
  savedTasks.push(newTask);
  saveAndRefresh();
  taskInput.value = '';
  enqueueNotification("Task created.");
}

window.addSubtask = function(parentId) {
  const subtaskText = prompt("Enter subtask description:");
  if (!subtaskText || subtaskText.trim() === '') return;
  saveStateToStack();
  savedTasks = savedTasks.map(task => {
    if (task.id === parentId) {
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push({
         id: Date.now() + Math.floor(Math.random() * 1000),
         text: subtaskText.trim(),
         completed: false
      });
    }
    return task;
  });
  saveAndRefresh();
  enqueueNotification("Sub-task appended to tree.");
}

function wouldCreateCycle(start, target) {
  if (start === target) return true;
  const neighbors = dependencyGraph[start] || [];
  for (const nextNode of neighbors) {
    if (wouldCreateCycle(nextNode, target)) return true;
  }
  return false;
}

window.makeDependent = function(targetTaskId) {
    const parentIdStr = prompt("Enter the numerical ID of the task that BLOCKS this task:");
    if (!parentIdStr) return;
    const parentId = parseInt(parentIdStr);

    if (parentId === targetTaskId) return alert("A task cannot block itself!");
    
    // FIXED: Run cycle-safety check logic routine lookup to prevent deadlocks
    if (wouldCreateCycle(targetTaskId, parentId)) {
      return alert("Circular reference block detected! This layout would permanently lock both tasks.");
    }

    saveStateToStack();

    if (!dependencyGraph[parentId]) {
        dependencyGraph[parentId] = [];
    }
    if (!dependencyGraph[parentId].includes(targetTaskId)) {
        dependencyGraph[parentId].push(targetTaskId);
    }

    saveAndRefresh();
    enqueueNotification("Dependency path established.");
}

window.toggleTask = function(id) {
  for (let parentId in dependencyGraph) {
        if (dependencyGraph[parentId].includes(id)) {
            const blocker = savedTasks.find(t => t.id === parseInt(parentId));
            if (blocker && !blocker.completed) {
                alert(`Blocked! You must complete task "${blocker.text}" (ID: ${blocker.id}) first.`);
                renderTasks(); 
                return;
            }
        }
    }
  saveStateToStack();
  savedTasks = savedTasks.map(task => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
  saveAndRefresh();
}

window.deleteTask = function(id) {
  saveStateToStack();
  savedTasks = savedTasks.filter(task => task.id !== id);
  delete dependencyGraph[id];
  saveAndRefresh();
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
    if (!task.text.toLowerCase().includes(searchQuery)) return;

    if (!task.subtasks) task.subtasks = [];

    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.style.opacity = '0.5';
    
    let subtasksHTML = '<ul style="margin-top:10px; padding-left:20px;">';
    task.subtasks.forEach(sub => {
        subtasksHTML += `
            <li style="border-left: 2px solid #cbd5e1; background: #fff; margin-bottom: 4px; padding: 6px 10px;">
                <span>${sub.text}</span>
            </li>`;
    });
    subtasksHTML += '</ul>';

    li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div>
                <input type="checkbox" ${task.completed ? 'checked' : ''} onclick="toggleTask(${task.id})" style="cursor:pointer;">
                <span style="${task.completed ? 'text-decoration: line-through;' : ''}"><strong>[ID: ${task.id}]</strong> ${task.text}</span>
            </div>
            <div>
                <button onclick="addSubtask(${task.id})" style="background:#22c55e; padding:4px 6px; font-size:10px; color:#fff; border:none; cursor:pointer;">+ Sub</button>
                <button onclick="makeDependent(${task.id})" style="background:#a855f7; padding:4px 6px; font-size:10px; color:#fff; border:none; cursor:pointer;">Block</button>
                <button onclick="deleteTask(${task.id})" style="background:#ef4444; padding:4px 6px; font-size:10px; color:#fff; border:none; cursor:pointer;">Del</button>
            </div>
        </div>
        ${task.subtasks.length > 0 ? subtasksHTML : ''}
    `;
    taskList.appendChild(li);
  });
}

function saveAndRefresh() {
    localStorage.setItem('tasks_v3', JSON.stringify(savedTasks));
    localStorage.setItem('dependency_graph', JSON.stringify(dependencyGraph));
    renderTasks();
}

window.triggerBubbleSort = function() {
    if (savedTasks.length <= 1) return;
    saveStateToStack();
    for (let i = 0; i < savedTasks.length; i++) {
        for (let j = 0; j < savedTasks.length - 1; j++) {
            if (savedTasks[j].text.length > savedTasks[j+1].text.length) {
                let t = savedTasks[j]; savedTasks[j] = savedTasks[j+1]; savedTasks[j+1] = t;
            }
        }
    }
    saveAndRefresh();
    enqueueNotification("Bubble sorted.");
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
  saveStateToStack();
  const startTime = performance.now();

  savedTasks = quickSortEngine(savedTasks);

  const endTime = performance.now();
  saveAndRefresh();
  enqueueNotification(`Quick Sorted in ${(endTime - startTime).toFixed(4)}ms!`);  
}

addBtn.addEventListener('click', addTask);
undoBtn.addEventListener('click', undoAction);
taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', renderTasks);
renderTasks();
