/* eslint-disable prettier/prettier */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3 } from 'aws-sdk';

import { BucketPaths } from './enums/bucket-paths';

type UploadFileParams = {
  file: Express.Multer.File;
  bucketPath: BucketPaths;
};

type GetFileParams = {
  bucketPath: BucketPaths;
  key: string;
};

type UpdateFileByKeyParams = {
  bucketPath: BucketPaths;
  key: string;
  file: Express.Multer.File;
};

@Injectable()
export class S3Service {
  private bucketName = process.env.BUCKET_NAME || "";
  getS3() {
    return new S3({
      accessKeyId: process.env.IAM_ACCESS_KEY_ID,
      secretAccessKey: process.env.IAM_SECRET_ACCESS_KEY,
    });
  }

  async uploadFile({ file, bucketPath }: UploadFileParams): Promise<{ url: string }> {
    const s3 = this.getS3();
    const key = `${file.originalname.replaceAll(' ', '-')}`;
    const path = `${bucketPath.replaceAll('-', '/')}/${key}`
    const params = {
      Bucket: this.bucketName,
      Key: path,
      Body: file.buffer
    };

    console.log(params);

    return await new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err.message);
          throw new InternalServerErrorException(err);
        }
        resolve({ url: data.Location });
      });
    });
  }

  async getFile({ bucketPath, key }: GetFileParams): Promise<{
    data: Buffer;
    contentType?: string;
    contentDisposition?: string;
  }> {
    const params = {
      Bucket: `${this.bucketName}/${bucketPath.replaceAll('-', '/')}`,
      Key: key,
    };
    const s3 = this.getS3();
    const file = await s3.getObject(params).promise();
    return {
      data: file.Body as Buffer,
      contentType: file.ContentType,
      contentDisposition: file.ContentDisposition,
    };
  }

  async updateFile({ bucketPath, key, file }: UpdateFileByKeyParams) {
    const s3 = this.getS3();
    await s3
      .upload({
        Bucket: `${this.bucketName}/${bucketPath.replaceAll('-', '/')}`,
        Key: key,
        Body: file.buffer,
        ContentDisposition: 'inline',
        ContentType: file.mimetype,
      })
      .promise();
  }
}
