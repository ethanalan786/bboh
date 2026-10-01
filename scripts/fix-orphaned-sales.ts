import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for orphaned sales...')

  // Find all sales
  const allSales = await prisma.sale.findMany({
    select: {
      id: true,
      userId: true
    }
  })

  console.log(`Total sales found: ${allSales.length}`)

  // Find all valid user IDs
  const allUsers = await prisma.user.findMany({
    select: {
      id: true
    }
  })

  const validUserIds = new Set(allUsers.map(u => u.id))
  console.log(`Valid users found: ${validUserIds.size}`)

  // Identify orphaned sales
  const orphanedSales = allSales.filter(sale => !validUserIds.has(sale.userId))
  
  console.log(`Orphaned sales found: ${orphanedSales.length}`)

  if (orphanedSales.length > 0) {
    console.log('Orphaned sale IDs:', orphanedSales.map(s => s.id))
    
    // Option 1: Delete orphaned sales
    console.log('\nDeleting orphaned sales...')
    const deleteResult = await prisma.sale.deleteMany({
      where: {
        id: {
          in: orphanedSales.map(s => s.id)
        }
      }
    })
    
    console.log(`Deleted ${deleteResult.count} orphaned sales`)
  } else {
    console.log('No orphaned sales found. Database is clean.')
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
