import { Input, InputProps } from 'react-daisyui';

interface InputWithLabelProps extends InputProps {
  label: string | React.ReactNode;
  error?: string;
  descriptionText?: string;
  isAuth?: boolean;
}

const InputWithLabel = (props: InputWithLabelProps) => {
  const { label, error, descriptionText, isAuth, ...rest } = props;

  // Define classes based on isAuth and error
  const classes = [
    'text-sm',
  ];
  
  if (isAuth) {
    classes.push('bg-black', 'text-white', 'border-gray-700', 'rounded-3xl');
  } else {
    classes.push('dark:bg-surfaceColor', 'dark:border-borderColor', 'dark:border');
  }
  
  if (error) {
    classes.push('input-error');
  }

  return (
    <div className="form-control w-full">
      {typeof label === 'string' ? (
        <label className="label">
          <span className={`label-text ${isAuth ? 'text-white' : 'dark:text-textColor'}`}>
            {label}
          </span>
        </label>
      ) : (
        label
      )}
      <Input className={classes.join(' ')} {...rest} />
      {(error || descriptionText) && (
        <label className="label">
          <span className={`label-text-alt ${error ? 'text-red-500' : ''}`}>
            {error || descriptionText}
          </span>
        </label>
      )}
    </div>
  );
};

export default InputWithLabel;
