import React, { useState } from 'react';
import { X, Upload, Download } from 'lucide-react';
import { generateProductTemplate, parseProductCSV, validateProductImport } from '../../utils/productUtils';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (products: Product[]) => void;
}

export const ProductImportModal: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = generateProductTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedProducts = parseProductCSV(text);
      const validation = validateProductImport(importedProducts);

      if (!validation.valid) {
        setImportError(validation.errors.join('\n'));
        return;
      }

      const products = importedProducts.map(product => ({
        ...product,
        id: uuidv4(),
        createdAt: new Date().toISOString()
      }));

      onImport(products);
      onClose();
      setImportError(null);
    } catch (error) {
      setImportError('Failed to import products. Please check the file format.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Import Products</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </button>
          </div>

          <div>
            <label className="flex items-center w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Import Products
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>

          {importError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 whitespace-pre-wrap">{importError}</p>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-medium mb-2">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Download the template CSV file</li>
              <li>Fill in your product data following the template format</li>
              <li>Save the file and import it using the button above</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};