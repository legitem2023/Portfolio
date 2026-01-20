
import ApiBillsComponent from './ApiBillsComponent';
import Tabs from './Tabs';
export default function ApiBillsTab() {
  const tabs = [
    {
      id: 'Form',
      label: 'Form',
      content: (
        <div className="bg-white shadow-md rounded-lg p-6">
          
        </div>
      ),
    },
    {
      id: 'Data',
      label: 'Data',
      content: (
        <div className="lg:col-span-2">
          <ApiBillsComponent/>
        </div>
      ),
    }
    ]

  return (
    <div className="p-4 m:p-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">API Bills Management</h2>
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
