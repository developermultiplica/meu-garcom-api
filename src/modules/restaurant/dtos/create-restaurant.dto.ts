/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  IsDateString,
  IsNumberString,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  banner?: Express.Multer.File;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Restaurant Name',
  })
  restaurantName: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Restaurant Name',
  })
  managerName: string;

  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    example: 'restaurant@email.com',
  })
  username: string;

  @IsNumberString()
  maxTables: number;

  @IsString()
  @Length(6)
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;

  @IsDateString()
  expiresAt: string;
}
