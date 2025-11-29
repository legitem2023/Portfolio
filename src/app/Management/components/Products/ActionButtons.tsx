interface ActionButtonsProps {
  productId: string;
  onDelete: (id: string) => void;
}

export default function ActionButtons({ productId, onDelete }: ActionButtonsProps) {
  return (
    <div className="flex space-x-3">
      <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
        Edit
      </button>
      <button 
        onClick={() => onDelete(productId)} 
        className="text-red-600 hover:text-red-900 text-sm font-medium"
      >
        Delete
      </button>
    </div>
  );
}
