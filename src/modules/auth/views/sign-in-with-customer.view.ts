import { Customer } from '~/modules/customer/entities/customer.entity';

export class SignInWithCustomer {
  accessToken: string;
  user: Customer;
}
