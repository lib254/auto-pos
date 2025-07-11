import { Product } from '../types';

export const generateProductSKU = (category: string): string => {
  const prefix = category.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

export const validateProductImport = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredFields = ['name', 'category', 'price', 'quantity'];

  data.forEach((row, index) => {
    if (Object.values(row).every(value => !value)) {
      // Skip empty rows
      return;
    }

    requiredFields.forEach(field => {
      if (!row[field]) {
        errors.push(`Row ${index + 1}: Missing required field "${field}"`);
      }
    });

    // Validate numeric fields
    ['price', 'quantity'].forEach(field => {
      if (row[field] && isNaN(Number(row[field]))) {
        errors.push(`Row ${index + 1}: Field "${field}" must be a valid number`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

export const generateProductTemplate = (): string => {
  const headers = ['Name', 'Category', 'Description', 'Price', 'Initial Quantity', 'Supplier ID'];
  const example = ['Brake Pad', 'brake', 'High quality brake pads', '1500', '10', 'SUP001'];

  return [
    headers.join(','),
    example.join(',')
  ].join('\n');
};

export const parseProductCSV = (csv: string): any[] => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase()); // Normalize headers to lowercase

  return lines.slice(1).filter(line => line.trim()).map((line, index) => {
    const values = line.split(',').map(v => v.trim());
    const product: any = {};

    headers.forEach((header, idx) => {
      const value = values[idx] || ''; // Fallback for missing values
      switch (header) {
        case 'name':
          product.name = value;
          break;
        case 'category':
          product.category = value.toLowerCase();
          break;
        case 'description':
          product.description = value || 'No description provided';
          break;
        case 'price':
          product.price = value ? Number(value) : null;
          break;
        case 'initial quantity':
          product.quantity = value ? Number(value) : null;
          break;
        case 'supplier id':
          product.supplierId = value || 'Unknown';
          break;
      }
    });

    // Check for empty rows
    if (!product.name || !product.category) {
      console.warn(`Row ${index + 2}: Skipping incomplete product row`);
    }

    return product;
  });
};
