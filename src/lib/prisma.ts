import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends({
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          const result = await query(args);
          return result;
        } catch (error) {
          // You can add more sophisticated error logging here
          console.error(`Error in Prisma operation '${operation}' on model '${model}':`, error);
          // Re-throw the error to be handled by the calling function
          throw error;
        }
      },
    },
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
