const fs = require('fs');
const args = process.argv.slice(2);
const expensesFile = 'expenses.json';
let expenses = [];
try {
  expenses = JSON.parse(fs.readFileSync(expensesFile, 'utf8'));
} catch (err) {
  // File does not exist or is empty
}

let command = args[0];
switch (command) {
  case 'add':
    const amount = parseFloat(args[args.indexOf('--amount') + 1]);
const category = args[args.indexOf('--category') + 1];
const date = args[args.indexOf('--date') + 1];
const note = args[args.indexOf('--note') + 1];
if (isNaN(amount) || amount <= 0) {
  console.error('Invalid amount');
  process.exit(1);
}
if (!category) {
  console.error('Missing category');
  process.exit(1);
}
if (!date) {
  console.error('Missing date');
  process.exit(1);
}
const expense = {
  id: Date.now(),
  amount: Math.round(amount * 100),
  category,
  date,
  note
};
expenses.push(expense);
fs.writeFileSync(expensesFile, JSON.stringify(expenses, null, 2));
    break;
  case 'list':
    if (args.includes('--json')) {
  console.log(JSON.stringify(expenses, null, 2));
} else {
  expenses.forEach(expense => {
    console.log(`ID: ${expense.id}, Amount: ${expense.amount / 100}, Category: ${expense.category}, Date: ${expense.date}, Note: ${expense.note}`);
  });
}
    break;
  case 'summary':
    const totalAmount = expenses.reduce((acc, expense) => acc + expense.amount, 0);
const categories = {};
expenses.forEach(expense => {
  if (!categories[expense.category]) {
    categories[expense.category] = 0;
  }
  categories[expense.category] += expense.amount;
});
if (args.includes('--json')) {
  console.log(JSON.stringify({ totalAmount: totalAmount / 100, categories }, null, 2));
} else {
  console.log(`Total Amount: ${totalAmount / 100}`);
  Object.keys(categories).forEach(category => {
    console.log(`Category: ${category}, Amount: ${categories[category] / 100}`);
  });
}
    break;
  case 'export':
    const csv = expenses.map(expense => `${expense.id},${expense.amount / 100},${expense.category},${expense.date},${expense.note}`).join('\n');
console.log(csv);
    break;
  default:
    console.error('Unknown command');
    process.exit(1);
}
