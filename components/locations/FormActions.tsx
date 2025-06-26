import React from 'react';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';

interface FormActionsProps {
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  isEdit?: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
  onSave,
  onCancel,
  saveLabel = 'Save Location',
  isEdit = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 px-4">
      <ButtonFromTheme
        onClick={onSave}
        className={`rounded-md hover:cursor-pointer text-white py-2 px-8 w-full sm:w-auto`}
      >
        {isEdit ? 'Update Location' : saveLabel}
      </ButtonFromTheme>
      <ButtonFromTheme
        outline={true}
        className={`rounded-md py-2 px-8 border hover:text-white w-full sm:w-auto`}
        onClick={onCancel}
      >
        Cancel
      </ButtonFromTheme>
    </div>
  );
};

export default FormActions;
