import { Waiter } from '../entities/waiter.entity';

export class PaginatedWaitersView {
  waiters: Waiter[];
  matchCount: number;
  numberOfPages: number;
}
