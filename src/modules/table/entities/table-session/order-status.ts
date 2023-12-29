export const TableSessionOrderStatus = {
  REQUESTED: 'REQUESTED',
  SERVED: 'SERVED',
  CANCELED: 'CANCELED',
} as const;
export type TableSessionOrderStatus =
  (typeof TableSessionOrderStatus)[keyof typeof TableSessionOrderStatus];
