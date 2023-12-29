declare namespace Express {
  declare type ROLE = 'provider' | 'restaurant' | 'customer' | 'waiter';
  declare interface User {
    id: string;
    username: string;
    role: ROLE;
  }
  declare interface Request {
    user: User;
  }
}
