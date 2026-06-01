import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  generatePrismaSchema,
  generateOpenApiSpec,
  generateNestJsProject,
} from '@vab/metadata-engine';
import type { ProjectMetadata, ExportFormat } from '@vab/types';
import * as archiver from 'archiver';
import { Response } from 'express';

@Injectable()
export class CodegenService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePrisma(projectId: string, userId: string): Promise<string> {
    const meta = await this.getMetadata(projectId, userId);
    return generatePrismaSchema(meta);
  }

  async generateOpenApi(projectId: string, userId: string): Promise<object> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException();
    if (project.ownerId !== userId) throw new ForbiddenException();
    const meta = project.metadata as unknown as ProjectMetadata;
    return generateOpenApiSpec(meta, project.name);
  }

  async generatePostmanCollection(projectId: string, userId: string): Promise<object> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException();
    if (project.ownerId !== userId) throw new ForbiddenException();
    const meta = project.metadata as unknown as ProjectMetadata;

    const items = meta.endpoints.map((endpoint) => ({
      name: `${endpoint.method} ${endpoint.path}`,
      request: {
        method: endpoint.method,
        header: [
          { key: 'Content-Type', value: 'application/json' },
          ...(!endpoint.isPublic
            ? [{ key: 'Authorization', value: 'Bearer {{accessToken}}' }]
            : []),
        ],
        url: {
          raw: `{{baseUrl}}${endpoint.path}`,
          host: ['{{baseUrl}}'],
          path: endpoint.path.split('/').filter(Boolean),
        },
        body:
          ['POST', 'PUT', 'PATCH'].includes(endpoint.method)
            ? { mode: 'raw', raw: '{}', options: { raw: { language: 'json' } } }
            : undefined,
      },
    }));

    return {
      info: {
        name: project.name,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        { key: 'baseUrl', value: 'http://localhost:3001/api', type: 'string' },
        { key: 'accessToken', value: '', type: 'string' },
      ],
      item: items,
    };
  }

  async exportZip(
    projectId: string,
    formats: ExportFormat[],
    userId: string,
    res: Response,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException();
    if (project.ownerId !== userId) throw new ForbiddenException();

    const meta = project.metadata as unknown as ProjectMetadata;
    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${projectSlug}-export.zip"`);

    const archive = archiver.default('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    if (formats.includes('prisma')) {
      archive.append(generatePrismaSchema(meta), { name: 'prisma/schema.prisma' });
    }

    if (formats.includes('openapi')) {
      archive.append(JSON.stringify(generateOpenApiSpec(meta, project.name), null, 2), {
        name: 'openapi.json',
      });
    }

    if (formats.includes('postman')) {
      const collection = await this.generatePostmanCollection(projectId, userId);
      archive.append(JSON.stringify(collection, null, 2), { name: 'postman-collection.json' });
    }

    if (formats.includes('nestjs')) {
      const files = generateNestJsProject(meta, project.name);
      for (const file of files) {
        archive.append(file.content, { name: file.path });
      }
      // Add package.json stub
      archive.append(
        JSON.stringify(
          {
            name: projectSlug,
            version: '1.0.0',
            dependencies: {
              '@nestjs/common': '^10.0.0',
              '@nestjs/core': '^10.0.0',
              '@nestjs/platform-express': '^10.0.0',
              '@nestjs/swagger': '^7.0.0',
              '@prisma/client': '^5.0.0',
              'class-validator': '^0.14.0',
              'class-transformer': '^0.5.0',
            },
          },
          null,
          2,
        ),
        { name: 'package.json' },
      );
    }

    if (formats.includes('docker')) {
      archive.append(this.generateDockerfile(), { name: 'Dockerfile' });
      archive.append(this.generateDockerCompose(projectSlug), { name: 'docker-compose.yml' });
      archive.append(this.generateEnvExample(), { name: '.env.example' });
    }

    await archive.finalize();
  }

  private generateDockerfile(): string {
    return `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main"]
`;
  }

  private generateDockerCompose(projectSlug: string): string {
    return `version: '3.9'
services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/${projectSlug}
      JWT_SECRET: \${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${projectSlug}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
`;
  }

  private generateEnvExample(): string {
    return `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"
JWT_SECRET="change-this-in-production"
JWT_EXPIRES_IN="15m"
PORT=3001
NODE_ENV=production
`;
  }

  private async getMetadata(projectId: string, userId: string): Promise<ProjectMetadata> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');
    return project.metadata as unknown as ProjectMetadata;
  }
}
