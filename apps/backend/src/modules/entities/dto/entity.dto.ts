import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FieldConstraintDto {
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsBoolean() unique?: boolean;
  @IsOptional() @IsBoolean() nullable?: boolean;
  @IsOptional() default?: string | number | boolean;
  @IsOptional() min?: number;
  @IsOptional() max?: number;
  @IsOptional() minLength?: number;
  @IsOptional() maxLength?: number;
  @IsOptional() @IsString() pattern?: string;
  @IsOptional() @IsArray() enumValues?: string[];
}

const FIELD_TYPES = ['string', 'number', 'boolean', 'date', 'uuid', 'enum', 'json', 'array'];

export class EntityFieldDto {
  @ApiProperty() @IsString() @IsNotEmpty() id: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ enum: FIELD_TYPES }) @IsIn(FIELD_TYPES) type: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() @ValidateNested() @Type(() => FieldConstraintDto) constraints?: FieldConstraintDto;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isId?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCreatedAt?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isUpdatedAt?: boolean;
}

export class CreateEntityDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() @IsNotEmpty() tableName: string;
  @ApiProperty({ type: [EntityFieldDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => EntityFieldDto) fields: EntityFieldDto[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() timestamps?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() softDelete?: boolean;
}

export class CreateRelationDto {
  @ApiProperty({ enum: ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'] })
  @IsIn(['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany']) type: string;
  @ApiProperty() @IsString() fromEntityId: string;
  @ApiProperty() @IsString() toEntityId: string;
  @ApiProperty() @IsString() fromFieldName: string;
  @ApiProperty() @IsString() toFieldName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() onDelete?: string;
}
