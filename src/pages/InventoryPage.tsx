import { useState, useEffect } from 'react';
import { useInventory } from '../features/inventory/hooks/useInventory';
import { InventoryHeader } from '../features/inventory/components/InventoryHeader';
import { InventorySearch } from '../features/inventory/components/InventorySearch';
import { InventoryList } from '../features/inventory/components/InventoryList';
import { StockPurchaseModal } from '../components/inventory/StockPurchaseModal';
import { ProductModal } from '../components/inventory/ProductModal';
import { ProductImportModal } from '../components/inventory/ProductImportModal';

const InventoryPage = () => {
  const {
    products,
    suppliers,
    searchTerm,
    selectedProduct,
    setSearchTerm,
    setSelectedProduct,
    handleImportProducts,
    handleSaveProduct,
    handleStockPurchase,
    handleDeleteProduct
  } = useInventory();

  const [isStockPurchaseModalOpen, setIsStockPurchaseModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Number of products per page

  // Filtered products based on search term
  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || (product.category || '') === selectedCategory;
    return matchesSearch && matchesCategory;
});

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    // Reset search results if the search term is empty
    if (searchTerm === '') {
      setSearchTerm('');
    }
  }, [searchTerm, setSearchTerm]);

  const handleDelete = (productId: string) => {
    handleDeleteProduct(productId);
  }

  // Calculate summary metrics
  const summaryMetrics = {
  totalProducts: filteredProducts.length,
  lowStockProducts: filteredProducts.filter(product => 
    Number(product.quantity) < 5 // fallback: Number(undefined) is NaN, which is never < 5, so safe
  ).length,
  totalValue: filteredProducts.reduce((sum, product) => 
    sum + (Number(product.quantity) || 0) * (Number(product.price) || 0), 
    0
  )
};

  useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, selectedCategory]);

  return (
    <div>
      <InventoryHeader
        onAddProduct={() => setIsProductModalOpen(true)}
        onImport={() => setIsImportModalOpen(true)}
        onStockPurchase={() => setIsStockPurchaseModalOpen(true)}
      />

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4 mb-6">
          <InventorySearch
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <select 
          className="border rounded-lg px-4 py-2"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="engine">Engine Parts (Belts, Oil, Fillters etc)</option>
            <option value="brake">Brake System (Pads, Rubbers etc)</option>
            <option value="suspension">Suspension</option>
            <option value="electrical">Electrical (Wires, Solder etc)</option>
            <option value="body">Body Parts (Paints, Bulbs, Clips etc)</option>
          </select>
        </div>

        <InventoryList
          products={paginatedProducts}  // Use filtered products here
          onEdit={(product) => {
            setSelectedProduct(product);
            setIsProductModalOpen(true);
          }}
          onDelete={handleDelete}
        />
        <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
          {/* Pagination controls */}
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <span className="text-gray-600">
            Showing {summaryMetrics.totalProducts} products • 
            Total value: Ksh{summaryMetrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          {summaryMetrics.lowStockProducts > 0 && (
            <span className="text-red-600">
              {summaryMetrics.lowStockProducts} items with low stock
            </span>
          )}
        </div>
      </div>

      <StockPurchaseModal
        isOpen={isStockPurchaseModalOpen}
        onClose={() => setIsStockPurchaseModalOpen(false)}
        suppliers={suppliers}
        products={products}
        onPurchase={handleStockPurchase}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        suppliers={suppliers}
        onSave={handleSaveProduct}
      />

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportProducts}
      />
    </div>
  );
};

export default InventoryPage;
