import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ValidateWaiterDto {
  @IsEmail()
  @ApiProperty({
    type: String,
    example: 'waiter@email.com',
  })
  username: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;
}
