import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

interface CompareRequest {
  password: string;
  encryptedPassword: string;
}

@Injectable()
export class PasswordEncryptionsService {
  encrypt(password: string): Promise<string> {
    return hash(password, 12);
  }

  compare({ password, encryptedPassword }: CompareRequest): Promise<boolean> {
    return compare(password, encryptedPassword);
  }
}
