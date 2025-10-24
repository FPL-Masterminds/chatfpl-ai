import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, hashedPassword, name || null]
    );

    const user = userResult.rows[0];

    // Create default subscription (Free plan)
    await pool.query(
      "INSERT INTO subscriptions (user_id, plan, status) VALUES ($1, $2, $3)",
      [user.id, "free", "active"]
    );

    // Create initial usage tracking for current month
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await pool.query(
      "INSERT INTO usage_tracking (user_id, month, year, messages_used, messages_limit) VALUES ($1, $2, $3, $4, $5)",
      [user.id, month, year, 0, 5]
    );

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

