#!/usr/bin/env node

const a = Number(process.argv[2]);
const b = Number(process.argv[3]);

if (Number.isNaN(a) || Number.isNaN(b)) {
  console.error("Usage: node add.js <number1> <number2>");
  process.exit(1);
}

console.log(a + b);
