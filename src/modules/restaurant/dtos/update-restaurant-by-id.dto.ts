/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';
export class UpdateRestaurantByIdDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumberString()
  @IsOptional()
  maxTables: number;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  banner?: Express.Multer.File;
}
