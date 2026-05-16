import prisma from "@/lib/prisma";

export async function createAuditLog({
  adminId,
  action,
  entityType,
  entityId,
  details,
}: {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        details: details || {},
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error to avoid breaking the main transaction if audit logging fails
  }
}
