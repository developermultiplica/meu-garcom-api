import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateWaiterDto {
  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    example: 'waiter@email.com',
  })
  username: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Waiter Name',
  })
  name: string;

  @IsString()
  @Length(6)
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;
}
