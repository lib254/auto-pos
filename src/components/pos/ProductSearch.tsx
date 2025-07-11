import React from 'react';
import { Search } from 'lucide-react';
import { Product } from '../../types';

interface Props {
  onSelect: (product: Product) => void;
  products: Product[];
}

export const ProductSearch: React.FC<Props> = ({ onSelect, products }) => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Product[]>([]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    const filtered = products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(value.toLowerCase());
      const skuMatch = product.sku && product.sku.toLowerCase().includes(value.toLowerCase());

      return nameMatch || skuMatch;
    });
    setResults(filtered);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          placeholder="Search products..."
        />
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map(product => (
            <button
              key={product.id}
              onClick={() => {
                onSelect(product);
                setQuery('');
                setResults([]);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-600">{product.sku || 'No SKU'}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Ksh{product.price.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Stock: {product.quantity}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
