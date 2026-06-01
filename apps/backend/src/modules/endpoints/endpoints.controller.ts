import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EndpointsService } from './endpoints.service';
import { CreateEndpointDto } from './dto/endpoint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('endpoints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @Get()
  @ApiOperation({ summary: 'List endpoints in project' })
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: CurrentUserData) {
    return this.endpointsService.findAll(projectId, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create endpoint' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEndpointDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.endpointsService.create(projectId, dto, user.id);
  }

  @Patch(':endpointId')
  @ApiOperation({ summary: 'Update endpoint' })
  update(
    @Param('projectId') projectId: string,
    @Param('endpointId') endpointId: string,
    @Body() dto: CreateEndpointDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.endpointsService.update(projectId, endpointId, dto, user.id);
  }

  @Delete(':endpointId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete endpoint' })
  remove(
    @Param('projectId') projectId: string,
    @Param('endpointId') endpointId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.endpointsService.remove(projectId, endpointId, user.id);
  }
}
