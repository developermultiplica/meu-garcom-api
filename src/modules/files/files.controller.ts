/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Res, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

import { BucketPaths } from '~/infra/storage/enums/bucket-paths';
import { S3Service } from '~/infra/storage/s3.service';

import { GetFileDto, UploadFileDto } from './dtos/get-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly s3Service: S3Service) { }

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

  @Post('upload')
  @ApiBody({ type: UploadFileDto })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    const { url } = await this.s3Service.uploadFile({
      bucketPath: BucketPaths.PRODUCT_PHOTO,
      file
    });

    return url;
  }
}
