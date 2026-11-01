'use strict';

function isValidDate(dateStr) {
  // Must be YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  
  // Create date and check if it matches (catches invalid dates like Feb 30)
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  return true;
}

function parseAmount(amountStr) {
  // Must be decimal with at most two fractional digits
  if (!/^-?\d+(\.\d{1,2})?$/.test(amountStr)) {
    throw new Error('invalid amount');
  }
  // Parse to cents without floating point errors
  const sign = amountStr.startsWith('-') ? -1 : 1;
  const abs = amountStr.replace('-', '');
  const parts = abs.split('.');
  const whole = parts[0] === '' ? '0' : parts[0];
  let frac = parts[1] || '';
  while (frac.length < 2) frac += '0';
  frac = frac.slice(0, 2);
  const cents = sign * (parseInt(whole, 10) * 100 + parseInt(frac, 10));
  return cents;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
          continue;
        } else {
          // End of quotes
          inQuotes = false;
          i += 1;
          continue;
        }
      } else {
        current += char;
        i += 1;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i += 1;
        continue;
      } else if (char === ',') {
        result.push(current);
        current = '';
        i += 1;
        continue;
      } else {
        current += char;
        i += 1;
        continue;
      }
    }
  }
  
  if (inQuotes) {
    throw new Error('unclosed quote');
  }
  
  result.push(current);
  return result;
}

function parseCSV(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  // Remove BOM
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }
  
  // Split by lines (handle CRLF and LF)
  let lines = text.split(/\r\n|\r|\n/);
  
  // Remove empty last line if it results from trailing newline
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    // Check if original ended with newline
    if (text.endsWith('\n') || text.endsWith('\r')) {
      lines = lines.slice(0, -1);
    }
  }
  
  if (lines.length === 0) {
    return [];
  }
  
  const headerLine = lines[0];
  const headerFields = parseCSVLine(headerLine);
  
  // Must have exactly these 4 fields (order can vary)
  if (headerFields.length !== 4) {
    throw new Error('missing header');
  }
  
  const requiredFields = ['id', 'date', 'category', 'amount'];
  const fieldMap = {};
  for (let i = 0; i < headerFields.length; i++) {
    const field = headerFields[i];
    if (!requiredFields.includes(field)) {
      throw new Error('missing header');
    }
    fieldMap[field] = i;
  }
  
  // Ensure all required fields are present
  for (const req of requiredFields) {
    if (!(req in fieldMap)) {
      throw new Error('missing header');
    }
  }
  
  const rows = [];
  const seenIds = new Set();
  
  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    if (line === '') continue;
    
    const fields = parseCSVLine(line);
    
    if (fields.length !== 4) {
      throw new Error('wrong field count');
    }
    
    const id = fields[fieldMap['id']];
    const date = fields[fieldMap['date']];
    const category = fields[fieldMap['category']];
    const amountStr = fields[fieldMap['amount']];
    
    if (id === '' || id === undefined) {
      throw new Error('empty id');
    }
    if (category === '' || category === undefined) {
      throw new Error('empty category');
    }
    
    if (seenIds.has(id)) {
      throw new Error('duplicate ID');
    }
    seenIds.add(id);
    
    if (!isValidDate(date)) {
      throw new Error('invalid date');
    }
    
    const amountCents = parseAmount(amountStr);
    
    rows.push({
      id: id,
      date: date,
      category: category,
      amountCents: amountCents
    });
  }
  
  return rows;
}

module.exports = { parseCSV };
