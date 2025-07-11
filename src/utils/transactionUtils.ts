import { v4 as uuidv4 } from 'uuid';

export const generateTransactionReference = (): string => {
  const prefix = 'TXN';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};