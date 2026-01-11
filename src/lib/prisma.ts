import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/src/app/generated/prisma";

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
};

function getPrisma(): PrismaClient {
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not set");
    }

    const client = new PrismaClient({
        adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });

    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
    }

    return client;
}

const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        return getPrisma()[prop as keyof PrismaClient];
    },
});

export default prisma;
