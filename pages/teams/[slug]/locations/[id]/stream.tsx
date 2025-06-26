import { Loading } from '@/components/shared';
import { useWebvisData } from 'hooks/useWebvisData';
import { useGetLatestEntry } from 'hooks/useGetLatestEntry';
import {
  useStreamCounting,
  StreamErrorType,
  StreamError,
  isStreamError,
} from 'hooks/useStreamCounting';
import { WebvisStream } from '@/components/locations/WebvisStream';
import { useFormik } from 'formik';
import * as yup from 'yup';
import streamInputSchema from '@/lib/stream/streamInputSchema.json';
import { useState, useEffect, useRef } from 'react';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import { IoIosArrowBack } from 'react-icons/io';
import { getWebvisUrl } from '@/lib/config/webvis';
import { useVendors } from 'hooks/useVendors';

// Validation schema configuration
const getValidationSchemas: Record<string, yup.AnySchema> = {
  text: yup.string().required(),
  number: yup
    .number()
    .required()
    .transform((value) => (Number.isNaN(value) ? null : value))
    .nullable()
    .min(0, ''),
  date: yup
    .date()
    .required()
    .transform((value) => (Number.isNaN(value) ? null : value))
    .nullable()
    .typeError('Invalid date')
    .min(new Date('2023-09-01'), ''),
  boolean: yup.boolean().required(),
  select: yup.mixed().required(),
};

// Generate validation schema dynamically
const generateValidationSchema = (fields: any[]) =>
  yup.object().shape(
    fields.reduce<Record<string, yup.AnySchema>>((shape, { name, type }) => {
      if (type in getValidationSchemas) {
        shape[name] = getValidationSchemas[type];
      }
      return shape;
    }, {})
  );

