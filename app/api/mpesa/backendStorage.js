import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const MPESA_RESULTS_FILE = path.join(DATA_DIR, 'mpesaResults.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

export async function getItem(key) {
  try {
    if (key === 'mpesaResults') {
      if (!fs.existsSync(MPESA_RESULTS_FILE)) return {};
      const data = await fs.promises.readFile(MPESA_RESULTS_FILE, 'utf-8');
      return JSON.parse(data);
    } else if (key === 'transactions') {
      if (!fs.existsSync(TRANSACTIONS_FILE)) return [];
      const data = await fs.promises.readFile(TRANSACTIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    return key === 'transactions' ? [] : {};
  }
  return null;
}

export async function setItem(key, value) {
  if (key === 'mpesaResults') {
    await fs.promises.writeFile(MPESA_RESULTS_FILE, JSON.stringify(value, null, 2), 'utf-8');
    return true;
  } else if (key === 'transactions') {
    await fs.promises.writeFile(TRANSACTIONS_FILE, JSON.stringify(value, null, 2), 'utf-8');
    return true;
  }
  return false;
}

// Optional helpers for readability
export const getTransactions = () => getItem('transactions');
export const setTransactions = (data) => setItem('transactions', data);
