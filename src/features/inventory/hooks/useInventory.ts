import { useState, useEffect } from 'react';
import { Product, Supplier } from '../../../types';
import { storage } from '../../../utils/storage';

export const useInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    setProducts(storage.getProducts());
    setSuppliers(storage.getSuppliers());
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportProducts = (importedProducts: Product[]) => {
    const updatedProducts = [...products, ...importedProducts];
    storage.setProducts(updatedProducts);
    setProducts(updatedProducts);
  };

  const handleSaveProduct = (productData: Product) => {
    const isEdit = selectedProduct !== null;
    
    if (isEdit) {
      const updatedProducts = products.map(p => 
        p.id === productData.id ? productData : p
      );
      storage.setProducts(updatedProducts);
      setProducts(updatedProducts);
    } else {
      storage.setProducts([...products, productData]);
      setProducts(prev => [...prev, productData]);
    }
  };

  const handleStockPurchase = (purchase: any) => {
    const updatedProducts = products.map(product => {
      if (product.id === purchase.items[0].productId) {
        return {
          ...product,
          quantity: product.quantity + purchase.items[0].quantity,
          costPrice: purchase.items[0].price  // Only update the cost price
          // Removed the 'price' update to preserve the selling price
        };
      }
      return product;
    });

    const transactions = storage.getTransactions();
    storage.setTransactions([...transactions, purchase]);
    storage.setProducts(updatedProducts);
    setProducts(updatedProducts);
  };

  const handleDeleteProduct = (productId: string) => {
    const updatedProducts = products.filter(product => product.id !== productId);
    storage.setProducts(updatedProducts);
    setProducts(updatedProducts);
  };

  return {
    products: filteredProducts,
    suppliers,
    searchTerm,
    selectedProduct,
    setSearchTerm,
    setSelectedProduct,
    handleImportProducts,
    handleSaveProduct,
    handleStockPurchase,
    handleDeleteProduct
  };
};