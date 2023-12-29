import { IsString } from 'class-validator';

export class RecoverDto {
  @IsString()
  username: string;
}
