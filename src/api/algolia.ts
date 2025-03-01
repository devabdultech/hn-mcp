import fetch from "node-fetch";

const API_BASE_URL = "https://hn.algolia.com/api/v1";

/**
 * Client for the Algolia Hacker News API
 */
export class AlgoliaAPI {
  /**
   * Search for stories and comments
   */
  async search(
    query: string,
    options: {
      tags?: string;
      numericFilters?: string;
      page?: number;
      hitsPerPage?: number;
    } = {}
  ): Promise<any> {
    const params = new URLSearchParams();

    // Add query parameter
    params.append("query", query);

    // Add optional parameters
    if (options.tags) params.append("tags", options.tags);
    if (options.numericFilters)
      params.append("numericFilters", options.numericFilters);
    if (options.page !== undefined)
      params.append("page", options.page.toString());
    if (options.hitsPerPage !== undefined)
      params.append("hitsPerPage", options.hitsPerPage.toString());

    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
    return response.json();
  }

  /**
   * Search for stories only
   */
  async searchStories(
    query: string,
    options: {
      page?: number;
      hitsPerPage?: number;
    } = {}
  ): Promise<any> {
    return this.search(query, {
      tags: "story",
      ...options,
    });
  }

  /**
   * Get a story with its comments
   */
  async getStoryWithComments(storyId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/items/${storyId}`);
    return response.json();
  }

  /**
   * Get a user profile
   */
  async getUser(username: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/${username}`);
    return response.json();
  }
}

// Export a singleton instance
export const algoliaApi = new AlgoliaAPI();
