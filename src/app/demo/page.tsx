// app/demo/page.tsx
import CylindricalCarousel from '../components/CylindricalCarousel';

const DemoPage = () => {
  const carouselItems = [
    {
      id: 1,
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">1</span>
          </div>
          <h3 className="text-2xl font-bold mb-3">Front View</h3>
          <p className="text-white/80">Center position</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 2,
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">2</span>
          </div>
          <h3 className="text-2xl font-bold mb-3">Right Side</h3>
          <p className="text-white/80">Rotated view</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 3,
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">3</span>
          </div>
          <h3 className="text-2xl font-bold mb-3">Back View</h3>
          <p className="text-white/80">Farthest position</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 4,
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">4</span>
          </div>
          <h3 className="text-2xl font-bold mb-3">Left Side</h3>
          <p className="text-white/80">Rotated view</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      id: 5,
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">5</span>
          </div>
          <h3 className="text-2xl font-bold mb-3">Right Back</h3>
          <p className="text-white/80">Angled view</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      id: 6,
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold">6</span>
          </div>
          <h3 className="text-2xl font-bold mb-3">Left Back</h3>
          <p className="text-white/80">Angled view</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold text-white text-center mb-6">
          3D Cylindrical Carousel
        </h1>
        <p className="text-gray-300 text-center text-lg mb-12 max-w-2xl mx-auto">
          Experience true 3D cylindrical rotation with smooth animations and depth effects
        </p>
        
        <CylindricalCarousel 
          items={carouselItems}
          autoPlay={true}
          autoPlayInterval={3500}
          showNavigation={true}
          className="mb-16"
        />

        <div className="max-w-4xl mx-auto bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-white/10">
          <h2 className="text-3xl font-bold text-white mb-6">Cylindrical Features</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">3D Effects</h3>
              <ul className="space-y-2">
                <li>• True cylindrical rotation</li>
                <li>• Depth-based scaling</li>
                <li>• Perspective transforms</li>
                <li>• Smooth 3D transitions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Interactions</h3>
              <ul className="space-y-2">
                <li>• Hover depth effects</li>
                <li>• Auto-rotation</li>
                <li>• Click navigation</li>
                <li>• Touch friendly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
