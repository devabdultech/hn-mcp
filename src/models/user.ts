export interface User {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

export function formatUser(user: any): User {
  return {
    id: user.id,
    created: user.created,
    karma: user.karma,
    about: user.about,
    submitted: user.submitted,
  };
}
