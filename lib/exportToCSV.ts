export const exportToCSV = async (downloadCSV: () => Promise<Blob>) => {
  try {
    const blob = await downloadCSV();
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'history_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
};
