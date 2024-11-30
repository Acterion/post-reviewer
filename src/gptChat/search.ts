import fetch from 'node-fetch';

export async function performWebSearch(query: string): Promise<string> {
  const subscriptionKey = process.env.BING_SEARCH_API_KEY;
  const endpoint = 'https://api.bing.microsoft.com/v7.0/search';

  if (!subscriptionKey) {
    throw new Error(
      'Bing Search API key is not set in the environment variables.',
    );
  }

  const url = `${endpoint}?q=${encodeURIComponent(query)}&count=3`;
  const response = await fetch(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Bing Search API request failed: ${response.status} ${errorText}`,
    );
  }

  const data = await response.json();

  // Extract the top search results
  const results = data.webPages?.value || [];
  if (results.length === 0) {
    return 'No results found for your query.';
  }

  let searchResultsText = '';
  results.forEach((item: any, index: number) => {
    searchResultsText += `${index + 1}. ${item.name}\nSnippet: ${item.snippet}\nURL: ${item.url}\n\n`;
  });

  return searchResultsText.trim();
}
