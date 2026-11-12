import { authV2Prisma } from "./prisma.js";

export const ALL_ROLES = [
  "OWNER",
  "ADMIN",
  "HR_MANAGER",
  "ACCOUNTANT",
  "SALES_MANAGER",
  "PROJECT_MANAGER",
  "DEPARTMENT_MANAGER",
  "WAREHOUSE_MANAGER",
  "TECHNICIAN",
  "WAREHOUSE_EMPLOYEE",
  "SALES_EMPLOYEE",
  "EMPLOYEE",
] as const;

export type Role = (typeof ALL_ROLES)[number];

/** Roles an ADMIN may manage or assign. ADMIN can never manage OWNER or ADMIN. */
export const ADMIN_MANAGEABLE_ROLES: readonly Role[] = ALL_ROLES.filter(
  (role) => role !== "OWNER" && role !== "ADMIN",
);

export class PolicyError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status = 403) {
    super(code);
    this.name = "PolicyError";
    this.code = code;
    this.status = status;
  }
}

export type Actor = { id: string; role: string; isActive: boolean };

export type UserChanges = {
  role?: Role;
  isActive?: boolean;
};

export type RequestMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ALL_ROLES.includes(value as Role);
}

export function canManageTarget(actorRole: string, targetRole: string): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") {
    return ADMIN_MANAGEABLE_ROLES.includes(targetRole as Role);
  }
  return false;
}

export function canAssignRole(actorRole: string, nextRole: Role): boolean {
  if (actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") return ADMIN_MANAGEABLE_ROLES.includes(nextRole);
  return false;
}

/**
 * Applies a role/activation change with:
 *  - last-OWNER protection under a row lock
 *  - self-modification protection
 *  - ADMIN scope enforcement
 *  - atomic session revocation on role change / deactivation
 *  - append-only security event
 */
export async function updateUserAs(
  actor: Actor,
  targetId: string,
  changes: UserChanges,
  meta: RequestMeta = {},
) {
  return authV2Prisma.$transaction(async (tx) => {
    // Lock all active OWNER rows so concurrent demotions cannot both pass the
    // "more than one owner" check.
    const owners = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "AppUser"
      WHERE role = 'OWNER' AND "isActive" = true
      FOR UPDATE
    `;

    const target = await tx.appUser.findUnique({ where: { id: targetId } });
    if (!target) throw new PolicyError("USER_NOT_FOUND", 404);

    if (
      target.id === actor.id &&
      (changes.role !== undefined || changes.isActive === false)
    ) {
      throw new PolicyError("SELF_MODIFICATION_FORBIDDEN", 403);
    }

    if (!canManageTarget(actor.role, target.role)) {
      throw new PolicyError("INSUFFICIENT_PERMISSIONS", 403);
    }
    if (changes.role !== undefined && !canAssignRole(actor.role, changes.role)) {
      throw new PolicyError("INSUFFICIENT_PERMISSIONS", 403);
    }

    const removesActiveOwner =
      target.role === "OWNER" &&
      target.isActive &&
      ((changes.role !== undefined && changes.role !== "OWNER") ||
        changes.isActive === false);

    if (removesActiveOwner && owners.length <= 1) {
      throw new PolicyError("LAST_OWNER_PROTECTION", 409);
    }

    const updated = await tx.appUser.update({
      where: { id: targetId },
      data: {
        ...(changes.role !== undefined ? { role: changes.role } : {}),
        ...(changes.isActive !== undefined ? { isActive: changes.isActive } : {}),
      },
    });

    const mustRevoke =
      changes.role !== undefined || changes.isActive === false;

    if (mustRevoke) {
      await tx.session.deleteMany({ where: { userId: targetId } });
    }

    await tx.securityEvent.create({
      data: {
        eventType: mustRevoke ? "USER_SECURITY_CHANGE" : "USER_UPDATE",
        actorId: actor.id,
        targetId,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        metadata: {
          roleChanged: changes.role !== undefined,
          previousRole: target.role,
          newRole: changes.role ?? target.role,
          isActive: changes.isActive ?? target.isActive,
          sessionsRevoked: mustRevoke,
        },
      },
    });

    return updated;
  });
}

/**
 * Atomic OWNER transfer: promote target, demote actor, revoke both sessions,
 * write one audit event. Always leaves at least one active OWNER.
 */
export async function transferOwnership(
  actor: Actor,
  targetId: string,
  meta: RequestMeta = {},
) {
  return authV2Prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM "AppUser"
      WHERE role = 'OWNER' AND "isActive" = true
      FOR UPDATE
    `;

    if (actor.role !== "OWNER") {
      throw new PolicyError("INSUFFICIENT_PERMISSIONS", 403);
    }

    const actorRow = await tx.appUser.findUnique({ where: { id: actor.id } });
    const target = await tx.appUser.findUnique({ where: { id: targetId } });
    if (!actorRow || !actorRow.isActive || actorRow.role !== "OWNER") {
      throw new PolicyError("INSUFFICIENT_PERMISSIONS", 403);
    }
    if (!target) throw new PolicyError("USER_NOT_FOUND", 404);
    if (target.id === actor.id) {
      throw new PolicyError("SELF_MODIFICATION_FORBIDDEN", 403);
    }
    if (!target.isActive) throw new PolicyError("TARGET_INACTIVE", 409);

    await tx.appUser.update({ where: { id: target.id }, data: { role: "OWNER" } });
    await tx.appUser.update({ where: { id: actor.id }, data: { role: "ADMIN" } });
    await tx.session.deleteMany({
      where: { userId: { in: [actor.id, target.id] } },
    });
    await tx.securityEvent.create({
      data: {
        eventType: "OWNER_TRANSFER",
        actorId: actor.id,
        targetId: target.id,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
        metadata: { previousOwnerId: actor.id, newOwnerId: target.id },
      },
    });

    return { previousOwnerId: actor.id, newOwnerId: target.id };
  });
}
