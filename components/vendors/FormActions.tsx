import React from 'react';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';

interface FormActionsProps {
  // Update the type to be more flexible to accommodate both Formik's handleSubmit and regular form event handlers
  onSave: (e?: React.FormEvent<any> | undefined) => void;
  onCancel: () => void;
  saveLabel: string;
}

const FormActions: React.FC<FormActionsProps> = ({ onSave, onCancel, saveLabel }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
      <ButtonFromTheme
        onClick={onCancel}
        outline={true}
        className="border border-[#16355D] dark:border-white text-[#16355D] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Cancel
      </ButtonFromTheme>
      <ButtonFromTheme
        onClick={onSave}
        className="bg-[#16355D] hover:bg-[#122A4B] text-white"
      >
        {saveLabel}
      </ButtonFromTheme>
    </div>
  );
};

export default FormActions;
