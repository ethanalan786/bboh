import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4]

  if (!email || !password) {
    console.log('Usage: npm run add-user <email> <password> [name]')
    process.exit(1)
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password,
        name: name || null,
      },
    })

    console.log(`User created successfully: ${user.email}`)
  } catch (error) {
    console.error('Error creating user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addUser()