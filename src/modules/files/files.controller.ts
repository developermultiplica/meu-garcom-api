import { Controller, Get, Res, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

import { S3Service } from '~/infra/storage/s3.service';

import { GetFileDto } from './dtos/get-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly s3Service: S3Service) {}

  @ApiOperation({
    summary: 'Rota utilizada para ter acesso aos arquivos',
  })
  @Get()
  async getFile(
    @Query() { bucket, key }: GetFileDto,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.s3Service.getFile({ bucketPath: bucket, key });
    res.set('Content-Type', file.contentType);
    res.set('Content-Disposition', file.contentDisposition);
    res.send(file.data);
  }
}
