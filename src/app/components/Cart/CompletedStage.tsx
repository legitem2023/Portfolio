interface CompletedStageProps {
  onContinueShopping: () => void;
}

const CompletedStage = ({ onContinueShopping }: CompletedStageProps) => {
  return (
    <div className="text-center py-8">
      <div className="text-5xl text-amber-500 mb-5">
        <i className="fas fa-check-circle"></i>
      </div>
      <h2 className="text-2xl font-serif font-bold text-amber-900 mb-3">Order Placed Successfully!</h2>
      <p className="text-amber-700 mb-6 max-w-md mx-auto">Thank you for your purchase. Your order has been placed and will be processed shortly.</p>
      <button 
        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-md"
        onClick={onContinueShopping}
      >
        Continue Shopping
      </button>
    </div>
  );
};

export default CompletedStage;
