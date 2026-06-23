import { PrismaClient } from '@prisma/client';

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client
export const db = globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production'
      ? ['warn', 'error']
      : ['query', 'info', 'warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Database utility functions
export async function connect(): Promise<void> {
  try {
    console.log('🔌 Connecting to database...');
    
    // Prisma client should be pre-generated during build
    
    await db.$connect();
    
    // Test the connection
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Database connection failed:', errorMessage);
    throw new Error(`Database connection failed: ${errorMessage}`);
  }
}

export async function disconnect(): Promise<void> {
  await db.$disconnect();
}

export async function healthCheck(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Legacy compatibility
export class DatabaseManager {
  static getInstance() {
    return {
      getClient: () => db,
      connect,
      disconnect,
      healthCheck
    };
  }
}