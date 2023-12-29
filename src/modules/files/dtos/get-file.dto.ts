import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

import { BucketPaths } from '~/infra/storage/enums/bucket-paths';

export class GetFileDto {
  @IsEnum(BucketPaths)
  @ApiProperty({
    enum: BucketPaths,
    required: true,
    enumName: 'BucketPaths',
  })
  bucket: BucketPaths;

  @IsString()
  key: string;
}
