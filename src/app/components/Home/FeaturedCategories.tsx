// components/FeaturedCategories.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { category } from '../../../../types';
import CategoryShimmer from '../CategoryShimmer';

interface FeaturedCategoriesProps {
  categories: category[];
  loading: boolean;
  title?: string;
  description?: string;
}

const FeaturedCategories: React.FC<FeaturedCategoriesProps> = ({
  categories,
  loading,
  title = "Shop by Category",
  description = "Discover our curated collections of luxury items, carefully selected to elevate your style and sophistication."
}) => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <CategoryShimmer count={4} />
          ) : (
            categories.map((category) => (
              <div key={category.id} className="group relative overflow-hidden rounded-2xl shadow-lg">
                <img 
                  src={category.image ? category.image : '/NoImage.webp'} 
                  alt={category.name}
                  className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                  <p className="text-gray-200 mb-4">{category.items}</p>
                  <button className="self-start text-white font-medium flex items-center">
                    Explore <ArrowRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
