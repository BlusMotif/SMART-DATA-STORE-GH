import { eq, and, desc, sql, gte, lte, or, like } from "drizzle-orm";
import { db } from "./db";
import {
  users, agents, dataBundles, resultCheckers, transactions, withdrawals, smsLogs, auditLogs, settings,
  type User, type InsertUser, type Agent, type InsertAgent,
  type DataBundle, type InsertDataBundle, type ResultChecker, type InsertResultChecker,
  type Transaction, type InsertTransaction, type Withdrawal, type InsertWithdrawal,
  type SmsLog, type InsertSmsLog, type AuditLog, type InsertAuditLog
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  // Agents
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByUserId(userId: string): Promise<Agent | undefined>;
  getAgentBySlug(slug: string): Promise<Agent | undefined>;
  getAgents(filters?: { isApproved?: boolean }): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, data: Partial<Agent>): Promise<Agent | undefined>;
  updateAgentBalance(id: string, amount: number, addProfit: boolean): Promise<Agent | undefined>;

  // Data Bundles
  getDataBundle(id: string): Promise<DataBundle | undefined>;
  getDataBundles(filters?: { network?: string; isActive?: boolean }): Promise<DataBundle[]>;
  createDataBundle(bundle: InsertDataBundle): Promise<DataBundle>;
  updateDataBundle(id: string, data: Partial<InsertDataBundle>): Promise<DataBundle | undefined>;
  deleteDataBundle(id: string): Promise<boolean>;

  // Result Checkers
  getResultChecker(id: string): Promise<ResultChecker | undefined>;
  getAvailableResultChecker(type: string, year: number): Promise<ResultChecker | undefined>;
  getResultCheckerStock(type: string, year: number): Promise<number>;
  getResultCheckers(filters?: { type?: string; year?: number; isSold?: boolean }): Promise<ResultChecker[]>;
  getResultCheckerSummary(): Promise<{ type: string; year: number; total: number; available: number; sold: number }[]>;
  createResultChecker(checker: InsertResultChecker): Promise<ResultChecker>;
  createResultCheckersBulk(checkers: InsertResultChecker[]): Promise<ResultChecker[]>;
  markResultCheckerSold(id: string, transactionId: string, phone: string): Promise<ResultChecker | undefined>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByReference(reference: string): Promise<Transaction | undefined>;
  getTransactions(filters?: { agentId?: string; status?: string; type?: string; limit?: number; offset?: number }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined>;
  getTransactionStats(agentId?: string): Promise<{ total: number; completed: number; pending: number; revenue: number; profit: number }>;

  // Withdrawals
  getWithdrawal(id: string): Promise<Withdrawal | undefined>;
  getWithdrawals(filters?: { agentId?: string; status?: string }): Promise<Withdrawal[]>;
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  updateWithdrawal(id: string, data: Partial<Withdrawal>): Promise<Withdrawal | undefined>;

  // SMS Logs
  createSmsLog(log: InsertSmsLog): Promise<SmsLog>;
  updateSmsLog(id: string, data: Partial<SmsLog>): Promise<SmsLog | undefined>;
  getPendingSmsLogs(): Promise<SmsLog[]>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<void>;

  // Admin Stats
  getAdminStats(): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
    pendingWithdrawals: number;
    activeAgents: number;
    dataBundleStock: number;
    resultCheckerStock: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // USERS
  // ============================================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase(),
    }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  // ============================================
  // AGENTS
  // ============================================
  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
    return agent;
  }

  async getAgentByUserId(userId: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
    return agent;
  }

  async getAgentBySlug(slug: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.storefrontSlug, slug.toLowerCase())).limit(1);
    return agent;
  }

  async getAgents(filters?: { isApproved?: boolean }): Promise<Agent[]> {
    let query = db.select().from(agents);
    if (filters?.isApproved !== undefined) {
      query = query.where(eq(agents.isApproved, filters.isApproved)) as typeof query;
    }
    return query.orderBy(desc(agents.createdAt));
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values({
      ...insertAgent,
      storefrontSlug: insertAgent.storefrontSlug.toLowerCase(),
    }).returning();
    return agent;
  }

  async updateAgent(id: string, data: Partial<Agent>): Promise<Agent | undefined> {
    const [agent] = await db.update(agents).set(data).where(eq(agents.id, id)).returning();
    return agent;
  }

  async updateAgentBalance(id: string, amount: number, addProfit: boolean): Promise<Agent | undefined> {
    const agent = await this.getAgent(id);
    if (!agent) return undefined;

    const newBalance = parseFloat(agent.balance) + amount;
    const newTotalSales = parseFloat(agent.totalSales) + (amount > 0 ? amount : 0);
    const newTotalProfit = addProfit ? parseFloat(agent.totalProfit) + amount : parseFloat(agent.totalProfit);

    const [updated] = await db.update(agents).set({
      balance: newBalance.toFixed(2),
      totalSales: newTotalSales.toFixed(2),
      totalProfit: newTotalProfit.toFixed(2),
    }).where(eq(agents.id, id)).returning();
    return updated;
  }

  // ============================================
  // DATA BUNDLES
  // ============================================
  async getDataBundle(id: string): Promise<DataBundle | undefined> {
    const [bundle] = await db.select().from(dataBundles).where(eq(dataBundles.id, id)).limit(1);
    return bundle;
  }

  async getDataBundles(filters?: { network?: string; isActive?: boolean }): Promise<DataBundle[]> {
    const conditions = [];
    if (filters?.network) conditions.push(eq(dataBundles.network, filters.network));
    if (filters?.isActive !== undefined) conditions.push(eq(dataBundles.isActive, filters.isActive));

    let query = db.select().from(dataBundles);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return query.orderBy(dataBundles.network, dataBundles.basePrice);
  }

  async createDataBundle(bundle: InsertDataBundle): Promise<DataBundle> {
    const [created] = await db.insert(dataBundles).values(bundle).returning();
    return created;
  }

  async updateDataBundle(id: string, data: Partial<InsertDataBundle>): Promise<DataBundle | undefined> {
    const [bundle] = await db.update(dataBundles).set(data).where(eq(dataBundles.id, id)).returning();
    return bundle;
  }

  async deleteDataBundle(id: string): Promise<boolean> {
    const result = await db.delete(dataBundles).where(eq(dataBundles.id, id));
    return true;
  }

  // ============================================
  // RESULT CHECKERS
  // ============================================
  async getResultChecker(id: string): Promise<ResultChecker | undefined> {
    const [checker] = await db.select().from(resultCheckers).where(eq(resultCheckers.id, id)).limit(1);
    return checker;
  }

  async getAvailableResultChecker(type: string, year: number): Promise<ResultChecker | undefined> {
    const [checker] = await db.select().from(resultCheckers)
      .where(and(
        eq(resultCheckers.type, type),
        eq(resultCheckers.year, year),
        eq(resultCheckers.isSold, false)
      ))
      .limit(1);
    return checker;
  }

  async getResultCheckerStock(type: string, year: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(resultCheckers)
      .where(and(
        eq(resultCheckers.type, type),
        eq(resultCheckers.year, year),
        eq(resultCheckers.isSold, false)
      ));
    return Number(result[0]?.count || 0);
  }

  async getResultCheckers(filters?: { type?: string; year?: number; isSold?: boolean }): Promise<ResultChecker[]> {
    const conditions = [];
    if (filters?.type) conditions.push(eq(resultCheckers.type, filters.type));
    if (filters?.year) conditions.push(eq(resultCheckers.year, filters.year));
    if (filters?.isSold !== undefined) conditions.push(eq(resultCheckers.isSold, filters.isSold));

    let query = db.select().from(resultCheckers);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return query.orderBy(desc(resultCheckers.createdAt));
  }

  async createResultChecker(checker: InsertResultChecker): Promise<ResultChecker> {
    const [created] = await db.insert(resultCheckers).values(checker).returning();
    return created;
  }

  async createResultCheckersBulk(checkers: InsertResultChecker[]): Promise<ResultChecker[]> {
    if (checkers.length === 0) return [];
    return db.insert(resultCheckers).values(checkers).returning();
  }

  async markResultCheckerSold(id: string, transactionId: string, phone: string): Promise<ResultChecker | undefined> {
    const [checker] = await db.update(resultCheckers).set({
      isSold: true,
      soldAt: new Date(),
      soldToPhone: phone,
      transactionId,
    }).where(eq(resultCheckers.id, id)).returning();
    return checker;
  }

  // ============================================
  // TRANSACTIONS
  // ============================================
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return transaction;
  }

  async getTransactionByReference(reference: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.reference, reference)).limit(1);
    return transaction;
  }

  async getTransactions(filters?: { agentId?: string; status?: string; type?: string; limit?: number; offset?: number }): Promise<Transaction[]> {
    const conditions = [];
    if (filters?.agentId) conditions.push(eq(transactions.agentId, filters.agentId));
    if (filters?.status) conditions.push(eq(transactions.status, filters.status));
    if (filters?.type) conditions.push(eq(transactions.type, filters.type));

    let query = db.select().from(transactions);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    query = query.orderBy(desc(transactions.createdAt)) as typeof query;
    if (filters?.limit) query = query.limit(filters.limit) as typeof query;
    if (filters?.offset) query = query.offset(filters.offset) as typeof query;
    return query;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values(transaction).returning();
    return created;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return transaction;
  }

  async getTransactionStats(agentId?: string): Promise<{ total: number; completed: number; pending: number; revenue: number; profit: number }> {
    const conditions = agentId ? [eq(transactions.agentId, agentId)] : [];
    
    const stats = await db.select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      revenue: sql<number>`coalesce(sum(case when status = 'completed' then amount::numeric else 0 end), 0)`,
      profit: sql<number>`coalesce(sum(case when status = 'completed' then profit::numeric else 0 end), 0)`,
    }).from(transactions).where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      total: Number(stats[0]?.total || 0),
      completed: Number(stats[0]?.completed || 0),
      pending: Number(stats[0]?.pending || 0),
      revenue: Number(stats[0]?.revenue || 0),
      profit: Number(stats[0]?.profit || 0),
    };
  }

  // ============================================
  // WITHDRAWALS
  // ============================================
  async getWithdrawal(id: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
    return withdrawal;
  }

  async getWithdrawals(filters?: { agentId?: string; status?: string }): Promise<Withdrawal[]> {
    const conditions = [];
    if (filters?.agentId) conditions.push(eq(withdrawals.agentId, filters.agentId));
    if (filters?.status) conditions.push(eq(withdrawals.status, filters.status));

    let query = db.select().from(withdrawals);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return query.orderBy(desc(withdrawals.createdAt));
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [created] = await db.insert(withdrawals).values(withdrawal).returning();
    return created;
  }

  async updateWithdrawal(id: string, data: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.update(withdrawals).set(data).where(eq(withdrawals.id, id)).returning();
    return withdrawal;
  }

  // ============================================
  // SMS LOGS
  // ============================================
  async createSmsLog(log: InsertSmsLog): Promise<SmsLog> {
    const [created] = await db.insert(smsLogs).values(log).returning();
    return created;
  }

  async updateSmsLog(id: string, data: Partial<SmsLog>): Promise<SmsLog | undefined> {
    const [log] = await db.update(smsLogs).set(data).where(eq(smsLogs.id, id)).returning();
    return log;
  }

  async getPendingSmsLogs(): Promise<SmsLog[]> {
    return db.select().from(smsLogs)
      .where(or(
        eq(smsLogs.status, "pending"),
        eq(smsLogs.status, "retrying")
      ))
      .orderBy(smsLogs.createdAt);
  }

  // ============================================
  // AUDIT LOGS
  // ============================================
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  // ============================================
  // SETTINGS
  // ============================================
  async getSetting(key: string): Promise<string | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return setting?.value;
  }

  async setSetting(key: string, value: string, description?: string): Promise<void> {
    await db.insert(settings)
      .values({ key, value, description })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });
  }

  // ============================================
  // ADMIN STATS
  // ============================================
  async getAdminStats(): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
    pendingWithdrawals: number;
    activeAgents: number;
    dataBundleStock: number;
    resultCheckerStock: number;
  }> {
    const [txStats] = await db.select({
      totalTransactions: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(case when status = 'completed' then amount::numeric else 0 end), 0)`,
      totalProfit: sql<number>`coalesce(sum(case when status = 'completed' then profit::numeric else 0 end), 0)`,
    }).from(transactions);

    const [withdrawalStats] = await db.select({
      pending: sql<number>`count(*)`,
    }).from(withdrawals).where(eq(withdrawals.status, "pending"));

    const [agentStats] = await db.select({
      active: sql<number>`count(*)`,
    }).from(agents).where(eq(agents.isApproved, true));

    const [bundleStats] = await db.select({
      count: sql<number>`count(*)`,
    }).from(dataBundles).where(eq(dataBundles.isActive, true));

    const [checkerStats] = await db.select({
      count: sql<number>`count(*)`,
    }).from(resultCheckers).where(eq(resultCheckers.isSold, false));

    return {
      totalRevenue: Number(txStats?.totalRevenue || 0),
      totalProfit: Number(txStats?.totalProfit || 0),
      totalTransactions: Number(txStats?.totalTransactions || 0),
      pendingWithdrawals: Number(withdrawalStats?.pending || 0),
      activeAgents: Number(agentStats?.active || 0),
      dataBundleStock: Number(bundleStats?.count || 0),
      resultCheckerStock: Number(checkerStats?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();
