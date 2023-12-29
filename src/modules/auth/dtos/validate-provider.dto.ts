import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ValidateProviderDto {
  @IsEmail()
  @ApiProperty({
    type: String,
    example: 'provider.manager@email.com',
  })
  username: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;
}
