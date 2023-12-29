import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalProviderAuthGuard extends AuthGuard('provider-local') {}
