export const Subject = {
  NEW_TABLE_SESSION: 'new-table-session',
  NEW_ORDER: 'new-order',
  NEW_PARTICIPANT: 'new-participant',
  TABLE_SESSION_PAYMENT_REQUESTED: 'table-session-payment-requested',
  TABLE_SESSION_FINISHED: 'table-session-finished',
  TABLE_SESSION_WAITER_CALLED: 'table-session-waiter-called',
  TABLE_SESSION_ORDER_PRODUCT_CANCELED: 'table-session-order-product-canceled',
  TABLE_SESSION_ORDER_PRODUCT_SERVED: 'table-session-order-product-served',
} as const;

export type Subject = (typeof Subject)[keyof typeof Subject];
