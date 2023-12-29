import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ValidateCustomerDto {
  @IsString()
  @Length(11, 11)
  @ApiProperty({
    type: String,
    example: '85988880000',
  })
  username: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;
}
