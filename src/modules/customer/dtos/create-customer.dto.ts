/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { IsNullable } from '~/helpers/class-validator/is-nullable.decorator';

export class CreateCustomerDto {
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
    example: 'Customer Name',
  })
  name: string;

  @IsString({
    message: 'email must be a string or null',
  })
  @IsNullable()
  @ApiProperty({
    type: String,
    example: 'customer@email.com',
    nullable: true,
  })
  email: string | null;

  @IsString()
  @Length(6)
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;
}

export class UpdateCustomerOnesignalIdDto {
  onesignal_id: string;
}