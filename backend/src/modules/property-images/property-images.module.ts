import { Module } from '@nestjs/common';

import { PropertyImagesController } from './property-images.controller';
import { PropertyImagesService } from './property-images.service';
import { StorageModule } from '../../storage/storage.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, StorageModule],

  controllers: [PropertyImagesController],

  providers: [PropertyImagesService],

  exports: [PropertyImagesService],
})
export class PropertyImagesModule {}