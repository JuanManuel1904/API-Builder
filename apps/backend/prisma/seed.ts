import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@vab.dev' },
    update: {},
    create: {
      email: 'demo@vab.dev',
      name: 'Demo User',
      passwordHash,
      role: 'DEVELOPER',
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // Create demo project
  const demoMetadata = {
    entities: [
      {
        id: 'ent-user-001',
        name: 'User',
        description: 'Application user',
        tableName: 'users',
        timestamps: true,
        softDelete: false,
        fields: [
          { id: 'f001', name: 'id', type: 'uuid', isId: true, constraints: {} },
          {
            id: 'f002',
            name: 'email',
            type: 'string',
            constraints: { required: true, unique: true },
          },
          { id: 'f003', name: 'name', type: 'string', constraints: { required: true } },
          {
            id: 'f004',
            name: 'role',
            type: 'enum',
            constraints: { enumValues: ['admin', 'user'], default: 'user' },
          },
          { id: 'f005', name: 'createdAt', type: 'date', isCreatedAt: true, constraints: {} },
          { id: 'f006', name: 'updatedAt', type: 'date', isUpdatedAt: true, constraints: {} },
        ],
      },
      {
        id: 'ent-product-001',
        name: 'Product',
        description: 'Store product',
        tableName: 'products',
        timestamps: true,
        softDelete: true,
        fields: [
          { id: 'p001', name: 'id', type: 'uuid', isId: true, constraints: {} },
          { id: 'p002', name: 'name', type: 'string', constraints: { required: true } },
          { id: 'p003', name: 'price', type: 'number', constraints: { required: true, min: 0 } },
          { id: 'p004', name: 'stock', type: 'number', constraints: { default: 0 } },
          { id: 'p005', name: 'createdAt', type: 'date', isCreatedAt: true, constraints: {} },
          { id: 'p006', name: 'updatedAt', type: 'date', isUpdatedAt: true, constraints: {} },
        ],
      },
    ],
    relations: [],
    flows: [],
    endpoints: [
      {
        id: 'ep001',
        method: 'GET',
        path: '/users',
        tags: ['user'],
        isPublic: false,
        summary: 'List users',
      },
      {
        id: 'ep002',
        method: 'POST',
        path: '/users',
        tags: ['user'],
        isPublic: true,
        summary: 'Create user',
      },
      {
        id: 'ep003',
        method: 'GET',
        path: '/users/:id',
        tags: ['user'],
        isPublic: false,
        summary: 'Get user',
      },
      {
        id: 'ep004',
        method: 'PUT',
        path: '/users/:id',
        tags: ['user'],
        isPublic: false,
        summary: 'Update user',
      },
      {
        id: 'ep005',
        method: 'DELETE',
        path: '/users/:id',
        tags: ['user'],
        isPublic: false,
        summary: 'Delete user',
      },
      {
        id: 'ep006',
        method: 'GET',
        path: '/products',
        tags: ['product'],
        isPublic: true,
        summary: 'List products',
      },
      {
        id: 'ep007',
        method: 'POST',
        path: '/products',
        tags: ['product'],
        isPublic: false,
        summary: 'Create product',
      },
    ],
    validations: [],
    auth: { strategy: 'jwt', jwtExpiresIn: '15m', refreshTokenEnabled: true },
  };

  const project = await prisma.project.create({
    data: {
      name: 'E-Commerce API',
      description: 'Demo e-commerce REST API built with Visual API Builder',
      ownerId: user.id,
      metadata: demoMetadata,
      isPublic: false,
    },
  });

  console.log(`✅ Demo project created: ${project.name}`);
  console.log('\n🎉 Seed complete!');
  console.log('   Login: demo@vab.dev / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
