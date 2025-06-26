const theadClass =
  'bg-gray-50 text-xs uppercase text-gray-700 dark:bg-backgroundColor dark:text-gray-400';
const trHeadClass = 'hover:bg-hoverColor dark:hover:bg-hoverColor';
const thClass = 'px-6 py-3 font-thin text-[#8A8A8F] text-[13px]';

export const TableHeader = ({ cols }: { cols: string[] }) => {
  return (
    <thead className={theadClass}>
      <tr className={trHeadClass}>
        <th className={thClass} style={{ width: '50px' }}></th>
        {cols.map((col, index) => (
          <th key={index} scope="col" className={thClass}>
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
};
