import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking data integrity...\n')

  // Check users
  const users = await prisma.user.count()
  console.log(`Total users: ${users}`)

  // Check products
  const products = await prisma.product.count()
  console.log(`Total products: ${products}`)

  // Check sales
  const sales = await prisma.sale.count()
  console.log(`Total sales: ${sales}`)

  // Check audit logs
  const auditLogs = await prisma.auditLog.count()
  console.log(`Total audit logs: ${auditLogs}`)

  // Check for orphaned sales
  console.log('\n--- Checking for orphaned sales ---')
  const allSales = await prisma.sale.findMany({
    select: { id: true, userId: true, productId: true }
  })
  
  const allUsers = await prisma.user.findMany({
    select: { id: true }
  })
  
  const validUserIds = new Set(allUsers.map(u => u.id))
  const orphanedSales = allSales.filter(sale => !validUserIds.has(sale.userId))
  
  if (orphanedSales.length > 0) {
    console.log(`⚠️  Found ${orphanedSales.length} orphaned sales`)
    console.log('Orphaned sale IDs:', orphanedSales.map(s => s.id))
  } else {
    console.log('✅ No orphaned sales found')
  }

  // Check for orphaned audit logs
  console.log('\n--- Checking for orphaned audit logs ---')
  const allAuditLogs = await prisma.auditLog.findMany({
    select: { id: true, userId: true }
  })
  
  const orphanedAuditLogs = allAuditLogs.filter(log => log.userId === null || !validUserIds.has(log.userId))
  
  if (orphanedAuditLogs.length > 0) {
    console.log(`⚠️  Found ${orphanedAuditLogs.length} orphaned audit logs`)
    console.log('Orphaned audit log IDs:', orphanedAuditLogs.map(l => l.id))
  } else {
    console.log('✅ No orphaned audit logs found')
  }

  // Check for orphaned products in sales
  console.log('\n--- Checking for orphaned products in sales ---')
  const allProducts = await prisma.product.findMany({
    select: { id: true }
  })
  
  const validProductIds = new Set(allProducts.map(p => p.id))
  const salesWithInvalidProducts = allSales.filter(sale => !validProductIds.has(sale.productId))
  
  if (salesWithInvalidProducts.length > 0) {
    console.log(`⚠️  Found ${salesWithInvalidProducts.length} sales with invalid products`)
    console.log('Sale IDs with invalid products:', salesWithInvalidProducts.map(s => s.id))
  } else {
    console.log('✅ No sales with invalid products found')
  }

  console.log('\n--- Data integrity check complete ---')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
