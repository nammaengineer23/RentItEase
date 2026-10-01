import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { FirebaseModule } from '../firebase/firebase.module';
import { R2StorageService } from './r2-storage.service';
import { StorageService } from './storage.service';
import { FileScanService } from './file-scan.service';
import { StorageReconciliationService } from './storage-reconciliation.service';

@Module({
  imports: [ConfigModule, FirebaseModule],
  providers: [R2StorageService, StorageService, FileScanService, StorageReconciliationService],
  exports: [StorageService, FileScanService, StorageReconciliationService],
})
export class StorageModule {}
