import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsObject,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'My E-commerce API' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'REST API for e-commerce platform' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class UpdateProjectMetadataDto {
  @ApiProperty({ description: 'Full project metadata graph (entities, flows, endpoints...)' })
  @IsObject()
  metadata: Record<string, unknown>;
}
