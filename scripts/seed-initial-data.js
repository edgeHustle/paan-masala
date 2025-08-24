// Initial data seeding script for Pan Masala Accounting App
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"
const DB_NAME = "pan-masala-accounting"

async function seedInitialData() {
  console.log("Seeding initial data...")
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db(DB_NAME)

    // Clear existing data
    await db.collection("users").deleteMany({})
    await db.collection("customers").deleteMany({})
    await db.collection("items").deleteMany({})

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12)
    await db.collection("users").insertOne({
      username: "admin",
      password: adminPassword,
      name: "Administrator",
      role: "admin",
      createdAt: new Date(),
    })

    // Create regular user
    const userPassword = await bcrypt.hash("user123", 12)
    await db.collection("users").insertOne({
      username: "user",
      password: userPassword,
      name: "Staff User",
      role: "user",
      createdAt: new Date(),
    })

    // Create sample customers (with password = hashed mobile)
    const customers = await Promise.all([
      {
        serialNumber: 1,
        name: "Krunal Bapodara",
        mobile: "7984603595",
        address: "123 Main Street, City",
        password: await bcrypt.hash("7984603595", 12),
        createdAt: new Date(),
      },
      {
        serialNumber: 2,
        name: "Priya Sharma",
        mobile: "9876543211",
        address: "456 Park Avenue, City",
        password: await bcrypt.hash("9876543211", 12),
        createdAt: new Date(),
      },
      {
        serialNumber: 3,
        name: "Amit Patel",
        mobile: "9876543212",
        address: "789 Garden Road, City",
        password: await bcrypt.hash("9876543212", 12),
        createdAt: new Date(),
      },
    ])

    await db.collection("customers").insertMany(customers)

    // Create sample items
    const items = [
      {
        name: "Pan Masala Premium",
        price: 10,
        category: "Pan Masala",
        image: "/premium-pan-masala.png",
        description: "Premium quality pan masala",
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: "Pan Masala Regular",
        price: 5,
        category: "Pan Masala",
        image: "/pan-masala-regular-packet.png",
        description: "Regular pan masala",
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: "Supari Mix",
        price: 15,
        category: "Supari",
        image: "/supari-mix-packet.png",
        description: "Mixed supari with spices",
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: "Zarda Special",
        price: 20,
        category: "Zarda",
        image: "/placeholder-fszsx.png",
        description: "Special zarda blend",
        isActive: true,
        createdAt: new Date(),
      },
    ]

    await db.collection("items").insertMany(items)

    // Create indexes
    await db.collection("users").createIndex({ username: 1 }, { unique: true })
    await db.collection("customers").createIndex({ serialNumber: 1 }, { unique: true })
    await db.collection("customers").createIndex({ mobile: 1 })
    await db.collection("items").createIndex({ name: 1 })
    await db.collection("transactions").createIndex({ customerId: 1 })
    await db.collection("transactions").createIndex({ createdAt: -1 })

    console.log("Initial data seeded successfully!")
    console.log("Demo credentials:")
    console.log("Admin: admin / admin123")
    console.log("User: user / user123")
    console.log("Customer: Serial 1 / 9876543210")
  } catch (error) {
    console.error("Error seeding data:", error)
  } finally {
    await client.close()
  }
}

seedInitialData()
