import type {
  ProjectMetadata,
  EntityDefinition,
  EntityField,
  EndpointDefinition,
  FieldType,
} from '@vab/types';

const TS_TYPE_MAP: Record<FieldType, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  date: 'Date',
  uuid: 'string',
  enum: 'string',
  json: 'Record<string, unknown>',
  array: 'unknown[]',
};

const CLASS_VALIDATOR_MAP: Record<FieldType, string[]> = {
  string: ['@IsString()'],
  number: ['@IsNumber()'],
  boolean: ['@IsBoolean()'],
  date: ['@IsDateString()'],
  uuid: ['@IsUUID()'],
  enum: ['@IsString()'],
  json: ['@IsObject()'],
  array: ['@IsArray()'],
};

function generateFieldDecorators(field: EntityField): string[] {
  const lines: string[] = [];
  const { constraints, type } = field;

  if (constraints.nullable || !constraints.required) {
    lines.push('  @IsOptional()');
  } else {
    lines.push('  @IsNotEmpty()');
  }

  lines.push(...CLASS_VALIDATOR_MAP[type].map((d) => `  ${d}`));

  if (constraints.minLength !== undefined) lines.push(`  @MinLength(${constraints.minLength})`);
  if (constraints.maxLength !== undefined) lines.push(`  @MaxLength(${constraints.maxLength})`);
  if (constraints.min !== undefined) lines.push(`  @Min(${constraints.min})`);
  if (constraints.max !== undefined) lines.push(`  @Max(${constraints.max})`);
  if (constraints.pattern) lines.push(`  @Matches(/${constraints.pattern}/)`);
  if (constraints.enumValues?.length) {
    lines.push(`  @IsIn([${constraints.enumValues.map((v) => `'${v}'`).join(', ')}])`);
  }

  return lines;
}

export function generateEntityDto(entity: EntityDefinition): GeneratedFile {
  const imports = new Set<string>([
    'IsString',
    'IsOptional',
    'IsNotEmpty',
    'IsBoolean',
    'IsNumber',
    'IsUUID',
    'IsDateString',
    'IsArray',
    'IsObject',
    'IsIn',
  ]);

  // Add relevant imports
  const additionalImports: string[] = [];
  for (const field of entity.fields) {
    if (field.constraints.minLength !== undefined || field.constraints.maxLength !== undefined) {
      imports.add('MinLength');
      imports.add('MaxLength');
    }
    if (field.constraints.min !== undefined || field.constraints.max !== undefined) {
      imports.add('Min');
      imports.add('Max');
    }
    if (field.constraints.pattern) imports.add('Matches');
  }

  const lines: string[] = [
    `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';`,
    `import { ${[...imports].join(', ')} } from 'class-validator';`,
    ...additionalImports,
    '',
    `export class Create${entity.name}Dto {`,
  ];

  for (const field of entity.fields.filter((f) => !f.isId && !f.isCreatedAt && !f.isUpdatedAt)) {
    const tsType = TS_TYPE_MAP[field.type];
    const isOptional = field.constraints.nullable || !field.constraints.required;
    const apiDecorator = isOptional
      ? `  @ApiPropertyOptional({ description: '${field.description || field.name}' })`
      : `  @ApiProperty({ description: '${field.description || field.name}' })`;

    lines.push(apiDecorator);
    lines.push(...generateFieldDecorators(field));
    lines.push(`  ${field.name}${isOptional ? '?' : ''}: ${tsType};`);
    lines.push('');
  }

  lines.push('}');
  lines.push('');
  lines.push(`export class Update${entity.name}Dto {`);

  for (const field of entity.fields.filter((f) => !f.isId && !f.isCreatedAt && !f.isUpdatedAt)) {
    const tsType = TS_TYPE_MAP[field.type];
    lines.push(`  @ApiPropertyOptional()`);
    lines.push('  @IsOptional()');
    lines.push(...CLASS_VALIDATOR_MAP[field.type].map((d) => `  ${d}`));
    lines.push(`  ${field.name}?: ${tsType};`);
    lines.push('');
  }

  lines.push('}');

  return {
    path: `src/modules/${entity.name.toLowerCase()}/dto/${entity.name.toLowerCase()}.dto.ts`,
    content: lines.join('\n'),
  };
}

