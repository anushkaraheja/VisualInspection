import { useState } from 'react';
import { Input, Modal, Select, Textarea } from 'react-daisyui';
import { CreateLicenseData, RenewalPeriod } from 'types/license';
import ButtonFromTheme from '../shared/ButtonFromTheme';

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamSlug: string;
  onSuccess: () => void;
}

export const CreateLicenseModal = ({
  isOpen,
  onClose,
  teamSlug,
  onSuccess,
}: CreateLicenseModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateLicenseData>({
    name: '',
    description: '',
    price: 0,
    type: '',
    features: [],
    renewalPeriod: RenewalPeriod.ANNUALLY,
    maxUsers: undefined,
    maxLocations: undefined,
    metadata: {},
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'price'
          ? parseFloat(value) || 0
          : name === 'maxUsers' || name === 'maxLocations'
            ? parseInt(value) || undefined
            : value,
    }));
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const features = e.target.value
      .split('\n')
      .filter((line) => line.trim() !== '');
    setFormData((prev) => ({
      ...prev,
      features,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teams/${teamSlug}/licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create license');
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating license:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Create New License">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              License Name
            </label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enterprise License"
            />
          </div>

          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              License Type
            </label>
            <Input
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              placeholder="Enterprise"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              placeholder="A comprehensive license for enterprise users"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Price
            </label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label
              htmlFor="renewalPeriod"
              className="block text-sm font-medium text-gray-700"
            >
              Renewal Period
            </label>
            <Select
              id="renewalPeriod"
              name="renewalPeriod"
              value={formData.renewalPeriod}
              onChange={handleChange}
              required
            >
              <option value={RenewalPeriod.MONTHLY}>Monthly</option>
              <option value={RenewalPeriod.QUARTERLY}>Quarterly</option>
              <option value={RenewalPeriod.SEMIANNUALLY}>Semi-Annually</option>
              <option value={RenewalPeriod.ANNUALLY}>Annually</option>
              <option value={RenewalPeriod.BIANNUALLY}>Bi-Annually</option>
            </Select>
          </div>

          <div>
            <label
              htmlFor="features"
              className="block text-sm font-medium text-gray-700"
            >
              Features (one per line)
            </label>
            <Textarea
              id="features"
              name="features"
              value={formData.features?.join('\n') || ''}
              onChange={handleFeaturesChange}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="maxUsers"
                className="block text-sm font-medium text-gray-700"
              >
                Max Users
              </label>
              <Input
                id="maxUsers"
                name="maxUsers"
                type="number"
                min="0"
                value={formData.maxUsers || ''}
                onChange={handleChange}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label
                htmlFor="maxLocations"
                className="block text-sm font-medium text-gray-700"
              >
                Max Locations
              </label>
              <Input
                id="maxLocations"
                name="maxLocations"
                type="number"
                min="0"
                value={formData.maxLocations || ''}
                onChange={handleChange}
                placeholder="Unlimited"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <ButtonFromTheme
            outline={true}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </ButtonFromTheme>
          <ButtonFromTheme type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create License'}
          </ButtonFromTheme>
        </div>
      </form>
    </Modal>
  );
};
