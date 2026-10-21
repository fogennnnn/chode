'use strict';

function summarize(rows) {
  if (!Array.isArray(rows)) {
    rows = [];
  }

  let incomeCents = 0;
  let expenseCents = 0;
  const byCategory = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const amountCents = row.amountCents;
    const category = row.category;

    if (typeof amountCents === 'number') {
      if (amountCents > 0) {
        incomeCents += amountCents;
      } else if (amountCents < 0) {
        expenseCents += Math.abs(amountCents);
      }
    }

    if (Object.prototype.hasOwnProperty.call(byCategory, category)) {
      byCategory[category] += amountCents;
    } else {
      Object.defineProperty(byCategory, category, {
        value: amountCents,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  }

  const balanceCents = incomeCents - expenseCents;

  return {
    incomeCents: incomeCents,
    expenseCents: expenseCents,
    balanceCents: balanceCents,
    byCategory: byCategory
  };
}

module.exports = { summarize };
