import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching sales data...')

  // Get all sales with product and user information
  const sales = await prisma.sale.findMany({
    include: {
      product: {
        include: {
          category: true
        }
      },
      user: true
    },
    orderBy: {
      saleDate: 'desc'
    }
  })

  console.log(`\nTotal sales found: ${sales.length}\n`)

  if (sales.length === 0) {
    console.log('No sales found in the database.')
    return
  }

  // Display sales in a formatted way
  console.log('Recent Sales:')
  console.log('='.repeat(80))

  sales.forEach((sale, index) => {
    console.log(`\nSale #${index + 1}:`)
    console.log(`  ID: ${sale.id}`)
    console.log(`  Product: ${sale.product?.name || 'Unknown'} (${sale.product?.sku || 'N/A'})`)
    console.log(`  Category: ${sale.product?.category?.name || 'Unknown'}`)
    console.log(`  Quantity: ${sale.quantity}`)
    console.log(`  Total Price: $${(sale.totalPrice || 0).toFixed(2)}`)
    console.log(`  User: ${sale.user?.name || 'Unknown'} (${sale.user?.email || 'N/A'})`)
    console.log(`  Sale Date: ${sale.saleDate.toLocaleString()}`)
    console.log(`  Created: ${sale.createdAt.toLocaleString()}`)
    console.log('-'.repeat(80))
  })

  // Summary statistics
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
  const totalItemsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0)
  const uniqueProducts = new Set(sales.map(s => s.productId)).size
  const uniqueUsers = new Set(sales.map(s => s.userId)).size

  console.log('\n' + '='.repeat(80))
  console.log('Summary Statistics:')
  console.log(`  Total Revenue: $${totalRevenue.toFixed(2)}`)
  console.log(`  Total Items Sold: ${totalItemsSold}`)
  console.log(`  Unique Products: ${uniqueProducts}`)
  console.log(`  Unique Users: ${uniqueUsers}`)
  console.log(`  Average Sale Value: $${(totalRevenue / sales.length).toFixed(2)}`)
  console.log('='.repeat(80))
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
