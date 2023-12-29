import { IsString, Length } from 'class-validator';

export class JoinTableSessionDto {
  @IsString()
  @Length(6, 6)
  password: string;
}
