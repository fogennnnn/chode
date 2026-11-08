#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const TODO_FILE = path.join(__dirname, 'todos.json');

function loadTodos() {
  try {
    if (fs.existsSync(TODO_FILE)) {
      const data = fs.readFileSync(TODO_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    // File corrupted or unreadable
  }
  return [];
}

function saveTodos(todos) {
  fs.writeFileSync(TODO_FILE, JSON.stringify(todos, null, 2));
}

function addTodo(text) {
  if (!text || text.trim() === '') {
    console.error('Error: Todo text cannot be empty');
    process.exit(1);
  }
  const todos = loadTodos();
  const newTodo = {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  todos.push(newTodo);
  saveTodos(todos);
  console.log(`Added todo #${todos.length}: ${newTodo.text}`);
}

function listTodos() {
  const todos = loadTodos();
  if (todos.length === 0) {
    console.log('No todos yet. Add one with: node todo.js add "Your task"');
    return;
  }
  console.log('Todos:');
  todos.forEach((todo, index) => {
    const status = todo.completed ? '[x]' : '[ ]';
    console.log(`  ${index + 1}. ${status} ${todo.text}`);
  });
}

function completeTodo(index) {
  const todos = loadTodos();
  if (todos.length === 0) {
    console.error('Error: No todos to complete');
    process.exit(1);
  }
  const idx = parseInt(index, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= todos.length) {
    console.error(`Error: Invalid todo number. Use 1-${todos.length}`);
    process.exit(1);
  }
  todos[idx].completed = true;
  saveTodos(todos);
  console.log(`Completed: ${todos[idx].text}`);
}

function showHelp() {
  console.log(`Todo CLI - Simple task manager

Usage:
  node todo.js add "Task description"  - Add a new todo
  node todo.js list                    - List all todos
  node todo.js complete <number>       - Mark a todo as done
  node todo.js help                    - Show this help

Examples:
  node todo.js add "Buy groceries"
  node todo.js list
  node todo.js complete 1`);
}

// Main CLI handler
const command = process.argv[2];
const arg = process.argv.slice(3).join(' ');

switch (command) {
  case 'add':
    addTodo(arg);
    break;
  case 'list':
    listTodos();
    break;
  case 'complete':
    completeTodo(arg);
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    showHelp();
    process.exit(0);
}
