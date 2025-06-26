import React, { useState, useEffect } from 'react';
import { FormikProps } from 'formik';
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io';

interface NumberInputProps {
  name: string;
  formik: FormikProps<any>;
  title: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ name, formik, title }) => {
  const [value, setValue] = useState(formik.values[name] || 0);

  useEffect(() => {
    setValue(formik.values[name] || 0);
  }, [formik.values[name]]);

  const handleIncrement = () => {
    const newValue = value + 1;
    setValue(newValue);
    formik.setFieldValue(name, newValue);
  };

  const handleDecrement = () => {
    const newValue = value > 0 ? value - 1 : 0;
    setValue(newValue);
    formik.setFieldValue(name, newValue);
  };

  return (
    <div className="text-left text-[#5E6C84] flex flex-col flex-1">
      {title}
      <div className="flex items-center border border-[#707070] rounded overflow-hidden w-full sm:w-[120px]">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const newValue = Number(e.target.value);
            setValue(newValue);
            formik.setFieldValue(name, newValue);
          }}
          className="w-full bg-[#218DFA00] font-semibold text-xl placeholder:font-semibold outline-none text-center border-r"
        />
        <div className="flex flex-col">
          <button
            type="button"
            onClick={handleIncrement}
            className="px-2 bg-gray-200 hover:bg-gray-300 text-sm flex justify-center items-center border rounded-tr"
          >
            <IoIosArrowUp />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            className="px-2 bg-gray-200 hover:bg-gray-300 text-sm flex justify-center items-center"
          >
            <IoIosArrowDown />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NumberInput;
