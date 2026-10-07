import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/utils";
import type { CustomerInput } from "@/lib/validations";

function uniqueCustomer(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError("A customer with this email already exists.");
  }
  throw error;
}

export async function listCustomers(query: string, page: number) {
  const where: Prisma.CustomerWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCustomer(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createCustomer(input: CustomerInput) {
  try {
    return await prisma.customer.create({
      data: {
        name: input.name,
        phone: input.phone || null,
        email: input.email?.toLowerCase() || null,
        address: input.address || null,
      },
    });
  } catch (error) {
    uniqueCustomer(error);
  }
}

export async function updateCustomer(id: string, input: CustomerInput) {
  try {
    return await prisma.customer.update({
      where: { id },
      data: {
        name: input.name,
        phone: input.phone || null,
        email: input.email?.toLowerCase() || null,
        address: input.address || null,
      },
    });
  } catch (error) {
    uniqueCustomer(error);
  }
}
