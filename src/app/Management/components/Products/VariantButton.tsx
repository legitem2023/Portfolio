import { Variant } from '../../../../../types';

interface VariantButtonProps {
  variants?: Variant[];
  onClick: () => void;
}

export default function VariantButton({ variants, onClick }: VariantButtonProps) {
  const variantCount = variants?.length || 0;
  
  return (
    <button
      onClick={onClick}
      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium underline"
    >
      View {variantCount} variant{variantCount !== 1 ? 's' : ''}
    </button>
  );
}
