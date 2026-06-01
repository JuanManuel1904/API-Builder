import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateEndpointDto } from './dto/endpoint.dto';
import { randomUUID } from 'crypto';
import type { ProjectMetadata, EndpointDefinition } from '@vab/types';

@Injectable()
export class EndpointsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(projectId: string, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    return { data: meta.endpoints };
  }

  async create(projectId: string, dto: CreateEndpointDto, userId: string) {
    const meta = await this.getMetadata(projectId, userId);

    const exists = meta.endpoints.find(
      (e) => e.method === dto.method && e.path === dto.path,
    );
    if (exists) throw new ConflictException(`Endpoint ${dto.method} ${dto.path} already exists`);

    const newEndpoint: EndpointDefinition = {
      id: randomUUID(),
      method: dto.method as EndpointDefinition['method'],
      path: dto.path,
      summary: dto.summary,
      description: dto.description,
      tags: dto.tags ?? [],
      isPublic: dto.isPublic ?? false,
    };

    meta.endpoints.push(newEndpoint);
    await this.saveMetadata(projectId, meta);
    return { data: newEndpoint };
  }

  async update(projectId: string, endpointId: string, dto: Partial<CreateEndpointDto>, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    const idx = meta.endpoints.findIndex((e) => e.id === endpointId);
    if (idx === -1) throw new NotFoundException(`Endpoint ${endpointId} not found`);

    meta.endpoints[idx] = {
      ...meta.endpoints[idx],
      ...dto,
      method: (dto.method ?? meta.endpoints[idx].method) as EndpointDefinition['method'],
    };

    await this.saveMetadata(projectId, meta);
    return { data: meta.endpoints[idx] };
  }

  async remove(projectId: string, endpointId: string, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    const idx = meta.endpoints.findIndex((e) => e.id === endpointId);
    if (idx === -1) throw new NotFoundException(`Endpoint ${endpointId} not found`);

    // Remove associated flow
    const endpoint = meta.endpoints[idx];
    if (endpoint.flowId) {
      meta.flows = meta.flows.filter((f) => f.id !== endpoint.flowId);
    }

    meta.endpoints.splice(idx, 1);
    await this.saveMetadata(projectId, meta);
    return { data: { success: true } };
  }

  private async getMetadata(projectId: string, userId: string): Promise<ProjectMetadata> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');
    return project.metadata as unknown as ProjectMetadata;
  }

  private async saveMetadata(projectId: string, metadata: ProjectMetadata) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: { metadata: metadata as unknown as Record<string, unknown>, version: { increment: 1 } },
    });
  }
}
