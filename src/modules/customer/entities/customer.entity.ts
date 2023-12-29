/* eslint-disable prettier/prettier */
export class Customer {
  id: string;
  onesignal_id: string;
  name: string;
  email: string | null;
  username: string;
  activeTableSessionId: string | null;
  cart: string[];
  createdAt: Date;
}
