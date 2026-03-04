interface UserStore {
  circles: any[];
  posts: any[];
  polls: any[];
  events: any[];
  boardItems: any[];
  notifications: any[];
}

const stores = new Map<string, UserStore>();

function getDefaultStore(): UserStore {
  return {
    circles: [],
    posts: [],
    polls: [],
    events: [],
    boardItems: [],
    notifications: [],
  };
}

export function getUserStore(userId: string): UserStore {
  if (!stores.has(userId)) {
    stores.set(userId, getDefaultStore());
  }
  return stores.get(userId)!;
}

export function deleteUserStore(userId: string): void {
  stores.delete(userId);
}
