import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateProjectMetadataDto,
} from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all projects for current user' })
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.projectsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID (with full metadata)' })
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.projectsService.findOne(id, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: CurrentUserData) {
    return this.projectsService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project name/description' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.projectsService.update(id, dto, user.id);
  }

  @Put(':id/metadata')
  @ApiOperation({ summary: 'Replace full project metadata (auto-save from canvas)' })
  updateMetadata(
    @Param('id') id: string,
    @Body() dto: UpdateProjectMetadataDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.projectsService.updateMetadata(id, dto, user.id);
  }

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate a project' })
  duplicate(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.projectsService.duplicate(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project' })
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.projectsService.remove(id, user.id);
  }
}
