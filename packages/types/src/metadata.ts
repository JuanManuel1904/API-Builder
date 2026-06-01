// ============================================================
// CORE METADATA TYPES — Visual API Builder
// The system stores metadata, NOT code.
// From this metadata we generate everything.
// ============================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'uuid'
  | 'enum'
  | 'json'
  | 'array';

export type RelationType = 'OneToOne' | 'OneToMany' | 'ManyToOne' | 'ManyToMany';

export type NodeType =
  | 'request'
  | 'response'
  | 'auth'
  | 'validation'
  | 'db-query'
  | 'condition'
  | 'transform'
  | 'external-api'
  | 'cache'
  | 'logger';

export type AuthStrategy = 'jwt' | 'api-key' | 'basic' | 'oauth2' | 'none';

export type UserRole = 'admin' | 'developer' | 'viewer';

// ── Field Constraint ────────────────────────────────────────
export interface FieldConstraint {
  required?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: string | number | boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enumValues?: string[];
}

// ── Entity Field ────────────────────────────────────────────
export interface EntityField {
  id: string;
  name: string;
  type: FieldType;
  constraints: FieldConstraint;
  description?: string;
  isId?: boolean;
  isCreatedAt?: boolean;
  isUpdatedAt?: boolean;
}

// ── Entity Definition ────────────────────────────────────────
export interface EntityDefinition {
  id: string;
  name: string;
  description?: string;
  tableName: string;
  fields: EntityField[];
  timestamps: boolean;
  softDelete: boolean;
}

// ── Relation Definition ──────────────────────────────────────
export interface RelationDefinition {
  id: string;
  type: RelationType;
  fromEntityId: string;
  toEntityId: string;
  fromFieldName: string;
  toFieldName: string;
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION';
}

// ── Flow Node ────────────────────────────────────────────────
export interface FlowNodePosition {
  x: number;
  y: number;
}

export interface RequestNodeConfig {
  method: HttpMethod;
  path: string;
  contentType: string;
  rateLimitEnabled: boolean;
  rateLimitMax?: number;
  rateLimitWindow?: number;
}

export interface AuthNodeConfig {
  strategy: AuthStrategy;
  roles: string[];
  isPublic: boolean;
  refreshTokenEnabled: boolean;
}

export interface ValidationNodeConfig {
  entityId: string;
  mode: 'strict' | 'partial' | 'passthrough';
  whitelist: boolean;
  forbidNonWhitelisted: boolean;
  transform: boolean;
}

export interface DbQueryNodeConfig {
  entityId: string;
  operation: 'findMany' | 'findOne' | 'create' | 'update' | 'delete' | 'upsert';
  selectFields: string[];
  includeRelations: boolean;
  useTransaction: boolean;
  softDelete: boolean;
  paginationEnabled: boolean;
  filterFromQuery: boolean;
}

export interface TransformNodeConfig {
  script: string;
  inputSchema?: Record<string, string>;
  outputSchema?: Record<string, string>;
}

export interface ResponseNodeConfig {
  statusCode: number;
  entityId?: string;
  isArray: boolean;
  wrapInData: boolean;
  includeMeta: boolean;
  compress: boolean;
}

export interface ConditionNodeConfig {
  expression: string;
  trueLabel: string;
  falseLabel: string;
}

export interface ExternalApiNodeConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  bodyTemplate?: string;
  timeout: number;
  retries: number;
}

export interface CacheNodeConfig {
  key: string;
  ttl: number;
  strategy: 'memory' | 'redis';
}

export interface LoggerNodeConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  includePayload: boolean;
}

export type FlowNodeConfig =
  | RequestNodeConfig
  | AuthNodeConfig
  | ValidationNodeConfig
  | DbQueryNodeConfig
  | TransformNodeConfig
  | ResponseNodeConfig
  | ConditionNodeConfig
  | ExternalApiNodeConfig
  | CacheNodeConfig
  | LoggerNodeConfig;

export interface FlowNode {
  id: string;
  type: NodeType;
  position: FlowNodePosition;
  config: FlowNodeConfig;
  label?: string;
}

// ── Flow Edge ────────────────────────────────────────────────
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string;
}

// ── Flow Definition ──────────────────────────────────────────
export interface FlowDefinition {
  id: string;
  endpointId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// ── Endpoint Definition ──────────────────────────────────────
export interface EndpointDefinition {
  id: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  flowId?: string;
}

// ── Auth Config ──────────────────────────────────────────────
export interface AuthConfig {
  strategy: AuthStrategy;
  jwtSecret?: string;
  jwtExpiresIn?: string;
  refreshTokenEnabled?: boolean;
  apiKeyHeader?: string;
}

// ── Validation Rule ──────────────────────────────────────────
export interface ValidationRule {
  id: string;
  entityId: string;
  fieldId: string;
  rule: string;
  message: string;
}

// ── Project Metadata (the root object) ──────────────────────
export interface ProjectMetadata {
  entities: EntityDefinition[];
  relations: RelationDefinition[];
  flows: FlowDefinition[];
  endpoints: EndpointDefinition[];
  validations: ValidationRule[];
  auth: AuthConfig;
}

// ── API Responses ────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

// ── Project ──────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  metadata: ProjectMetadata;
  version: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  version: number;
  isPublic: boolean;
  entityCount: number;
  endpointCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

// ── Code Export ──────────────────────────────────────────────
export type ExportFormat = 'nestjs' | 'prisma' | 'openapi' | 'postman' | 'docker';

export interface ExportRequest {
  projectId: string;
  formats: ExportFormat[];
}

// ── Frontend DTO types (request payloads) ────────────────────
// These mirror the backend DTOs for use in frontend API calls.

export interface CreateProjectDto {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface CreateEntityDto {
  name: string;
  description?: string;
  tableName: string;
  fields: EntityField[];
  timestamps?: boolean;
  softDelete?: boolean;
}

export interface CreateEndpointDto {
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface SaveFlowDto {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
