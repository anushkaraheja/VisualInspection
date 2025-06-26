import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const TogglePasswordVisibility = ({
  isPasswordVisible,
  handlePasswordVisibility,
}) => {
  return (
    <button
      onClick={handlePasswordVisibility}
      className="flex pointer items-center text-white absolute right-3 top-[50px]"
      type="button"
    >
      {!isPasswordVisible ? (
        <EyeIcon className="h-6 w-4 text-[#BA5CFF]" />
      ) : (
        <EyeSlashIcon className="h-6 w-4 text-[#BA5CFF]" />
      )}
    </button>
  );
};

export default TogglePasswordVisibility;
