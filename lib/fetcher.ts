/**
 * Improved fetcher function with better error handling
 */
const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      // Try to parse error details from response
      try {
        const errorData = await res.json();
        throw new Error(
          errorData.error?.message ||
            `API error: ${res.status} ${res.statusText}`
        );
      } catch (parseError) {
        // If we can't parse the error JSON, use a generic error
        throw new Error(`An error occurred while fetching: ${res.status}`);
      }
    }

    return res.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

export default fetcher;
