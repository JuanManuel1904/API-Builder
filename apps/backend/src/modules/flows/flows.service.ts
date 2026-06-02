import { HttpMethod } from '@vab/types';
import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { SaveFlowDto } from './dto/flow.dto';
import { randomUUID } from 'crypto';
import type { ProjectMetadata, FlowDefinition } from '@vab/types';

@Injectable()
export class FlowsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFlow(projectId: string, endpointId: string, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    const endpoint = meta.endpoints.find((e) => e.id === endpointId);
    if (!endpoint) throw new NotFoundException(`Endpoint ${endpointId} not found`);

    let flow = meta.flows.find((f) => f.endpointId === endpointId);

    if (!flow) {
      // Auto-create a default flow for this endpoint
      flow = this.createDefaultFlow(endpointId, endpoint.method as HttpMethod);
      meta.flows.push(flow);

      endpoint.flowId = flow.id;
      await this.saveMetadata(projectId, meta);
    }

    return { data: flow };
  }

  async saveFlow(projectId: string, endpointId: string, dto: SaveFlowDto, userId: string) {
    const meta = await this.getMetadata(projectId, userId);
    const endpoint = meta.endpoints.find((e) => e.id === endpointId);
    if (!endpoint) throw new NotFoundException(`Endpoint ${endpointId} not found`);

    const flowIdx = meta.flows.findIndex((f) => f.endpointId === endpointId);

    const flowId = endpoint.flowId ?? randomUUID();
    const updatedFlow: FlowDefinition = {
      id: flowId,
      endpointId,
      nodes: dto.nodes as unknown as FlowDefinition['nodes'],
      edges: dto.edges as FlowDefinition['edges'],
    };

    if (flowIdx !== -1) {
      meta.flows[flowIdx] = updatedFlow;
    } else {
      meta.flows.push(updatedFlow);
      endpoint.flowId = flowId;
    }

    await this.saveMetadata(projectId, meta);
    return { data: updatedFlow };
  }

  private createDefaultFlow(endpointId: string, method: HttpMethod): FlowDefinition {
    const requestNodeId = randomUUID();
    const responseNodeId = randomUUID();

    const nodes: FlowDefinition['nodes'] = [
      {
        id: requestNodeId,
        type: 'request',
        position: { x: 100, y: 100 },
        config: { method, path: '/', contentType: 'application/json', rateLimitEnabled: false },
        label: 'Request',
      },
      {
        id: responseNodeId,
        type: 'response',
        position: { x: 100, y: 280 },
        config: {
          statusCode: method === 'POST' ? 201 : 200,
          isArray: method === 'GET',
          wrapInData: true,
          includeMeta: false,
          compress: false,
        },
        label: 'Response',
      },
    ];

    const edges: FlowDefinition['edges'] = [
      { id: randomUUID(), source: requestNodeId, target: responseNodeId },
    ];

    return { id: randomUUID(), endpointId, nodes, edges };
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
      data: {
        metadata: metadata as unknown as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
  }
}
