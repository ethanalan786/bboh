import { prisma } from "@/lib/prisma"
import { AuditAction } from "@prisma/client"

export interface AuditLogData {
  userId?: string
  actionType: AuditAction
  entityType: string
  entityId?: string
  description: string
  previousValue?: string
  newValue?: string
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        actionType: data.actionType,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
        previousValue: data.previousValue,
        newValue: data.newValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw error to avoid breaking the main operation
  }
}

export async function createBulkAuditLog(
  userId: string | undefined,
  actionType: AuditAction,
  entityType: string,
  entityIds: string[],
  description: string,
  previousValues?: any[],
  newValues?: any[],
  ipAddress?: string,
  userAgent?: string
) {
  try {
    // Create a single audit log entry for the bulk operation
    await prisma.auditLog.create({
      data: {
        userId,
        actionType,
        entityType,
        entityId: entityIds.join(','), // Store all IDs as comma-separated
        description,
        previousValue: previousValues ? JSON.stringify(previousValues) : undefined,
        newValue: newValues ? JSON.stringify(newValues) : undefined,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Failed to create bulk audit log:", error)
    // Don't throw error to avoid breaking the main operation
  }
}

export function formatProductChange(previous: any, current: any): string {
  const changes: string[] = []
  
  if (previous.name !== current.name) changes.push(`name: "${previous.name}" → "${current.name}"`)
  if (previous.sku !== current.sku) changes.push(`SKU: "${previous.sku}" → "${current.sku}"`)
  if (previous.category !== current.category) changes.push(`category: "${previous.category}" → "${current.category}"`)
  if (previous.size !== current.size) changes.push(`size: "${previous.size}" → "${current.size}"`)
  if (previous.color !== current.color) changes.push(`color: "${previous.color}" → "${current.color}"`)
  if (previous.stock !== current.stock) changes.push(`stock: ${previous.stock} → ${current.stock}`)
  if (previous.sellingPrice !== current.sellingPrice) changes.push(`price: $${previous.sellingPrice} → $${current.sellingPrice}`)
  if (previous.description !== current.description) changes.push(`description updated`)
  if (previous.materialCost !== current.materialCost) changes.push(`material cost: $${previous.materialCost} → $${current.materialCost}`)
  if (previous.laborCost !== current.laborCost) changes.push(`labor cost: $${previous.laborCost} → $${current.laborCost}`)
  if (previous.shippingCost !== current.shippingCost) changes.push(`shipping cost: $${previous.shippingCost} → $${current.shippingCost}`)
  if (previous.overheadCost !== current.overheadCost) changes.push(`overhead cost: $${previous.overheadCost} → $${current.overheadCost}`)
  if (previous.otherCost !== current.otherCost) changes.push(`other cost: $${previous.otherCost} → $${current.otherCost}`)
  
  return changes.length > 0 ? changes.join(", ") : "No changes detected"
}