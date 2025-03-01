export interface Comment {
  id: number;
  text: string;
  by: string;
  time: number;
  parent: number;
  kids?: number[];
  type: "comment";
}

export function formatComment(item: any): Comment {
  return {
    id: item.id,
    text: item.text || "",
    by: item.by || "deleted",
    time: item.time,
    parent: item.parent,
    kids: item.kids || [],
    type: "comment",
  };
}
