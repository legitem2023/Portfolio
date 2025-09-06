import { Product, Category, NewProduct } from '../types/types';
import ProductTable from './ProductTable';
import ProductForm from './ProductForm';

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  newProduct: NewProduct;
  setNewProduct: (product: NewProduct) => void;
  handleProductSubmit: (e: React.FormEvent) => void;
}

export default function ProductsTab({
  products,
  categories,
  newProduct,
  setNewProduct,
  handleProductSubmit
}: ProductsTabProps) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          + Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductTable products={products} />
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Product</h3>
          <ProductForm
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            categories={categories}
            handleSubmit={handleProductSubmit}
          />
        </div>
      </div>
    </div>
  );
}
