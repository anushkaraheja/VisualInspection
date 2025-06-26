import { useEffect, useState } from 'react';
import { Table } from '@/components/shared/table/Table';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { subDays } from 'date-fns';
import { toZonedTime, format } from 'date-fns-tz';
import ExportToCSVButton from '@/components/shared/ExportToCSVButton';
import ButtonFromTheme from '@/components/shared/ButtonFromTheme';
import { WithLoadingAndError } from '@/components/shared';
import { useLocationDetails } from 'hooks/useLocationHooks';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { IoIosArrowBack } from 'react-icons/io';
import { getWebvisUrl } from '@/lib/config/webvis';

const fetchTableData = async (query, webvisUrl) => {
  const { page, pageSize, filters } = query;
  const params = new URLSearchParams();
  if (page) params.append('page', page.toString());
  if (pageSize) params.append('page_size', pageSize.toString());
  if (filters) {
    Object.keys(filters).forEach((key) => {
      if (key === 'start' || key === 'end') {
        params.append(
          key,
          format(
            toZonedTime(
              filters[key],
              Intl.DateTimeFormat().resolvedOptions().timeZone
            ),
            "yyyy-MM-dd'T'HH:mm:ssXXX"
          )
        );
      } else {
        params.append(key, filters[key]);
      }
    });
  }
  const response = await fetch(`${webvisUrl}/data?${params.toString()}`);
  const data = await response.json();
  return data;
};

const HistoryPage = () => {
  const router = useRouter();
  const { slug, id } = router.query as { slug: string; id: string };

  // Get WebVis URL from config instead of router query
  const WEBVIS_URL = getWebvisUrl('DATA', id);

  const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  interface TableData {
    id: number;
    start: string;
    end: string;
    vendor_date: string;
    code: string;
    vendor: string;
    count: number;
  }

  const [data, setData] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { locationDetails } = useLocationDetails(slug as string, id as string);
  const [isError, setIsError] = useState(false);
  const [page, setPage] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    start: toZonedTime(subDays(new Date(), 1), TZ),
    end: toZonedTime(new Date(), TZ),
  });
  const [startDate, setStartDate] = useState(filters.start);
  const [endDate, setEndDate] = useState(filters.end);

  const refetch = async () => {
    setIsLoading(true);
    try {
      const result = await fetchTableData(
        {
          page,
          pageSize: rowsPerPage,
          filters,
        },
        WEBVIS_URL
      );
      setData(result.data);
      setTotalPages(result.totalPages);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsError(true);
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      start: startDate
        ? toZonedTime(startDate, TZ)
        : toZonedTime(subDays(new Date(), 1), TZ),
      end: endDate
        ? toZonedTime(endDate, TZ)
        : toZonedTime(subDays(new Date(), 1), TZ),
    });
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refetch();
  };

  const tableData = data.map((item) => ({
    id: item.id.toString(),
    cells: [
      { text: item.start },
      { text: item.end },
      { text: item.vendor_date },
      { text: item.code },
      { text: item.vendor },
      { text: item.count.toString() },
    ],
  }));

  useEffect(() => {
    if (slug && id) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, slug, id]);

  return (
    <WithLoadingAndError isLoading={isLoading} error={isError}>
      <div className="p-4 py-5 lg:px-8">
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
                {locationDetails?.name}
              </h1>
              <p className="text-[#5E6C84]">Counting History</p>
            </div>
          </div>
          <ExportToCSVButton filters={filters} />
        </header>

        <div className="max-w-full overflow-x-auto">
          <Table
            heading={
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Location</h2>
                <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
                  <div className="flex-1">
                    {/* eslint-disable-next-line i18next/no-literal-string */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">
                      Start Date
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={(date) =>
                        setStartDate(date ? date : new Date())
                      }
                      showTimeSelect
                      dateFormat="Pp"
                      placeholderText="Start Date"
                      className="bg-white dark:bg-surfaceColor w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    {/* eslint-disable-next-line i18next/no-literal-string */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-textColor mb-1">
                      End Date
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date ? date : new Date())}
                      showTimeSelect
                      dateFormat="Pp"
                      placeholderText="End Date"
                      className="bg-white dark:bg-surfaceColor w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    {/* eslint-disable-next-line i18next/no-literal-string */}
                    <ButtonFromTheme
                      onClick={handleSearch}
                      className="px-10 h-[42px]"
                    >
                      Search
                    </ButtonFromTheme>
                  </div>
                </div>
              </div>
            }
            cols={['Start', 'End', 'Vendor Date', 'Code', 'Vendor', 'Count']}
            body={tableData}
            noMoreResults={data.length === 0}
            onPageChange={handlePageChange}
            totalPages={totalPages}
          />
        </div>
      </div>
    </WithLoadingAndError>
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

export default HistoryPage;
