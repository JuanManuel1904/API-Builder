import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FlowsService } from './flows.service';
import { SaveFlowDto } from './dto/flow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/endpoints/:endpointId/flow')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Get()
  @ApiOperation({ summary: 'Get flow graph for an endpoint' })
  getFlow(
    @Param('projectId') projectId: string,
    @Param('endpointId') endpointId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.flowsService.getFlow(projectId, endpointId, user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Save flow graph (nodes + edges) for an endpoint' })
  saveFlow(
    @Param('projectId') projectId: string,
    @Param('endpointId') endpointId: string,
    @Body() dto: SaveFlowDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.flowsService.saveFlow(projectId, endpointId, dto, user.id);
  }
}
