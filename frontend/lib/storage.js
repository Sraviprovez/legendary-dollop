/**
 * Token and session management utilities
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const WORKSPACE_KEY = 'workspace_context';

/**
 * Token management
 */
export const tokenStorage = {
  /**
   * Get auth token from localStorage
   */
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Set auth token in localStorage
   */
  setToken: (token) => {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  /**
   * Clear auth token
   */
  clearToken: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Check if token exists
   */
  hasToken: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

/**
 * User session management
 */
export const userStorage = {
  /**
   * Get user from localStorage
   */
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    try {
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set user in localStorage
   */
  setUser: (user) => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Clear user from localStorage
   */
  clearUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Update user
   */
  updateUser: (updates) => {
    if (typeof window === 'undefined') return null;
    const user = userStorage.getUser();
    const updated = { ...user, ...updates };
    userStorage.setUser(updated);
    return updated;
  },
};

/**
 * Workspace context management
 */
export const workspaceStorage = {
  /**
   * Get current workspace context
   */
  getWorkspace: () => {
    if (typeof window === 'undefined') return null;
    const workspace = localStorage.getItem(WORKSPACE_KEY);
    try {
      return workspace ? JSON.parse(workspace) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set workspace context
   */
  setWorkspace: (workspace) => {
    if (typeof window === 'undefined') return;
    if (workspace) {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    } else {
      localStorage.removeItem(WORKSPACE_KEY);
    }
  },

  /**
   * Clear workspace context
   */
  clearWorkspace: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(WORKSPACE_KEY);
  },
};

/**
 * Clear all stored data (used on logout)
 */
export const clearAllStorage = () => {
  if (typeof window === 'undefined') return;
  tokenStorage.clearToken();
  userStorage.clearUser();
  workspaceStorage.clearWorkspace();
};

export default {
  tokenStorage,
  userStorage,
  workspaceStorage,
  clearAllStorage,
};
