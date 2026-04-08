// App.tsx or index.tsx
import React from 'react';
import AppWithTabs from './AppWithTabs';
// or import AppWithTabs from './components/TabContainer';

function App() {
  return (
    <div className="App">
      <TabContainer />
      {/* or <AppWithTabs /> */}
    </div>
  );
}

export default App;
