import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectMetadataDto,
} from './dto/project.dto';
import type { ProjectMetadata } from '@vab/types';

const DEFAULT_METADATA: ProjectMetadata = {
  entities: [],
  relations: [],
  flows: [],
  endpoints: [],
  validations: [],
  auth: { strategy: 'jwt' },
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        version: true,
        isPublic: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const summaries = projects.map((p) => {
      const meta = p.metadata as unknown as ProjectMetadata;
      return {
        ...p,
        entityCount: meta?.entities?.length ?? 0,
        endpointCount: meta?.endpoints?.length ?? 0,
        metadata: undefined,
      };
    });

    return { data: summaries };
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    if (project.ownerId !== userId && !project.isPublic) {
      throw new ForbiddenException('Access denied');
    }
    return { data: project };
  }

  async create(dto: CreateProjectDto, userId: string) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        ownerId: userId,
        metadata: DEFAULT_METADATA as unknown as Record<string, unknown>,
      },
    });
    this.logger.log(`Project created: ${project.id} by user ${userId}`);
    return { data: project };
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    await this.assertOwner(id, userId);
    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });
    return { data: project };
  }

  async updateMetadata(id: string, dto: UpdateProjectMetadataDto, userId: string) {
    await this.assertOwner(id, userId);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        metadata: dto.metadata,
        version: { increment: 1 },
      },
    });
    return { data: project };
  }

  async duplicate(id: string, userId: string) {
    const source = await this.prisma.project.findUnique({ where: { id } });
    if (!source) throw new NotFoundException(`Project ${id} not found`);
    if (source.ownerId !== userId && !source.isPublic) {
      throw new ForbiddenException('Access denied');
    }
    const copy = await this.prisma.project.create({
      data: {
        name: `${source.name} (copy)`,
        description: source.description,
        ownerId: userId,
        metadata: source.metadata,
        isPublic: false,
      },
    });
    return { data: copy };
  }

  async remove(id: string, userId: string) {
    await this.assertOwner(id, userId);
    await this.prisma.project.delete({ where: { id } });
    return { data: { success: true } };
  }

  private async assertOwner(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (project.ownerId !== userId) throw new ForbiddenException('Access denied');
    return project;
  }
}