export function generateController(
  entity: EntityDefinition,
  endpoints: EndpointDefinition[],
): GeneratedFile {
  const entityLower = entity.name.toLowerCase();
  const entityEndpoints = endpoints.filter((e) =>
    e.tags.some((t) => t.toLowerCase() === entityLower),
  );

  const decorators: string[] = [];
  const hasAuth = entityEndpoints.some((e) => !e.isPublic);

  if (hasAuth) {
    decorators.push("import { UseGuards } from '@nestjs/common';");
    decorators.push("import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';");
    decorators.push("import { RolesGuard } from '../../auth/guards/roles.guard';");
  }

  const lines: string[] = [
    `import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';`,
    `import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';`,
    ...decorators,
    `import { ${entity.name}Service } from './${entityLower}.service';`,
    `import { Create${entity.name}Dto, Update${entity.name}Dto } from './dto/${entityLower}.dto';`,
    '',
    `@ApiTags('${entityLower}')`,
    `@Controller('${entityLower}')`,
    ...(hasAuth ? ["@UseGuards(JwtAuthGuard, RolesGuard)", "@ApiBearerAuth()"] : []),
    `export class ${entity.name}Controller {`,
    `  constructor(private readonly ${entityLower}Service: ${entity.name}Service) {}`,
    '',
  ];

  for (const endpoint of entityEndpoints) {
    const method = endpoint.method;
    const isParamRoute = endpoint.path.includes(':id');

    if (method === 'GET' && !isParamRoute) {
      lines.push(`  @Get()`);
      lines.push(`  @ApiOperation({ summary: 'Get all ${entityLower}s' })`);
      lines.push(`  @ApiResponse({ status: 200, description: 'Returns list of ${entityLower}s' })`);
      lines.push(`  findAll(@Query() query: Record<string, string>) {`);
      lines.push(`    return this.${entityLower}Service.findAll(query);`);
      lines.push(`  }`);
    } else if (method === 'GET' && isParamRoute) {
      lines.push(`  @Get(':id')`);
      lines.push(`  @ApiOperation({ summary: 'Get one ${entityLower} by id' })`);
      lines.push(`  findOne(@Param('id') id: string) {`);
      lines.push(`    return this.${entityLower}Service.findOne(id);`);
      lines.push(`  }`);
    } else if (method === 'POST') {
      lines.push(`  @Post()`);
      lines.push(`  @HttpCode(HttpStatus.CREATED)`);
      lines.push(`  @ApiOperation({ summary: 'Create ${entityLower}' })`);
      lines.push(`  create(@Body() dto: Create${entity.name}Dto) {`);
      lines.push(`    return this.${entityLower}Service.create(dto);`);
      lines.push(`  }`);
    } else if (method === 'PUT' || method === 'PATCH') {
      lines.push(`  @${method === 'PUT' ? 'Put' : 'Patch'}(':id')`);
      lines.push(`  @ApiOperation({ summary: 'Update ${entityLower}' })`);
      lines.push(`  update(@Param('id') id: string, @Body() dto: Update${entity.name}Dto) {`);
      lines.push(`    return this.${entityLower}Service.update(id, dto);`);
      lines.push(`  }`);
    } else if (method === 'DELETE') {
      lines.push(`  @Delete(':id')`);
      lines.push(`  @HttpCode(HttpStatus.NO_CONTENT)`);
      lines.push(`  @ApiOperation({ summary: 'Delete ${entityLower}' })`);
      lines.push(`  remove(@Param('id') id: string) {`);
      lines.push(`    return this.${entityLower}Service.remove(id);`);
      lines.push(`  }`);
    }

    lines.push('');
  }

  lines.push('}');

  return {
    path: `src/modules/${entityLower}/${entityLower}.controller.ts`,
    content: lines.join('\n'),
  };
}

