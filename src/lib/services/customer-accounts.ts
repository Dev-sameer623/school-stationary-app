import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import type { CustomerSignupInput } from "@/lib/validations";

export async function registerCustomer(input: CustomerSignupInput) {
  const email = input.email.toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const existing = await prisma.customer.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    throw new AppError("This email is already registered. Log in.");
  }

  if (existing) {
    return prisma.customer.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        phone: input.phone,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });
  }

  try {
    return await prisma.customer.create({
      data: {
        name: input.name,
        phone: input.phone,
        email,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("This email is already registered. Log in.");
    }
    throw error;
  }
}

export async function authenticateCustomer(email: string, password: string) {
  const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
  if (!customer?.passwordHash) return null;
  const matches = await bcrypt.compare(password, customer.passwordHash);
  if (!matches) return null;
  return customer;
}