const StreamViewer = () => {
  const router = useRouter();
  const { id: locationId, slug: teamSlug } = router.query;

  // Fetch vendors using the useVendors hook
  const { vendors, isLoading: vendorsLoading } = useVendors(teamSlug as string);
  const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');

  // Get WebVis URL from config instead of router query
  const WEBVIS_URL = getWebvisUrl('STREAM', locationId as string);

  const metadata = useWebvisData(WEBVIS_URL);
  const { data: latestEntry, isLoading, isError } = useGetLatestEntry(WEBVIS_URL);
  const [connectionError, setConnectionError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{
    message: string;
    type: string;
  } | null>(null);
  const isCounting = metadata?.is_counting ?? false;

  const handleStreamError = (error: StreamError) => {
    console.error(`Stream error (${error.type})`, error);
    // You could send this to your monitoring service here
  };

  const { startStopCounting } = useStreamCounting({
    onError: handleStreamError,
  });

  const validationSchema = generateValidationSchema(
    streamInputSchema.stream.inputFields
  );

  const formik = useFormik({
    initialValues: streamInputSchema.stream.inputFields.reduce(
      (values, field) => ({
        ...values,
        [field.name]: latestEntry
          ? latestEntry[field.name]
          : field.name === 'vendor_date' || field.name === 'vendorDate'
            ? new Date().toISOString().slice(0, 10)
            : '',
      }),
      {}
    ),
    validationSchema,
    onSubmit: async (values) => {
      setErrorDetails(null);
      try {
        await startStopCounting(isCounting, values);
        setConnectionError(false);
      } catch (error) {
        if (isStreamError(error)) {
          const streamError = error;
          setConnectionError(true);

          // Set user-friendly error message based on error type
          switch (streamError.type) {
            case StreamErrorType.NETWORK:
              setErrorDetails({
                type: 'connection',
                message:
                  'Unable to connect to the server. Please check your network connection.',
              });
              break;
            case StreamErrorType.SERVER:
              setErrorDetails({
                type: 'server',
                message: `The server encountered an issue${streamError.statusCode ? ` (${streamError.statusCode})` : ''}.`,
              });
              break;
            default:
              setErrorDetails({
                type: 'unknown',
                message:
                  'An unexpected error occurred. Please try again later.',
              });
          }
        } else {
          setConnectionError(true);
          setErrorDetails({
            type: 'unknown',
            message: 'An unexpected error occurred. Please try again later.',
          });
        }
      }
    },
  });

  // Handle vendor search input change
  const handleVendorInputChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const searchTerm = e.target.value;
    setVendorSearchTerm(searchTerm);
    formik.setFieldValue(fieldName, searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredVendors([]);
      setShowVendorSuggestions(false);
      return;
    }
    
    const filtered = vendors.filter(vendor => 
      vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredVendors(filtered);
    setShowVendorSuggestions(true);
  };

  // Handle vendor selection from dropdown
  const handleVendorSelect = (vendor: any, vendorNameField: string) => {
    // Set the vendor name in the form field
    formik.setFieldValue(vendorNameField, vendor.companyName);
    setVendorSearchTerm(vendor.companyName);
    
    // Find vendor_id field in schema and update its value
    const vendorIdField = streamInputSchema.stream.inputFields.find(
      field => field.name === 'vendor_id' || field.name === 'vendorId'
    );
    
    if (vendorIdField) {
      formik.setFieldValue(vendorIdField.name, vendor.id);
    }
    
    setShowVendorSuggestions(false);
  };

  useEffect(() => {
    if (isLoading) return;
    if (isError || connectionError) {
      console.error('Error fetching metadata or not connected to the stream.');
    }
  }, [isLoading, isError, connectionError]);

  return (
    /* eslint-disable i18next/no-literal-string */
    <div className="w-full max-w-5xl mx-auto p-6 z-0 py-5 lg:px-8">
      <header className="flex justify-between mb-8">
        <div className="flex items-start">
          <button
            onClick={() => router.back()}
            className="text-3xl mt-1 text-[#5E6C84]"
          >
            <IoIosArrowBack />
          </button>
          <div className="ml-2">
            <h1 className="text-4xl font-semibold font-montserrat">
              Stream Viewer
            </h1>
            <p className="text-[#5E6C84]">Live Animal Counting Stream</p>
          </div>
        </div>
      </header>

      {isLoading && <Loading />}

      {(isError || connectionError) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {errorDetails?.message ||
                  'Error connecting to the stream service.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={formik.handleSubmit}
        className="bg-white dark:bg-surfaceColor rounded-lg shadow-sm p-6 mb-6"
      >
        <h2 className="text-xl font-semibold mb-4">Stream Control</h2>

        {/* Group related fields together */}
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {streamInputSchema.stream.inputFields
              .filter((field) => field.type !== 'date')
              .map((field) => (
                <InputField 
                  key={field.name} 
                  field={field} 
                  formik={formik} 
                  vendors={vendors}
                  filteredVendors={filteredVendors}
                  showVendorSuggestions={showVendorSuggestions}
                  handleVendorInputChange={handleVendorInputChange}
                  handleVendorSelect={handleVendorSelect}
                />
              ))}
          </div>

          {/* Date field gets special treatment for better alignment */}
          <div className="pt-4 border-t border-gray-200 dark:border-borderColor mt-2">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {streamInputSchema.stream.inputFields
                .filter((field) => field.type === 'date')
                .map((field) => (
                  <div key={field.name} className="md:w-1/3">
                    <InputField field={field} formik={formik} />
                  </div>
                ))}

              <div className="md:ml-auto pt-4 md:pt-0">
                <ButtonFromTheme
                  onClick={formik.handleSubmit}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full md:w-auto"
                >
                  {isCounting ? 'Stop' : 'Start'} Counting
                </ButtonFromTheme>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-6 text-gray-500">
          <span className="text-sm">Scroll down to view the live stream</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </form>

      <div className="bg-white dark:bg-surfaceColor rounded-lg shadow-sm p-6 border border-gray-200 dark:border-borderColor">
        <h2 className="text-xl font-semibold mb-4">Live Stream</h2>
        <WebvisStream url={WEBVIS_URL} status={Boolean(metadata)} />
      </div>
    </div>
  );
};

// Updated InputField Component with vendor autocomplete
const InputField = ({ 
  field, 
  formik, 
  vendors, 
  filteredVendors, 
  showVendorSuggestions,
  handleVendorInputChange,
  handleVendorSelect
}: { 
  field: any; 
  formik: any;
  vendors?: any[];
  filteredVendors?: any[];
  showVendorSuggestions?: boolean;
  handleVendorInputChange?: (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => void;
  handleVendorSelect?: (vendor: any, fieldName: string) => void;
}) => {
  const isVendorField = field.name.toLowerCase().includes('vendor') && 
                        !field.name.toLowerCase().includes('vendor_id') && 
                        !field.name.toLowerCase().includes('vendorid') &&
                        !field.name.toLowerCase().includes('date');
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        if (showVendorSuggestions && handleVendorSelect) {
          // Keep the current input value but close the dropdown
          handleVendorSelect({ companyName: formik.values[field.name], id: '' }, field.name);
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVendorSuggestions, formik.values, field.name, handleVendorSelect]);

  return (
    <div className="mb-0 relative">
      <label
        className="block text-gray-700 dark:text-textColor text-sm font-bold mb-2"
        htmlFor={field.name}
      >
        {field.label}
      </label>
      
      {isVendorField && handleVendorInputChange && handleVendorSelect ? (
        <>
          <input
            type="text"
            name={field.name}
            id={field.name}
            value={formik.values[field.name]}
            onChange={(e) => handleVendorInputChange(e, field.name)}
            onBlur={formik.handleBlur}
            className="shadow-none appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-textColor dark:bg-surfaceColor dark:border-borderColor leading-tight focus:outline-none focus:shadow-outline bg-white"
            autoComplete="off"
          />
          
          {/* Vendor Suggestions Dropdown */}
          {showVendorSuggestions && filteredVendors && filteredVendors.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute z-10 mt-1 w-full bg-white dark:bg-surfaceColor border border-gray-200 dark:border-borderColor rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {filteredVendors.map((vendor) => (
                <div 
                  key={vendor.id}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleVendorSelect(vendor, field.name)}
                >
                  {vendor.companyName}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <input
          type={field.type === 'date' ? 'date' : field.type}
          name={field.name}
          id={field.name}
          value={formik.values[field.name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`shadow-none appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-textColor dark:bg-surfaceColor dark:border-borderColor leading-tight focus:outline-none focus:shadow-outline ${field.type === 'date' ? 'date-input' : 'bg-white'}`}
        />
      )}
      
      {formik.touched[field.name] && formik.errors[field.name] && (
        <div className="text-red-500 text-sm mt-1">
          {formik.errors[field.name]}
        </div>
      )}
    </div>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default StreamViewer;
