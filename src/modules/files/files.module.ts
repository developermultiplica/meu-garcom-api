import { Module } from '@nestjs/common';

import { StorageModule } from '~/infra/storage/storage.module';

import { FilesController } from './files.controller';

@Module({
  imports: [StorageModule],
  controllers: [FilesController],
})
export class FilesModule {}
