import React from 'react';
import { FormikProps } from 'formik';
import Image from 'next/image';
import NumberInput from './NumberInput';
import bulls from 'assets/icons/bulls.svg';
import calves from 'assets/icons/calves.svg';
import cows from 'assets/icons/cows.svg';

interface AnimalCountFormProps {
  formik: FormikProps<any>;
  groupFieldClass: string;
  totalAnimals: number;
  totalActive: number;
  totalInactive: number;
}

const AnimalCountForm: React.FC<AnimalCountFormProps> = ({
  formik,
  groupFieldClass,
  totalAnimals,
  totalActive,
  totalInactive,
}) => {
  const animalInputField = ({ name, icon }) => (
    <div className="flex flex-col bg-[#F6FAFF] dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] p-6 flex-1 mb-4 sm:mb-0 sm:max-w-[50%]">
      <div className="flex gap-4 items-center justify-start">
        <div className="w-12 h-12 sm:w-20 sm:h-20 relative flex-shrink-0">
          <Image
            src={icon}
            alt={name}
            fill
            className="object-contain dark:text-white"
          />
        </div>
        <p className="text-poppins font-semibold text-[#17355D] dark:text-white">
          {name}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row mt-4 gap-4">
        <NumberInput
          name={`${name.toLowerCase()}Active`}
          formik={formik}
          title={'Active'}
        />
        <NumberInput
          name={`${name.toLowerCase()}Inactive`}
          formik={formik}
          title={'Inactive'}
        />
      </div>
      <div className="mt-6 font-medium text-left">
        {`Total ${name}: ${formik.values[`${name.toLowerCase()}Active`] + formik.values[`${name.toLowerCase()}Inactive`]}`}
      </div>
    </div>
  );

  return (
    <div className={groupFieldClass}>
      <div>
        <h2 className="text-poppins font-semibold">Animal Information</h2>
        <p className="text-[#464A53]">
          Please Enter the number of active animals
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 sm:flex-wrap">
        {animalInputField({ name: 'Bulls', icon: bulls.src })}
        {animalInputField({ name: 'Cows', icon: cows.src })}
        {animalInputField({ name: 'Calves', icon: calves.src })}
      </div>
      <div className="mt-6 py-4 px-8 font-medium text-left bg-[#F6FAFF] dark:bg-backgroundColor dark:border-borderColor dark:border rounded-[20px] flex flex-col">
        <p className="font-semibold">{`Total Animals: ${totalAnimals}`}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <p>{`Total Active Animals: ${totalActive}`}</p>
          <p className="hidden sm:block"> | </p>
          <p>{`Total Inactive Animals: ${totalInactive}`}</p>
        </div>
      </div>
    </div>
  );
};

export default AnimalCountForm;
