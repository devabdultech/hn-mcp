export interface Story {
  id: number;
  title: string;
  url?: string;
  text?: string;
  by: string;
  score: number;
  time: number;
  descendants: number;
  kids?: number[];
  type: "story";
}

export function formatStory(item: any): Story {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    text: item.text,
    by: item.by,
    score: item.score || 0,
    time: item.time,
    descendants: item.descendants || 0,
    kids: item.kids || [],
    type: "story",
  };
}
