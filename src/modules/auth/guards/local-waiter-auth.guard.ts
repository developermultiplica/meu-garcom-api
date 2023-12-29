import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalWaiterAuthGuard extends AuthGuard('waiter-local') {}
