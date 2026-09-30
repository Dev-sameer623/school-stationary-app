import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import type { UserInput, UserUpdateInput } from "@/lib/validations";

async function keepAnActiveAdmin(
  userId: string,
  next: { role: "ADMIN" | "MANAGER"; status: "ACTIVE" | "INACTIVE" },
) {
  const current = await prisma.user.findUnique({ where: { id: userId } });
  if (!current) throw new AppError("User not found.");

  const removesLastAdmin =
    current.role === "ADMIN" &&
    current.status === "ACTIVE" &&
    (next.role !== "ADMIN" || next.status !== "ACTIVE");

  if (!removesLastAdmin) return;

  const others = await prisma.user.count({
    where: { role: "ADMIN", status: "ACTIVE", NOT: { id: userId } },
  });
  if (others === 0) {
    throw new AppError("At least one active admin is required.");
  }
}

export async function listUsers(filters?: { query?: string; status?: "ACTIVE" | "INACTIVE" | "ALL" }) {
  const query = filters?.query?.trim();
  const where: Prisma.UserWhereInput = {};
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }
  if (filters?.status && filters.status !== "ALL") where.status = filters.status;

  return prisma.user.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createUser(input: UserInput) {
  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, 10),
        role: input.role,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("A user with this email already exists.");
    }
    throw error;
  }
}

export async function updateUser(id: string, input: UserUpdateInput) {
  await keepAnActiveAdmin(id, { role: input.role, status: input.status });
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        role: input.role,
        status: input.status,
        ...(input.password
          ? { passwordHash: await bcrypt.hash(input.password, 10) }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("A user with this email already exists.");
    }
    throw error;
  }
}
