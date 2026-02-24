// api/routes/users.ts
import express from 'express';
import { db } from '../config/database';
import { users } from '../shared/db/schema/index';
import { eq, desc, asc, sql, and, gte, lte } from 'drizzle-orm';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// Get all users with pagination (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      active,
    } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`})`,
      );
    }

    if (active !== undefined) {
      conditions.push(eq(users.isActive, active === 'true'));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult[0]?.count || 0;

    // Get users with pagination
      const userList = await db
          .select()
          .from(users)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(
            sortBy === 'name'
              ? asc(users.name)
              : sortBy === 'email'
                ? asc(users.email)
                : desc(users.created_at),
          )
          .limit(limitNum)
          .offset(offsetNum);

    res.json({
      users: userList,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user statistics
router.get('/count', authenticateAdmin, async (req, res) => {
  try {
    // Get total users
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const total = totalResult[0]?.count || 0;

    // Get active users
    const activeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    const active = activeResult[0]?.count || 0;

    // Get inactive users
    const inactiveResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isActive, false));

    const inactive = inactiveResult[0]?.count || 0;

    // Get admin users
    const adminsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    res.json({
      total,
      active,
      inactive,
      percentageActive: total > 0 ? Math.round((active / total) * 100) : 0,
    });
  } catch (error) {
    console.error('Get user count error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

// Get user growth over time
router.get('/growth', authenticateAdmin, async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    let dateTrunc = 'month';
    let dateFormat = 'YYYY-MM';

    switch (period) {
      case 'day':
        dateTrunc = 'day';
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateTrunc = 'week';
        dateFormat = 'YYYY-WW';
        break;
      case 'year':
        dateTrunc = 'year';
        dateFormat = 'YYYY';
        break;
      default:
        dateTrunc = 'month';
        dateFormat = 'YYYY-MM';
    }

    // Build date filter
    const dateConditions = [];

    if (startDate) {
      dateConditions.push(gte(users.created_at, new Date(startDate as string)));
    }

    if (endDate) {
      dateConditions.push(lte(users.created_at, new Date(endDate as string)));
    }

    // Get growth data
    const growthData = await db
      .select({
        date: sql<string>`DATE_TRUNC(${sql.raw(dateTrunc)}, ${users.created_at})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
      .groupBy(sql`DATE_TRUNC(${sql.raw(dateTrunc)}, ${users.created_at})`)
      .orderBy(sql`DATE_TRUNC(${sql.raw(dateTrunc)}, ${users.created_at})`);

    // Format the data
    const formattedData = growthData.map((item) => ({
      date: item.date,
      count: item.count,
    }));

    // Calculate total growth
    const totalGrowth = formattedData.reduce(
      (sum, item) => sum + item.count,
      0,
    );

    res.json({
      period: period as string,
      data: formattedData,
      totalGrowth,
      startDate: startDate || 'beginning',
      endDate: endDate || 'now',
    });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({ error: 'Failed to fetch user growth data' });
  }
});

// Get single user by ID
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;

    res.json({ user: safeUser });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, active } = req.body;

    const [updatedUser] = await db
      .update(users)
      .set({
        name,
        email,
        isActive: active === 'true',
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = updatedUser;

    res.json({
      message: 'User updated successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    res.json({
      message: 'User deleted successfully',
      deletedUserId: id,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
