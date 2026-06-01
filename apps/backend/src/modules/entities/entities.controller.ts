import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EntitiesService } from './entities.service';
import { CreateEntityDto, CreateRelationDto } from './dto/entity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('entities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List entities in project' })
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: CurrentUserData) {
    return this.entitiesService.findAllEntities(projectId, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add entity to project' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateEntityDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.entitiesService.createEntity(projectId, dto, user.id);
  }

  @Put(':entityId')
  @ApiOperation({ summary: 'Update entity definition' })
  update(
    @Param('projectId') projectId: string,
    @Param('entityId') entityId: string,
    @Body() dto: CreateEntityDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.entitiesService.updateEntity(projectId, entityId, dto, user.id);
  }

  @Delete(':entityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove entity from project' })
  remove(
    @Param('projectId') projectId: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.entitiesService.deleteEntity(projectId, entityId, user.id);
  }
}

@ApiTags('entities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/relations')
export class RelationsController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all relations in project' })
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: CurrentUserData) {
    return this.entitiesService.findAllRelations(projectId, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a relation between entities' })
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateRelationDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.entitiesService.createRelation(projectId, dto, user.id);
  }

  @Delete(':relationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a relation' })
  remove(
    @Param('projectId') projectId: string,
    @Param('relationId') relationId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.entitiesService.deleteRelation(projectId, relationId, user.id);
  }
}
