
import ApiBillsComponent from './ApiBillsComponent';
import CreateApiBillForm from './CreateApiBillForm';
import { useState } from 'react';
import Tabs from './Tabs';
export default function ApiBillsTab() {
  const [showForm, setShowForm] = useState(false);

  const handleSuccess = (createdBill: any) => {
    console.log('Bill created:', createdBill);
    // You could update a list of bills here
  };
  const tabs = [
    {
      id: 'Form',
      label: 'Form',
      content: (
        <div className="bg-white shadow-md rounded-lg p-6">
          <CreateApiBillForm
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
            defaultService="AWS"
          />
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
    <div>
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
