import { Supplier } from '../types';

export const generateSupplierCode = (existingSuppliers: Supplier[]): string => {
  const prefix = 'SUP';
  const nextNumber = (existingSuppliers.length + 1).toString().padStart(4, '0');
  return `${prefix}${nextNumber}`;
};

export const validateSupplierImport = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = ['name', 'idNumber', 'phone', 'address'];

  data.forEach((row, index) => {
    requiredFields.forEach((field) => {
      if (!row[field]) {
        errors.push(`Row ${index + 1}: Missing ${field}`);
      }
    });

    if (row.phone && !/^\+?\d{7,15}$/.test(row.phone)) {
      errors.push(`Row ${index + 1}: Invalid phone number format`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const generateSupplierTemplate = (): string => {
  const headers = ['Full Name', 'ID No', 'Phone No', 'Address'];
  const example = ['ABC Auto Parts Ltd', 'BUS123456', '+254712345678', '123 Industrial Area'];

  return [headers.join(','), example.join(',')].join('\n');
};

export const parseSupplierCSV = (csv: string): any[] => {
  const lines = csv.split('\n').filter((line) => line.trim() !== ''); // Remove empty lines
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase()); // Normalize headers to lowercase

  const requiredHeaders = ['full name', 'id no', 'phone no', 'address'];

  // Check for missing headers
  if (!requiredHeaders.every((header) => headers.includes(header))) {
    throw new Error('CSV headers are incorrect or missing required fields.');
  }

  return lines.slice(1).map((line, rowIndex) => {
    const values = line.split(',').map((v) => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`Row ${rowIndex + 2}: Incorrect number of fields`);
    }

    const supplier: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      switch (header) {
        case 'full name':
          supplier.name = value;
          break;
        case 'id no':
          supplier.idNumber = value;
          break;
        case 'phone no':
          supplier.phone = value;
          break;
        case 'address':
          supplier.address = value;
          break;
      }
    });

    return supplier;
  });
};

// Debugging function to test the import process
export const testImport = (csv: string) => {
  try {
    const data = parseSupplierCSV(csv);
    console.log('Parsed Data:', data);

    const validation = validateSupplierImport(data);
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
