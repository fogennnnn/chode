#!/usr/bin/env node

const operation = process.argv[2];
const a = parseFloat(process.argv[3]);
const b = parseFloat(process.argv[4]);

if (!operation || isNaN(a) || isNaN(b)) {
  console.error('Usage: node app.js <add|subtract|multiply|divide> <num1> <num2>');
  process.exit(1);
}

let result;

switch (operation) {
  case 'add':
    result = a + b;
    break;
  case 'subtract':
    result = a - b;
    break;
  case 'multiply':
    result = a * b;
    break;
  case 'divide':
    if (b === 0) {
      console.error('Error: Division by zero');
      process.exit(1);
    }
    result = a / b;
    break;
  default:
    console.error(`Unknown operation: ${operation}`);
    console.error('Supported: add, subtract, multiply, divide');
    process.exit(1);
}

console.log(result);
