// Basic authentication service for handling user login and registration

interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
  user?: {
    id: string;
    username: string;
  };
}

interface User {
  id: string;
  username: string;
}

export const AuthService = {
  // In a real application, these would make HTTP requests to your server
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      // For demonstration, we're simulating a successful login
      // In a real app, this would send a request to your API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, the server would validate credentials
      if (username.length < 3 || password.length < 4) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }
      
      // Simulate a successful response
      const user = {
        id: `user_${Math.random().toString(36).substring(2, 9)}`,
        username
      };
      
      // Store auth data in localStorage for persistence
      localStorage.setItem('ticTacAuth', JSON.stringify({
        token: `token_${Math.random().toString(36).substring(2)}`,
        user
      }));
      
      return {
        success: true,
        user,
        token: `token_${Math.random().toString(36).substring(2)}`
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  },
  
  async register(username: string, password: string): Promise<AuthResponse> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, the server would validate and ensure username uniqueness
      if (username.length < 3) {
        return {
          success: false,
          error: 'Username must be at least 3 characters'
        };
      }
      
      if (password.length < 4) {
        return {
          success: false,
          error: 'Password must be at least 4 characters'
        };
      }
      
      // Simulate a successful registration
      const user = {
        id: `user_${Math.random().toString(36).substring(2, 9)}`,
        username
      };
      
      // Store auth data in localStorage
      localStorage.setItem('ticTacAuth', JSON.stringify({
        token: `token_${Math.random().toString(36).substring(2)}`,
        user
      }));
      
      return {
        success: true,
        user,
        token: `token_${Math.random().toString(36).substring(2)}`
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: 'An error occurred during registration'
      };
    }
  },
  
  logout(): void {
    localStorage.removeItem('ticTacAuth');
  },
  
  getCurrentUser(): User | null {
    try {
      const authData = localStorage.getItem('ticTacAuth');
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed.user || null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },
  
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
};
