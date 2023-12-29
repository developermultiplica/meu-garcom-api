import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  @ApiProperty({
    type: String,
    example: 'Provider Name',
  })
  providerName: string;

  @IsString()
  @ApiProperty({
    type: String,
    example: 'Provider Manager Name',
  })
  managerName: string;

  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    example: 'provider@email.com',
  })
  username: string;

  @IsString()
  @Length(6)
  @ApiProperty({
    type: String,
    example: '123456',
  })
  password: string;
}
