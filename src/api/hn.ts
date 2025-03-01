import fetch from "node-fetch";

const API_BASE_URL = "https://hacker-news.firebaseio.com/v0";

/**
 * Client for the official Hacker News API
 */
export class HackerNewsAPI {
  /**
   * Fetch an item by ID
   */
  async getItem(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/item/${id}.json`);
    return response.json();
  }

  /**
   * Fetch multiple items by ID
   */
  async getItems(ids: number[]): Promise<any[]> {
    return Promise.all(ids.map((id) => this.getItem(id)));
  }

  /**
   * Fetch top stories
   */
  async getTopStories(limit: number = 30): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/topstories.json`);
    const ids = (await response.json()) as number[];
    return ids.slice(0, limit);
  }

  /**
   * Fetch new stories
   */
  async getNewStories(limit: number = 30): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/newstories.json`);
    const ids = (await response.json()) as number[];
    return ids.slice(0, limit);
  }

  /**
   * Fetch best stories
   */
  async getBestStories(limit: number = 30): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/beststories.json`);
    const ids = (await response.json()) as number[];
    return ids.slice(0, limit);
  }

  /**
   * Fetch ask stories
   */
  async getAskStories(limit: number = 30): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/askstories.json`);
    const ids = (await response.json()) as number[];
    return ids.slice(0, limit);
  }

  /**
   * Fetch show stories
   */
  async getShowStories(limit: number = 30): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/showstories.json`);
    const ids = (await response.json()) as number[];
    return ids.slice(0, limit);
  }

  /**
   * Fetch job stories
   */
  async getJobStories(limit: number = 30): Promise<number[]> {
    const response = await fetch(`${API_BASE_URL}/jobstories.json`);
    const ids = (await response.json()) as number[];
    return ids.slice(0, limit);
  }

  /**
   * Fetch a user by ID
   */
  async getUser(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/user/${id}.json`);
    return response.json();
  }

  /**
   * Fetch the maximum item ID
   */
  async getMaxItemId(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/maxitem.json`);
    const result = (await response.json()) as number;
    return result;
  }
}

// Export a singleton instance
export const hnApi = new HackerNewsAPI();
