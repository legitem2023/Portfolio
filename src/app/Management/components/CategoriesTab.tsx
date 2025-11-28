import { Category, NewCategory } from '../types/types';
import CategoryTable from './CategoryTable';
import CategoryForm from './CategoryForm';
import Tabs from './Tabs';
interface CategoriesTabProps {
  categories: Category[];
  newCategory: NewCategory;
  setNewCategory: (category: NewCategory) => void;
  handleCategorySubmit: (e: React.FormEvent) => void;
}

export default function CategoriesTab({
  categories,
  newCategory,
  setNewCategory,
  handleCategorySubmit
}: CategoriesTabProps) {

  const tabs = [
    {
      id: 'Form',
      label: 'Form',
      content: (
        <div className="bg-white shadow-md rounded-lg p-6">
          <CategoryForm
            newCategory={newCategory}
            setNewCategory={setNewCategory}
            categories={categories}
            onCategoryAdded={() => {
              console.log("c");
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
          <CategoryTable categories={categories} />
        </div>
      ),
    }
    ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
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
