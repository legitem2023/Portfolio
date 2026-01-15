interface PriceDisplayProps {
  price: number;
  salePrice?: number;
}

function formatToPeso(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function PriceDisplay({ price, salePrice }: PriceDisplayProps) {
  return (
    <div className="text-sm text-gray-500">
      {salePrice ? (
        <div className="flex items-center space-x-2">
          <span className="text-red-600 font-semibold">
            {formatToPeso(salePrice)}
          </span>
          <span className="text-gray-400 line-through">
            {formatToPeso(price)}
          </span>
        </div>
      ) : (
        <span>{formatToPeso(price)}</span>
      )}
    </div>
  );
}
