import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateEntityDto, CreateRelationDto } from './dto/entity.dto';
import { randomUUID } from 'crypto';
import type { ProjectMetadata, EntityDefinition, RelationDefinition } from '@vab/types';

@Injectable()
export class EntitiesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Entities ─────────────────────────────────────────────

  async findAllEntities(projectId: string, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    return { data: meta.entities };
  }

  async createEntity(projectId: string, dto: CreateEntityDto, userId: string) {
    const meta = await this.getMetadata(projectId, userId);

    const exists = meta.entities.find(
      (e) => e.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (exists) throw new ConflictException(`Entity "${dto.name}" already exists`);

    const newEntity: EntityDefinition = {
      id: randomUUID(),
      name: dto.name,
      description: dto.description,
      tableName: dto.tableName,
      fields: (dto.fields ?? []).map((f) => ({
        ...f,
        id: f.id || randomUUID(),
        constraints: f.constraints ?? {},
      })) as EntityDefinition['fields'],
      timestamps: dto.timestamps ?? true,
      softDelete: dto.softDelete ?? false,
    };

    meta.entities.push(newEntity);
    await this.saveMetadata(projectId, meta);
    return { data: newEntity };
  }

  async updateEntity(
    projectId: string,
    entityId: string,
    dto: Partial<CreateEntityDto>,
    userId: string,
  ) {
    const meta = await this.getMetadata(projectId, userId);
    const idx = meta.entities.findIndex((e) => e.id === entityId);
    if (idx === -1) throw new NotFoundException(`Entity ${entityId} not found`);

    meta.entities[idx] = {
      ...meta.entities[idx],
      ...dto,
      fields: dto.fields
        ? dto.fields.map((f) => ({
            ...f,
            id: f.id || randomUUID(),
            constraints: f.constraints ?? {},
          })) as EntityDefinition['fields']
        : meta.entities[idx].fields,
    };

    await this.saveMetadata(projectId, meta);
    return { data: meta.entities[idx] };
  }

  async deleteEntity(projectId: string, entityId: string, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    const idx = meta.entities.findIndex((e) => e.id === entityId);
    if (idx === -1) throw new NotFoundException(`Entity ${entityId} not found`);

    meta.entities.splice(idx, 1);
    // Also remove relations involving this entity
    meta.relations = meta.relations.filter(
      (r) => r.fromEntityId !== entityId && r.toEntityId !== entityId,
    );

    await this.saveMetadata(projectId, meta);
    return { data: { success: true } };
  }

  // ── Relations ─────────────────────────────────────────────

  async findAllRelations(projectId: string, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    return { data: meta.relations };
  }

  async createRelation(projectId: string, dto: CreateRelationDto, userId: string) {
    const meta = await this.getMetadata(projectId, userId);

    const fromEntity = meta.entities.find((e) => e.id === dto.fromEntityId);
    const toEntity = meta.entities.find((e) => e.id === dto.toEntityId);
    if (!fromEntity) throw new NotFoundException(`Entity ${dto.fromEntityId} not found`);
    if (!toEntity) throw new NotFoundException(`Entity ${dto.toEntityId} not found`);

    const newRelation: RelationDefinition = {
      id: randomUUID(),
      type: dto.type as RelationDefinition['type'],
      fromEntityId: dto.fromEntityId,
      toEntityId: dto.toEntityId,
      fromFieldName: dto.fromFieldName,
      toFieldName: dto.toFieldName,
      onDelete: dto.onDelete as RelationDefinition['onDelete'],
    };

    meta.relations.push(newRelation);
    await this.saveMetadata(projectId, meta);
    return { data: newRelation };
  }

  async deleteRelation(projectId: string, relationId: string, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    const idx = meta.relations.findIndex((r) => r.id === relationId);
    if (idx === -1) throw new NotFoundException(`Relation ${relationId} not found`);
    meta.relations.splice(idx, 1);
    await this.saveMetadata(projectId, meta);
    return { data: { success: true } };
  }

  // ── Helpers ───────────────────────────────────────────────

  async getMetadata(projectId: string, userId: string): Promise<ProjectMetadata> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');
    return project.metadata as unknown as ProjectMetadata;
  }

  async saveMetadata(projectId: string, metadata: ProjectMetadata) {
    await this.prisma.project.update({
      where: { id: projectId },
      data: {
        metadata: metadata as unknown as Record<string, unknown>,
        version: { increment: 1 },
      },
    });
  }
}
