import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// GET /api/hotel/users?hotelId=xxx — List all users for a hotel
export async function GET(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 }
      );
    }

    const hotelUsers = await db.hotelUser.findMany({
      where: { hotelId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const users = hotelUsers.map((hu) => ({
      id: hu.id,
      hotelId: hu.hotelId,
      userId: hu.userId,
      role: hu.role,
      isActive: hu.isActive,
      joinedAt: hu.createdAt,
      user: hu.user,
    }));

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch users.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/hotel/users?hotelId=xxx — Add a user to hotel
export async function POST(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    if (!hotelId) {
      return NextResponse.json(
        { success: false, error: 'hotelId is required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and role are required.' },
        { status: 400 }
      );
    }

    if (!['owner', 'manager', 'staff', 'housekeeping'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be owner, manager, staff, or housekeeping.' },
        { status: 400 }
      );
    }

    // Check hotel exists
    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json(
        { success: false, error: 'Hotel not found.' },
        { status: 404 }
      );
    }

    // Find or create user
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user
      const defaultPassword = password || 'changeme123';
      user = await db.user.create({
        data: {
          email,
          passwordHash: hashPassword(defaultPassword),
          name,
          emailVerified: true,
          role: 'user',
        },
      });
    }

    // Check if already a member of this hotel
    const existingMembership = await db.hotelUser.findUnique({
      where: {
        hotelId_userId: { hotelId, userId: user.id },
      },
    });

    if (existingMembership) {
      // Reactivate if inactive
      if (!existingMembership.isActive) {
        await db.hotelUser.update({
          where: { id: existingMembership.id },
          data: { isActive: true, role },
        });
        return NextResponse.json({
          success: true,
          data: {
            message: 'User reactivated successfully.',
            user: { id: user.id, name: user.name, email: user.email, role },
            defaultPassword: !password ? 'changeme123' : undefined,
          },
        });
      }
      return NextResponse.json(
        { success: false, error: 'User is already a member of this hotel.' },
        { status: 409 }
      );
    }

    // Create hotel membership
    const hotelUser = await db.hotelUser.create({
      data: {
        hotelId,
        userId: user.id,
        role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'User added to hotel successfully.',
          membership: {
            id: hotelUser.id,
            role: hotelUser.role,
            joinedAt: hotelUser.createdAt,
          },
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          defaultPassword: !password ? 'changeme123' : undefined,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add user.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// PATCH /api/hotel/users?hotelId=xxx — Update user role
export async function PATCH(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    const userId = request.nextUrl.searchParams.get('userId');
    if (!hotelId || !userId) {
      return NextResponse.json(
        { success: false, error: 'hotelId and userId are required.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role, isActive } = body;

    if (!role && isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'At least role or isActive must be provided.' },
        { status: 400 }
      );
    }

    const membership = await db.hotelUser.findUnique({
      where: { hotelId_userId: { hotelId, userId } },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of this hotel.' },
        { status: 404 }
      );
    }

    const updated = await db.hotelUser.update({
      where: { id: membership.id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE /api/hotel/users?hotelId=xxx&userId=xxx — Remove user from hotel (deactivate)
export async function DELETE(request: NextRequest) {
  try {
    const hotelId = request.nextUrl.searchParams.get('hotelId');
    const userId = request.nextUrl.searchParams.get('userId');
    if (!hotelId || !userId) {
      return NextResponse.json(
        { success: false, error: 'hotelId and userId are required.' },
        { status: 400 }
      );
    }

    const membership = await db.hotelUser.findUnique({
      where: { hotelId_userId: { hotelId, userId } },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'User is not a member of this hotel.' },
        { status: 404 }
      );
    }

    // Soft delete: deactivate instead of removing
    await db.hotelUser.update({
      where: { id: membership.id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'User removed from hotel.' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove user.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
