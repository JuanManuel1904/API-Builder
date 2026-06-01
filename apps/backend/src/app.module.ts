import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { EndpointsModule } from './modules/endpoints/endpoints.module';
import { FlowsModule } from './modules/flows/flows.module';
import { CodegenModule } from './engines/codegen/codegen.module';

@Module({
  imports: [
    // Config (loads .env)
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Infrastructure
    PrismaModule,

    // Feature modules
    AuthModule,
    ProjectsModule,
    EntitiesModule,
    EndpointsModule,
    FlowsModule,
    CodegenModule,
  ],
})
export class AppModule {}
