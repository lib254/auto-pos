import { Customer } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const generateCustomerCode = (existingCustomers: Customer[]): string => {
  const prefix = 'CUST';
  const nextNumber = (existingCustomers.length + 1).toString().padStart(4, '0');
  return `${prefix}${nextNumber}`;
};

export const validateCustomerImport = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = ['name', 'idNumber', 'phone', 'address'];

  data.forEach((row, index) => {
    requiredFields.forEach((field) => {
      if (!row[field]) {
        errors.push(`Row ${index + 1}: Missing ${field}`);
      }
    });

    if (row.previousBalance && isNaN(Number(row.previousBalance))) {
      errors.push(`Row ${index + 1}: Invalid previous balance`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const generateCustomerTemplate = (): string => {
  const headers = ['Full Name', 'ID No', 'Phone No', 'Address', 'Previous Balance'];
  const example = ['John Doe', 'ID123456', '+254712345678', '123 Main St', '1000'];

  return [headers.join(','), example.join(',')].join('\n');
};

export const parseCustomerCSV = (csv: string): any[] => {
  const lines = csv.split('\n').filter((line) => line.trim() !== ''); // Remove empty lines
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase()); // Normalize headers to lowercase

  const requiredHeaders = ['full name', 'id no', 'phone no', 'address', 'previous balance'];

  // Check for missing headers
  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error('CSV headers are incorrect or missing required fields.');
  }

  return lines.slice(1).map((line, rowIndex) => {
    const values = line.split(',').map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`Row ${rowIndex + 2}: Incorrect number of fields`);
    }

    const customer: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      switch (header) {
        case 'full name':
          customer.name = value;
          break;
        case 'id no':
          customer.idNumber = value;
          break;
        case 'phone no':
          customer.phone = value;
          break;
        case 'address':
          customer.address = value;
          break;
        case 'previous balance':
          customer.previousBalance = Number(value.replace(/[^0-9.-]+/g, '')) || 0; // Sanitize numeric values
          break;
      }
    });

    return customer;
  });
};

// Debugging function to test import process
export const testImport = (csv: string) => {
  try {
    const data = parseCustomerCSV(csv);
    console.log('Parsed Data:', data);

    const validation = validateCustomerImport(data);
    console.log('Validation Result:', validation);

    if (!validation.valid) {
      console.error('Errors:', validation.errors);
    } else {
      console.log('Import successful!');
    }
  } catch (error) {
    console.error('Import Error:', error.message);
  }
};
