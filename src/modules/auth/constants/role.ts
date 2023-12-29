export const ROLE = {
  PROVIDER: 'provider',
  RESTAURANT: 'restaurant',
  CUSTOMER: 'customer',
  WAITER: 'waiter',
} as const;
export type ROLE = (typeof ROLE)[keyof typeof ROLE];
