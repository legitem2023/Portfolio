import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_API_BILL_MUTATION, ApiBillInput } from '../../components/graphql/mutation';

interface CreateApiBillFormProps {
  onSuccess?: (createdBill: any) => void;
  onCancel?: () => void;
  defaultService?: string;
}

const CreateApiBillForm: React.FC<CreateApiBillFormProps> = ({
  onSuccess,
  onCancel,
  defaultService = ''
}) => {
  // Basic form state
  const [formData, setFormData] = useState({
    service: defaultService,
    apiName: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
    currency: 'USD',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invoiceId: '',
    invoiceUrl: '',
    tags: '',
  });

  // Usage form state
  const [usageData, setUsageData] = useState({
    requests: 0,
    successful: 0,
    failed: 0,
    dataProcessed: 0,
    rate: 0,
    customFieldsJson: '{}',
  });

  const [includeUsage, setIncludeUsage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [createApiBill] = useMutation(CREATE_API_BILL_MUTATION);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('usage.')) {
      const usageField = name.replace('usage.', '');
      setUsageData(prev => ({
        ...prev,
        [usageField]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.service.trim()) {
      newErrors.service = 'Service is required';
    }
    
    if (!formData.apiName.trim()) {
      newErrors.apiName = 'API name is required';
    }
    
    if (formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Month must be between 1 and 12';
    }
    
    if (formData.year < 2000 || formData.year > 2100) {
      newErrors.year = 'Year must be between 2000 and 2100';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    // Validate due date
    const dueDate = new Date(formData.dueDate);
    if (isNaN(dueDate.getTime())) {
      newErrors.dueDate = 'Invalid due date';
    }

    // Validate custom fields JSON
    if (includeUsage) {
      try {
        JSON.parse(usageData.customFieldsJson);
      } catch (error) {
        newErrors['usage.customFields'] = 'Invalid JSON format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Prepare tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Prepare usage data if included
      let usage = undefined;
      if (includeUsage) {
        usage = {
          requests: usageData.requests,
          successful: usageData.successful,
          failed: usageData.failed,
          dataProcessed: usageData.dataProcessed,
          rate: usageData.rate,
          customFields: JSON.parse(usageData.customFieldsJson),
        };
      }

      // Create new bill
      const createInput: ApiBillInput = {
        service: formData.service,
        apiName: formData.apiName,
        month: formData.month,
        year: formData.year,
        amount: formData.amount,
        currency: formData.currency,
        dueDate: formData.dueDate,
        invoiceId: formData.invoiceId || undefined,
        invoiceUrl: formData.invoiceUrl || undefined,
        tags,
        usage,
      };

      const { data } = await createApiBill({
        variables: {
          input: createInput,
        },
      });

      // Success!
      setSuccessMessage(`API bill for ${formData.service} created successfully!`);
      
      // Reset form
      setFormData({
        service: defaultService,
        apiName: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: 0,
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        invoiceId: '',
        invoiceUrl: '',
        tags: '',
      });
      setUsageData({
        requests: 0,
        successful: 0,
        failed: 0,
        dataProcessed: 0,
        rate: 0,
        customFieldsJson: '{}',
      });
      setIncludeUsage(false);

      // Call success callback
      if (onSuccess && data?.createApiBill) {
        onSuccess(data.createApiBill);
      }

    } catch (error: any) {
      console.error('Error creating API bill:', error);
      
      // Handle specific error types
      if (error.message.includes('already exists')) {
        setErrors({ duplicate: 'A bill with these details already exists' });
      } else if (error.message.includes('VALIDATION_ERROR')) {
        setErrors({ validation: 'Please check your input values' });
      } else {
        setErrors({ general: 'Failed to create API bill. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      service: defaultService,
      apiName: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: 0,
      currency: 'USD',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      invoiceId: '',
      invoiceUrl: '',
      tags: '',
    });
    setUsageData({
      requests: 0,
      successful: 0,
      failed: 0,
      dataProcessed: 0,
      rate: 0,
      customFieldsJson: '{}',
    });
    setIncludeUsage(false);
    setErrors({});
    setSuccessMessage('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New API Bill</h2>
        <p className="text-gray-600 mt-1">Track API service costs and usage metrics</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {errors.duplicate && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">{errors.duplicate}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Provider *
              </label>
              <input
                type="text"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.service ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., AWS, Stripe, Twilio"
                required
              />
              {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Name *
              </label>
              <input
                type="text"
                name="apiName"
                value={formData.apiName}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.apiName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Payments, S3 Storage, SMS"
                required
              />
              {errors.apiName && <p className="text-red-500 text-xs mt-1">{errors.apiName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month *
              </label>
              <select
                name="month"
                value={formData.month}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.month ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="2000"
                max="2100"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.year ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
              </div>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.dueDate ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice ID (Optional)
              </label>
              <input
                type="text"
                name="invoiceId"
                value={formData.invoiceId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="INV-2024-001"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice URL (Optional)
              </label>
              <input
                type="url"
                name="invoiceUrl"
                value={formData.invoiceUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://invoice.example.com/..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated, optional)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="cloud, payments, api, monthly"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>
          </div>
        </div>

        {/* Usage Metrics Section */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Usage Metrics (Optional)</h3>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeUsage}
                onChange={(e) => setIncludeUsage(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Include usage metrics</span>
            </label>
          </div>

          {includeUsage && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Requests
                  </label>
                  <input
                    type="number"
                    name="usage.requests"
                    value={usageData.requests}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Successful Requests
                  </label>
                  <input
                    type="number"
                    name="usage.successful"
                    value={usageData.successful}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Failed Requests
                  </label>
                  <input
                    type="number"
                    name="usage.failed"
                    value={usageData.failed}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Processed (MB)
                  </label>
                  <input
                    type="number"
                    name="usage.dataProcessed"
                    value={usageData.dataProcessed}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (per 1000 requests)
                  </label>
                  <input
                    type="number"
                    name="usage.rate"
                    value={usageData.rate}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Fields (JSON)
                  </label>
                  <textarea
                    name="usage.customFields"
                    value={usageData.customFieldsJson}
                    onChange={(e) => setUsageData(prev => ({
                      ...prev,
                      customFieldsJson: e.target.value
                    }))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono text-sm ${
                      errors['usage.customFields'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder='{"region": "us-east-1", "plan": "pro"}'
                  />
                  {errors['usage.customFields'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['usage.customFields']}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={isSubmitting}
            >
              Reset Form
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Bill...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Create API Bill
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateApiBillForm;
