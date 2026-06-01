import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class FlowNodePositionDto {
  @ApiProperty() x: number;
  @ApiProperty() y: number;
}

export class FlowNodeDto {
  @ApiProperty() @IsString() @IsNotEmpty() id: string;
  @ApiProperty() @IsString() @IsNotEmpty() type: string;
  @ApiProperty() @ValidateNested() @Type(() => FlowNodePositionDto) position: FlowNodePositionDto;
  @ApiProperty() @IsObject() config: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
}

export class FlowEdgeDto {
  @ApiProperty() @IsString() @IsNotEmpty() id: string;
  @ApiProperty() @IsString() @IsNotEmpty() source: string;
  @ApiProperty() @IsString() @IsNotEmpty() target: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceHandle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetHandle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() label?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() condition?: string;
}

export class SaveFlowDto {
  @ApiProperty({ type: [FlowNodeDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => FlowNodeDto) nodes: FlowNodeDto[];

  @ApiProperty({ type: [FlowEdgeDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => FlowEdgeDto) edges: FlowEdgeDto[];
}
