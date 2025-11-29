interface PriceDisplayProps {
  price: number;
  salePrice?: number;
}

export default function PriceDisplay({ price, salePrice }: PriceDisplayProps) {
  return (
    <div className="text-sm text-gray-500">
      {salePrice ? (
        <div className="flex items-center space-x-2">
          <span className="text-red-600 font-semibold">${salePrice}</span>
          <span className="text-gray-400 line-through">${price}</span>
        </div>
      ) : (
        <span>${price}</span>
      )}
    </div>
  );
}
