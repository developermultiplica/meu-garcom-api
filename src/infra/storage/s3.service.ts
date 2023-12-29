/* eslint-disable prettier/prettier */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
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
  private s3: AWS.S3;
  private appBaseUrl: string;
  private bucketName = 'meu-garcom';

  constructor() {
    const {
      NODE_ENV,
      BUCKET_URL,
      ACCESS_KEY_ID,
      SECRET_ACCESS_KEY,
      APP_BASE_URL,
    } = process.env;

    if (
      !NODE_ENV ||
      !APP_BASE_URL ||
      !BUCKET_URL ||
      !ACCESS_KEY_ID ||
      !SECRET_ACCESS_KEY
    ) {
      throw new InternalServerErrorException(
        'At least one of those envs [NODE_ENV, APP_BASE_URL, BUCKET_URL, ACCESS_KEY, SECRET_ACCESS_KEY] was not defined',
      );
    }

    AWS.config.update({
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      s3ForcePathStyle: true,
    });

    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      endpoint: BUCKET_URL,
    });

    this.appBaseUrl = APP_BASE_URL;
  }

  getS3() {
    return new S3({
      accessKeyId: process.env.IAM_ACCESS_KEY_ID,
      secretAccessKey: process.env.IAM_SECRET_ACCESS_KEY,
    });
  }

  async uploadFile({ file, bucketPath }: UploadFileParams): Promise<{ url: string }> {
    const s3 = this.getS3();
    const bucket_name = `${this.bucketName}-bucket`;
    const key = `${file.originalname.replaceAll(' ', '-')}`;
    const path = `${this.bucketName}/${bucketPath.replaceAll('-', '/')}/${key}`
    const params = {
      Bucket: bucket_name,
      Key: path,
      Body: file.buffer,
    };

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
    const file = await this.s3.getObject(params).promise();
    return {
      data: file.Body as Buffer,
      contentType: file.ContentType,
      contentDisposition: file.ContentDisposition,
    };
  }

  async updateFile({ bucketPath, key, file }: UpdateFileByKeyParams) {
    await this.s3
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
