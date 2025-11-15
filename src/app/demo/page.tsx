// app/demo/page.tsx
import CylindricalCarousel from '../components/CylindricalCarousel';

const DemoPage = () => {
  const carouselItems = [
    {
      id: 1,
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Slide 1</h3>
          <p>Beautiful 3D Carousel</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      id: 2,
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Slide 2</h3>
          <p>Smooth Animations</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      id: 3,
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Slide 3</h3>
          <p>3D Transformations</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
      id: 4,
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Slide 4</h3>
          <p>Cylindrical Layout</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
      id: 5,
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Slide 5</h3>
          <p>Interactive Navigation</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
      id: 6,
      content: (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Slide 6</h3>
          <p>Auto-play Feature</p>
        </div>
      ),
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white text-center mb-4">
          3D Cylindrical Carousel
        </h1>
        <p className="text-gray-300 text-center mb-12">
          A beautiful 3D cylindrical carousel with smooth animations
        </p>
        
        <CylindricalCarousel 
          items={carouselItems}
          autoPlay={true}
          autoPlayInterval={4000}
          showNavigation={true}
          className="mb-12"
        />

        <div className="max-w-2xl mx-auto bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• 3D cylindrical transformation</li>
            <li>• Smooth animations with Framer Motion</li>
            <li>• Auto-play functionality</li>
            <li>• Interactive navigation</li>
            <li>• Hover effects</li>
            <li>• Responsive design</li>
            <li>• Customizable items and styling</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
