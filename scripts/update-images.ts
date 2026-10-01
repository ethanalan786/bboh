import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating product images...')

  const productImages = [
    { sku: 'BS-PROT-001', imageUrl: 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?w=400&h=400&fit=crop' },
    { sku: 'BS-GREEN-001', imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=400&fit=crop' },
    { sku: 'BS-BERRY-001', imageUrl: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=400&fit=crop' },
    { sku: 'BS-ENERGY-001', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop' },
    { sku: 'APP-TEE-001', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
    { sku: 'APP-LEG-001', imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=400&fit=crop' },
    { sku: 'APP-CAP-001', imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop' },
    { sku: 'APP-HOOD-001', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop' }
  ]

  let updatedCount = 0
  for (const product of productImages) {
    try {
      const updated = await prisma.product.updateMany({
        where: { sku: product.sku },
        data: { imageUrl: product.imageUrl }
      })
      if (updated.count > 0) {
        updatedCount++
        console.log(`✓ Updated image for ${product.sku}`)
      } else {
        console.log(`✗ Product ${product.sku} not found`)
      }
    } catch (error) {
      console.error(`✗ Failed to update ${product.sku}:`, error)
    }
  }

  console.log(`\nUpdated ${updatedCount} products with images`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
