import { Product, category, NewProduct } from '../../../../types';
import ProductTable from './ProductTable';
import ProductForm from './ProductForm';
import Tabs from './Tabs';
interface ProductsTabProps {
  supplierId: String;
  products: Product[];
  categories: category[];
  newProduct: NewProduct;
  setNewProduct: (product: NewProduct) => void;
  handleProductSubmit: (e: React.FormEvent) => void;
}

export default function ProductsTab({
  supplierId,
  products,
  categories,
  newProduct,
  setNewProduct,
  handleProductSubmit
}: ProductsTabProps) {
  const tabs = [
    {
      id: 'Form',
      label: 'Form',
      content: (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Product</h3>
          <ProductForm
            supplierId={supplierId}
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            categories={categories}
            onProductAdded={() =>{
              console.log("trial");
            }}
          />
        </div>
      ),
    },
    {
      id: 'Data',
      label: 'Data',
      content: (
        <div className="lg:col-span-2">
          <ProductTable products={products} />
        </div>
      ),
    }
    ]
  
  return (
    <div className="p-4 m:p-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Tabs 
        tabs={tabs} 
        defaultTab="Form"
        className="max-w-4xl"
      />

 
      </div>
    </div>
  );
}
