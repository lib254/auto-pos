import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { storage } from '../utils/storage';
import { Supplier, Transaction } from '../types';
import { SupplierModal } from '../components/suppliers/SupplierModal';
import { SupplierHistory } from '../components/suppliers/SupplierHistory';
import { DeleteConfirmationModal } from '../components/suppliers/DeleteConfirmationModal';
import { 
  generateSupplierCode, 
  generateSupplierTemplate, 
  parseSupplierCSV, 
  validateSupplierImport 
} from '../utils/supplierUtils';
import { v4 as uuidv4 } from 'uuid';

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    setSuppliers(storage.getSuppliers());
    setTransactions(storage.getTransactions());
  }, []);

  const handleDownloadTemplate = () => {
    const template = generateSupplierTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSuppliers = () => {
    const headers = ['Supplier Code', 'Company Name', 'Business ID', 'Phone No', 'Address'];
    const rows = suppliers.map(supplier => [
      supplier.code,
      supplier.name,
      supplier.idNumber,
      supplier.phone,
      supplier.address
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSuppliers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedSuppliers = parseSupplierCSV(text);
      const validation = validateSupplierImport(importedSuppliers);

      if (!validation.valid) {
        setImportError(validation.errors.join('\n'));
        return;
      }

      const newSuppliers = importedSuppliers.map(supplier => ({
        ...supplier,
        id: uuidv4(),
        code: generateSupplierCode(suppliers),
        email: '',
        createdAt: new Date().toISOString()
      }));

      const updatedSuppliers = [...suppliers, ...newSuppliers];
      storage.setSuppliers(updatedSuppliers);
      setSuppliers(updatedSuppliers);
      setImportError(null);
    } catch (error) {
      setImportError('Failed to import suppliers. Please check the file format.');
    }
  };

  const handleSaveSupplier = (supplierData: Partial<Supplier>) => {
    const isEdit = selectedSupplier !== null;
    
    if (isEdit && selectedSupplier) {
      const updatedSuppliers = suppliers.map(s => 
        s.id === selectedSupplier.id 
          ? { ...selectedSupplier, ...supplierData }
          : s
      );
      storage.setSuppliers(updatedSuppliers);
      setSuppliers(updatedSuppliers);
    } else {
      const newSupplier: Supplier = {
        id: uuidv4(),
        code: generateSupplierCode(suppliers),
        email: '',
        createdAt: new Date().toISOString(),
        ...supplierData as any
      };
      storage.setSuppliers([...suppliers, newSupplier]);
      setSuppliers(prev => [...prev, newSupplier]);
    }
    
    setIsAddModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleDeleteSupplier = () => {
    if (!selectedSupplier) return;
    
    const updatedSuppliers = suppliers.filter(s => s.id !== selectedSupplier.id);
    storage.setSuppliers(updatedSuppliers);
    setSuppliers(updatedSuppliers);
    setIsDeleteModalOpen(false);
    setSelectedSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Suppliers ({suppliers.length})
        </h1>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </button>
          <label className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Import Suppliers
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportSuppliers}
            />
          </label>
          <button
            onClick={handleExportSuppliers}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Suppliers
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Import Error:</p>
          <pre className="mt-2 text-sm whitespace-pre-wrap">{importError}</pre>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="relative flex-1 mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        <div className="h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onDoubleClick={() => {
                    setSelectedSupplier(supplier);
                    setIsHistoryModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>{supplier.phone}</div>
                    <div className="text-sm text-gray-500">{supplier.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{supplier.idNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-3">
                    <button
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setIsAddModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onSave={handleSaveSupplier}
      />

      {selectedSupplier && (
        <>
          <SupplierHistory
            isOpen={isHistoryModalOpen}
            onClose={() => {
              setIsHistoryModalOpen(false);
              setSelectedSupplier(null);
            }}
            supplier={selectedSupplier}
            transactions={transactions}
          />

          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedSupplier(null);
            }}
            onConfirm={handleDeleteSupplier}
            supplierName={selectedSupplier.name}
          />
        </>
      )}
    </div>
  );
};

export default SuppliersPage;