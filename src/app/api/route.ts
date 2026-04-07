import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connectivity
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ 
      status: "healthy",
      message: "EasyBeds API is running",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ 
      status: "unhealthy",
      error: "Database connection failed",
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}