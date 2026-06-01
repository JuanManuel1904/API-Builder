import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { CodegenService } from './codegen.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import type { ExportFormat } from '@vab/types';

@ApiTags('codegen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/export')
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {}

  @Get('prisma')
  @ApiOperation({ summary: 'Generate Prisma schema from project metadata' })
  async getPrismaSchema(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const schema = await this.codegenService.generatePrisma(projectId, user.id);
    return { data: { schema } };
  }

  @Get('openapi')
  @ApiOperation({ summary: 'Generate OpenAPI 3.0 spec from project metadata' })
  async getOpenApiSpec(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const spec = await this.codegenService.generateOpenApi(projectId, user.id);
    return { data: spec };
  }

  @Get('postman')
  @ApiOperation({ summary: 'Generate Postman collection from project metadata' })
  async getPostmanCollection(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const collection = await this.codegenService.generatePostmanCollection(projectId, user.id);
    return { data: collection };
  }

  @Get('zip')
  @ApiOperation({ summary: 'Export project as ZIP archive' })
  @ApiQuery({
    name: 'formats',
    required: false,
    type: String,
    example: 'nestjs,prisma,openapi,docker',
  })
  async exportZip(
    @Param('projectId') projectId: string,
    @Query('formats') formatsParam: string,
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
  ) {
    const formats: ExportFormat[] = formatsParam
      ? (formatsParam.split(',') as ExportFormat[])
      : ['nestjs', 'prisma', 'openapi', 'docker', 'postman'];

    await this.codegenService.exportZip(projectId, formats, user.id, res);
  }
}
