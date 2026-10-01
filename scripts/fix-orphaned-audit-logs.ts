import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for orphaned audit logs...')

  // Find all audit logs
  const allAuditLogs = await prisma.auditLog.findMany({
    select: {
      id: true,
      userId: true
    }
  })

  console.log(`Total audit logs found: ${allAuditLogs.length}`)

  // Find all valid user IDs
  const allUsers = await prisma.user.findMany({
    select: {
      id: true
    }
  })

  const validUserIds = new Set(allUsers.map(u => u.id))
  console.log(`Valid users found: ${validUserIds.size}`)

  // Identify orphaned audit logs
  const orphanedAuditLogs = allAuditLogs.filter(log => log.userId === null || !validUserIds.has(log.userId))
  
  console.log(`Orphaned audit logs found: ${orphanedAuditLogs.length}`)

  if (orphanedAuditLogs.length > 0) {
    console.log('Orphaned audit log IDs:', orphanedAuditLogs.map(l => l.id))
    
    // Delete orphaned audit logs
    console.log('\nDeleting orphaned audit logs...')
    const deleteResult = await prisma.auditLog.deleteMany({
      where: {
        id: {
          in: orphanedAuditLogs.map(l => l.id)
        }
      }
    })
    
    console.log(`Deleted ${deleteResult.count} orphaned audit logs`)
  } else {
    console.log('No orphaned audit logs found. Database is clean.')
  }

  console.log('\nFix complete!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