export function generateService(entity: EntityDefinition): GeneratedFile {
  const entityLower = entity.name.toLowerCase();

  const lines: string[] = [
    `import { Injectable, NotFoundException } from '@nestjs/common';`,
    `import { PrismaService } from '../../infrastructure/prisma/prisma.service';`,
    `import { Create${entity.name}Dto, Update${entity.name}Dto } from './dto/${entityLower}.dto';`,
    '',
    `@Injectable()`,
    `export class ${entity.name}Service {`,
    `  constructor(private readonly prisma: PrismaService) {}`,
    '',
    `  async findAll(query: Record<string, string>) {`,
    `    const { page = '1', limit = '20', ...filters } = query;`,
    `    const skip = (Number(page) - 1) * Number(limit);`,
    `    const [items, total] = await this.prisma.$transaction([`,
    `      this.prisma.${entityLower}.findMany({`,
    `        skip,`,
    `        take: Number(limit),`,
    `        where: Object.keys(filters).length ? filters : undefined,`,
    `        orderBy: { createdAt: 'desc' },`,
    `      }),`,
    `      this.prisma.${entityLower}.count(),`,
    `    ]);`,
    `    return {`,
    `      data: items,`,
    `      meta: {`,
    `        total,`,
    `        page: Number(page),`,
    `        limit: Number(limit),`,
    `        totalPages: Math.ceil(total / Number(limit)),`,
    `      },`,
    `    };`,
    `  }`,
    '',
    `  async findOne(id: string) {`,
    `    const item = await this.prisma.${entityLower}.findUnique({ where: { id } });`,
    `    if (!item) throw new NotFoundException(\`${entity.name} \${id} not found\`);`,
    `    return { data: item };`,
    `  }`,
    '',
    `  async create(dto: Create${entity.name}Dto) {`,
    `    const item = await this.prisma.${entityLower}.create({ data: dto });`,
    `    return { data: item };`,
    `  }`,
    '',
    `  async update(id: string, dto: Update${entity.name}Dto) {`,
    `    await this.findOne(id);`,
    `    const item = await this.prisma.${entityLower}.update({ where: { id }, data: dto });`,
    `    return { data: item };`,
    `  }`,
    '',
    `  async remove(id: string) {`,
    `    await this.findOne(id);`,
    `    await this.prisma.${entityLower}.delete({ where: { id } });`,
    `  }`,
    '}',
  ];

  return {
    path: `src/modules/${entityLower}/${entityLower}.service.ts`,
    content: lines.join('\n'),
  };
}

export function generateModule(entity: EntityDefinition): GeneratedFile {
  const entityLower = entity.name.toLowerCase();
  const lines: string[] = [
    `import { Module } from '@nestjs/common';`,
    `import { ${entity.name}Controller } from './${entityLower}.controller';`,
    `import { ${entity.name}Service } from './${entityLower}.service';`,
    '',
    `@Module({`,
    `  controllers: [${entity.name}Controller],`,
    `  providers: [${entity.name}Service],`,
    `  exports: [${entity.name}Service],`,
    `})`,
    `export class ${entity.name}Module {}`,
  ];
  return {
    path: `src/modules/${entityLower}/${entityLower}.module.ts`,
    content: lines.join('\n'),
  };
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export function generateNestJsProject(
  metadata: ProjectMetadata,
  projectName: string,
): GeneratedFile[] {
  const files: GeneratedFile[] = [];

  for (const entity of metadata.entities) {
    files.push(generateEntityDto(entity));
    files.push(generateController(entity, metadata.endpoints));
    files.push(generateService(entity));
    files.push(generateModule(entity));
  }

  return files;
}
