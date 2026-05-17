const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');

let savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];

function renderTasks() {
  taskList.innerHTML = '';
  savedTasks.forEach((taskText, index) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
      <span>${taskText}</span>
      <button onclick="deleteTask(${index})" style="background: #ef4444; padding: 4px 10px; float: right; font-size: 12px;">Delete</button>
    `;
    taskList.appendChild(li);
  });
}

function addTask() {
  const text = taskInput.value.trim();
  if (text === '') {
    alert('Please type a task before adding!');
    return;
  }
  savedTasks.push(text);
  localStorage.setItem('tasks', JSON.stringify(savedTasks));
  taskInput.value = '';
  renderTasks();
}

window.deleteTask = function(index) {
  savedTasks.splice(index, 1);
  localStorage.setItem('tasks', JSON.stringify(savedTasks));
  renderTasks();
}
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addTask();
  }
});
renderTasks();
