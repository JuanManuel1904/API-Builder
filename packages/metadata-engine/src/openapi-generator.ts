import type {
  ProjectMetadata,
  EntityDefinition,
  EntityField,
  EndpointDefinition,
  FieldType,
  HttpMethod,
} from '@vab/types';

const JSON_SCHEMA_TYPE_MAP: Record<FieldType, object> = {
  string: { type: 'string' },
  number: { type: 'number' },
  boolean: { type: 'boolean' },
  date: { type: 'string', format: 'date-time' },
  uuid: { type: 'string', format: 'uuid' },
  enum: { type: 'string' },
  json: { type: 'object' },
  array: { type: 'array', items: {} },
};

function fieldToJsonSchema(field: EntityField): object {
  const base = { ...JSON_SCHEMA_TYPE_MAP[field.type] };

  if (field.constraints.enumValues?.length) {
    return { ...base, enum: field.constraints.enumValues };
  }

  const extras: Record<string, unknown> = {};
  if (field.constraints.minLength !== undefined) extras.minLength = field.constraints.minLength;
  if (field.constraints.maxLength !== undefined) extras.maxLength = field.constraints.maxLength;
  if (field.constraints.min !== undefined) extras.minimum = field.constraints.min;
  if (field.constraints.max !== undefined) extras.maximum = field.constraints.max;
  if (field.constraints.pattern) extras.pattern = field.constraints.pattern;
  if (field.description) extras.description = field.description;

  return { ...base, ...extras };
}

function entityToSchema(entity: EntityDefinition): object {
  const properties: Record<string, object> = {};
  const required: string[] = [];

  for (const field of entity.fields) {
    properties[field.name] = fieldToJsonSchema(field);
    if (field.constraints.required && !field.constraints.nullable) {
      required.push(field.name);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function getOperationIdFromEndpoint(endpoint: EndpointDefinition): string {
  const method = endpoint.method.toLowerCase();
  const pathParts = endpoint.path
    .split('/')
    .filter(Boolean)
    .map((p) => {
      if (p.startsWith(':')) return 'By' + p.slice(1).charAt(0).toUpperCase() + p.slice(2);
      return p.charAt(0).toUpperCase() + p.slice(1);
    });
  return `${method}${pathParts.join('')}`;
}

function buildPathItem(
  endpoints: EndpointDefinition[],
  path: string,
  metadata: ProjectMetadata,
): Record<string, unknown> {
  const pathItem: Record<string, unknown> = {};
  const endpointsForPath = endpoints.filter((e) => e.path === path);

  for (const endpoint of endpointsForPath) {
    const method = endpoint.method.toLowerCase() as Lowercase<HttpMethod>;

    const parameters: object[] = [];

    // Extract path parameters
    const pathParams = (endpoint.path.match(/:([^/]+)/g) || []).map((p) => p.slice(1));
    for (const param of pathParams) {
      parameters.push({
        name: param,
        in: 'path',
        required: true,
        schema: { type: 'string' },
      });
    }

    const operation: Record<string, unknown> = {
      operationId: getOperationIdFromEndpoint(endpoint),
      summary: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      description: endpoint.description,
      tags: endpoint.tags.length > 0 ? endpoint.tags : ['default'],
      parameters,
    };

    if (!endpoint.isPublic) {
      operation.security = [{ bearerAuth: [] }];
    }

    // Request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      const tag = endpoint.tags[0];
      const entity = tag
        ? metadata.entities.find((e) => e.name.toLowerCase() === tag.toLowerCase())
        : null;

      operation.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: entity
              ? { $ref: `#/components/schemas/${entity.name}` }
              : { type: 'object' },
          },
        },
      };
    }

    // Responses
    const statusCode = endpoint.method === 'POST' ? '201' : '200';
    const tag = endpoint.tags[0];
    const entity = tag
      ? metadata.entities.find((e) => e.name.toLowerCase() === tag.toLowerCase())
      : null;

    const responseSchema = entity
      ? {
          type: 'object',
          properties: {
            data: { $ref: `#/components/schemas/${entity.name}` },
          },
        }
      : { type: 'object' };

    operation.responses = {
      [statusCode]: {
        description: 'Success',
        content: {
          'application/json': { schema: responseSchema },
        },
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      '401': { description: 'Unauthorized' },
      '403': { description: 'Forbidden' },
      '404': { description: 'Not Found' },
      '500': { description: 'Internal Server Error' },
    };

    pathItem[method] = operation;
  }

  return pathItem;
}

export function generateOpenApiSpec(
  metadata: ProjectMetadata,
  projectName: string,
  version = '1.0.0',
): object {
  // Build schemas from entities
  const schemas: Record<string, object> = {};
  for (const entity of metadata.entities) {
    schemas[entity.name] = entityToSchema(entity);
  }

  // Add error schema
  schemas['ErrorResponse'] = {
    type: 'object',
    properties: {
      statusCode: { type: 'number' },
      message: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
      error: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
    },
  };

  // Group endpoints by path
  const pathMap = new Map<string, EndpointDefinition[]>();
  for (const endpoint of metadata.endpoints) {
    const normalizedPath = endpoint.path.replace(/:([^/]+)/g, '{$1}');
    if (!pathMap.has(normalizedPath)) {
      pathMap.set(normalizedPath, []);
    }
    pathMap.get(normalizedPath)!.push({
      ...endpoint,
      path: normalizedPath,
    });
  }

  const paths: Record<string, object> = {};
  for (const [path, endpointsForPath] of pathMap) {
    paths[path] = buildPathItem(endpointsForPath, path, metadata);
  }

  return {
    openapi: '3.0.3',
    info: {
      title: projectName,
      version,
      description: `API generated by Visual API Builder`,
    },
    servers: [
      { url: 'http://localhost:3001', description: 'Development' },
      { url: 'https://api.yourdomain.com', description: 'Production' },
    ],
    paths,
    components: {
      schemas,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: metadata.entities.map((e) => ({
      name: e.name.toLowerCase(),
      description: e.description || `${e.name} operations`,
    })),
  };
}
