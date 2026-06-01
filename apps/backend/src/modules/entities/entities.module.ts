import { Module } from '@nestjs/common';
import { EntitiesController, RelationsController } from './entities.controller';
import { EntitiesService } from './entities.service';

@Module({
  controllers: [EntitiesController, RelationsController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
