import { eq, and, desc, sql, gte, lte, or, like } from "drizzle-orm";
import { db } from "./db.js";
import {
  users, agents, dataBundles, resultCheckers, transactions, withdrawals, smsLogs, auditLogs, settings,
  supportChats, chatMessages, agentCustomPricing,
  type User, type InsertUser, type Agent, type InsertAgent,
  type DataBundle, type InsertDataBundle, type ResultChecker, type InsertResultChecker,
  type Transaction, type InsertTransaction, type Withdrawal, type InsertWithdrawal,
  type SmsLog, type InsertSmsLog, type AuditLog, type InsertAuditLog,
  type SupportChat, type InsertSupportChat, type ChatMessage, type InsertChatMessage
} from "../shared/schema.js";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;

  // Agents
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByUserId(userId: string): Promise<Agent | undefined>;
  getAgentBySlug(slug: string): Promise<Agent | undefined>;
  getAgents(filters?: { isApproved?: boolean }): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, data: Partial<Agent>): Promise<Agent | undefined>;
  updateAgentBalance(id: string, amount: number, addProfit: boolean): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<void>;

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
  getTransactions(filters?: { customerEmail?: string; agentId?: string; status?: string; type?: string; limit?: number; offset?: number }): Promise<Transaction[]>;
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

  // Break Settings
  getBreakSettings(): Promise<{ isEnabled: boolean; message: string }>;
  updateBreakSettings(settings: { isEnabled: boolean; message: string }): Promise<{ isEnabled: boolean; message: string }>;

  // Support Chat
  createSupportChat(userId: string, userEmail: string, userName: string): Promise<string>;
  getUserSupportChats(userId: string): Promise<SupportChat[]>;
  getAllSupportChats(status?: string): Promise<SupportChat[]>;
  getSupportChatById(chatId: string): Promise<SupportChat | undefined>;
  closeSupportChat(chatId: string): Promise<void>;
  assignChatToAdmin(chatId: string, adminId: string): Promise<void>;
  createChatMessage(chatId: string, senderId: string, senderType: string, message: string): Promise<string>;
  getChatMessages(chatId: string): Promise<ChatMessage[]>;
  markMessageAsRead(messageId: string): Promise<void>;
  getUnreadUserMessagesCount(userId: string): Promise<number>;
  getUnreadAdminMessagesCount(): Promise<number>;

  // Agent Custom Pricing
  getAgentCustomPricing(agentId: string): Promise<Array<{ bundleId: string; customPrice: string }>>;
  setAgentCustomPricing(agentId: string, bundleId: string, customPrice: string): Promise<void>;
  deleteAgentCustomPricing(agentId: string, bundleId: string): Promise<void>;
  getAgentPriceForBundle(agentId: string, bundleId: string): Promise<string | null>;

  // Rankings
  getTopCustomers(limit?: number): Promise<Array<{
    customerEmail: string;
    customerPhone: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date;
  }>>;

  // Admin Stats
  getAdminStats(): Promise<{
    totalRevenue: number;
    totalProfit: number;
    totalTransactions: number;
    pendingWithdrawals: number;
    activeAgents: number;
    pendingAgents: number;
    activationRevenue: number;
    dataBundleStock: number;
    resultCheckerStock: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // ============================================
  // USERS
  // ============================================
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email || typeof email !== 'string') {
      throw new Error("Invalid email parameter");
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new Error("Email cannot be empty");
    }
    const result = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!insertUser.email || typeof insertUser.email !== 'string') {
      throw new Error("Invalid email");
    }
    if (!insertUser.name || typeof insertUser.name !== 'string' || insertUser.name.length < 2) {
      throw new Error("Invalid name");
    }
    // Allow empty password for Supabase-authenticated users
    if (insertUser.password !== undefined && insertUser.password !== '' && typeof insertUser.password !== 'string') {
      throw new Error("Invalid password");
    }
    
    const normalizedEmail = insertUser.email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error("Invalid email format");
    }
    
    const result = await db.insert(users).values({
      ...insertUser,
      email: normalizedEmail,
      password: insertUser.password || '', // Default to empty string if not provided
    }).returning();
    return result[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
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

  async deleteAgent(id: string): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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

  async getResultCheckerSummary(): Promise<{ type: string; year: number; total: number; available: number; sold: number }[]> {
    const result = await db.select({
      type: resultCheckers.type,
      year: resultCheckers.year,
      total: sql<number>`count(*)`,
      available: sql<number>`count(case when ${resultCheckers.isSold} = false then 1 end)`,
      sold: sql<number>`count(case when ${resultCheckers.isSold} = true then 1 end)`,
    })
    .from(resultCheckers)
    .groupBy(resultCheckers.type, resultCheckers.year)
    .orderBy(resultCheckers.type, resultCheckers.year);

    return result;
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

  async getTransactions(filters?: { customerEmail?: string; agentId?: string; status?: string; type?: string; limit?: number; offset?: number }): Promise<Transaction[]> {
    const conditions = [];
    if (filters?.customerEmail) conditions.push(eq(transactions.customerEmail, filters.customerEmail));
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
  // BREAK SETTINGS
  // ============================================
  async getBreakSettings(): Promise<{ isEnabled: boolean; message: string }> {
    const isEnabledStr = await this.getSetting("break_mode_enabled");
    const message = await this.getSetting("break_mode_message") || "";

    return {
      isEnabled: isEnabledStr === "true",
      message,
    };
  }

  async updateBreakSettings(settings: { isEnabled: boolean; message: string }): Promise<{ isEnabled: boolean; message: string }> {
    await this.setSetting("break_mode_enabled", settings.isEnabled.toString(), "Site break mode enabled/disabled");
    await this.setSetting("break_mode_message", settings.message, "Site break mode message");

    return settings;
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
    pendingAgents: number;
    activationRevenue: number;
    dataBundleStock: number;
    resultCheckerStock: number;
  }> {
    const [txStats] = await db.select({
      totalTransactions: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(case when status = 'completed' then amount::numeric else 0 end), 0)`,
      totalProfit: sql<number>`coalesce(sum(case when status = 'completed' then profit::numeric else 0 end), 0)`,
    }).from(transactions);

    // Get agent activation revenue
    const [activationStats] = await db.select({
      revenue: sql<number>`coalesce(sum(case when status = 'completed' and type = 'agent_activation' then amount::numeric else 0 end), 0)`,
    }).from(transactions);

    const [withdrawalStats] = await db.select({
      pending: sql<number>`count(*)`,
    }).from(withdrawals).where(eq(withdrawals.status, "pending"));

    const [agentStats] = await db.select({
      active: sql<number>`count(*)`,
    }).from(agents).where(eq(agents.isApproved, true));

    const [pendingAgentStats] = await db.select({
      pending: sql<number>`count(*)`,
    }).from(agents).where(eq(agents.paymentPending, true));

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
      pendingAgents: Number(pendingAgentStats?.pending || 0),
      activationRevenue: Number(activationStats?.revenue || 0),
      dataBundleStock: Number(bundleStats?.count || 0),
      resultCheckerStock: Number(checkerStats?.count || 0),
    };
  }

  // Support Chat Methods
  async createSupportChat(userId: string, userEmail: string, userName: string): Promise<string> {
    const [chat] = await db.insert(supportChats).values({
      userId,
      userEmail,
      userName,
      status: 'open',
      lastMessageAt: new Date(),
      createdAt: new Date(),
    }).returning();
    return chat.id;
  }

  async getUserSupportChats(userId: string): Promise<SupportChat[]> {
    return await db.select()
      .from(supportChats)
      .where(eq(supportChats.userId, userId))
      .orderBy(desc(supportChats.lastMessageAt));
  }

  async getAllSupportChats(status?: string): Promise<SupportChat[]> {
    if (status) {
      return await db.select()
        .from(supportChats)
        .where(eq(supportChats.status, status as any))
        .orderBy(desc(supportChats.lastMessageAt));
    }
    return await db.select()
      .from(supportChats)
      .orderBy(desc(supportChats.lastMessageAt));
  }

  async getSupportChatById(chatId: string): Promise<SupportChat | undefined> {
    const [chat] = await db.select()
      .from(supportChats)
      .where(eq(supportChats.id, chatId));
    return chat;
  }

  async closeSupportChat(chatId: string): Promise<void> {
    await db.update(supportChats)
      .set({ status: 'closed', closedAt: new Date() })
      .where(eq(supportChats.id, chatId));
  }

  async assignChatToAdmin(chatId: string, adminId: string): Promise<void> {
    await db.update(supportChats)
      .set({ assignedToAdminId: adminId })
      .where(eq(supportChats.id, chatId));
  }

  async createChatMessage(chatId: string, senderId: string, senderType: string, message: string): Promise<string> {
    const [msg] = await db.insert(chatMessages).values({
      chatId,
      senderId,
      senderType: senderType as any,
      message,
      isRead: false,
      createdAt: new Date(),
    }).returning();

    // Update last message timestamp on chat
    await db.update(supportChats)
      .set({ lastMessageAt: new Date() })
      .where(eq(supportChats.id, chatId));

    return msg.id;
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    return await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(chatMessages.createdAt);
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db.update(chatMessages)
      .set({ isRead: true })
      .where(eq(chatMessages.id, messageId));
  }

  async getUnreadUserMessagesCount(userId: string): Promise<number> {
    // Get all chats for this user
    const userChats = await db.select({ id: supportChats.id })
      .from(supportChats)
      .where(eq(supportChats.userId, userId));
    
    if (userChats.length === 0) return 0;
    
    const chatIds = userChats.map(chat => chat.id);
    
    // Count unread messages from admin in user's chats
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          sql`${chatMessages.chatId} IN ${chatIds}`,
          eq(chatMessages.senderType, 'admin'),
          eq(chatMessages.isRead, false)
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  async getUnreadAdminMessagesCount(): Promise<number> {
    // Count all unread messages from users across all chats
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.senderType, 'user'),
          eq(chatMessages.isRead, false)
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  // Agent Custom Pricing Methods
  async getAgentCustomPricing(agentId: string): Promise<Array<{ bundleId: string; customPrice: string }>> {
    const pricing = await db.select({
      bundleId: agentCustomPricing.bundleId,
      customPrice: agentCustomPricing.customPrice,
    })
      .from(agentCustomPricing)
      .where(eq(agentCustomPricing.agentId, agentId));
    
    return pricing.map(p => ({
      bundleId: p.bundleId,
      customPrice: p.customPrice || "0",
    }));
  }

  async setAgentCustomPricing(agentId: string, bundleId: string, customPrice: string): Promise<void> {
    // Check if pricing exists
    const [existing] = await db.select()
      .from(agentCustomPricing)
      .where(
        and(
          eq(agentCustomPricing.agentId, agentId),
          eq(agentCustomPricing.bundleId, bundleId)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing
      await db.update(agentCustomPricing)
        .set({ 
          customPrice, 
          updatedAt: new Date() 
        })
        .where(
          and(
            eq(agentCustomPricing.agentId, agentId),
            eq(agentCustomPricing.bundleId, bundleId)
          )
        );
    } else {
      // Insert new
      await db.insert(agentCustomPricing).values({
        agentId,
        bundleId,
        customPrice,
      });
    }
  }

  async deleteAgentCustomPricing(agentId: string, bundleId: string): Promise<void> {
    await db.delete(agentCustomPricing)
      .where(
        and(
          eq(agentCustomPricing.agentId, agentId),
          eq(agentCustomPricing.bundleId, bundleId)
        )
      );
  }

  async getAgentPriceForBundle(agentId: string, bundleId: string): Promise<string | null> {
    const [result] = await db.select({ customPrice: agentCustomPricing.customPrice })
      .from(agentCustomPricing)
      .where(
        and(
          eq(agentCustomPricing.agentId, agentId),
          eq(agentCustomPricing.bundleId, bundleId)
        )
      )
      .limit(1);
    
    return result?.customPrice || null;
  }

  // Rankings Methods
  async getTopCustomers(limit: number = 10): Promise<Array<{
    customerEmail: string;
    customerPhone: string;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date;
  }>> {
    const results = await db.select({
      customerEmail: sql<string>`MAX(${transactions.customerEmail})`,
      customerPhone: transactions.customerPhone,
      totalPurchases: sql<number>`count(*)`,
      totalSpent: sql<number>`sum(${transactions.amount}::numeric)`,
      lastPurchase: sql<Date>`max(${transactions.createdAt})`,
    })
      .from(transactions)
      .where(eq(transactions.status, 'completed'))
      .groupBy(transactions.customerPhone)
      .orderBy(desc(sql`sum(${transactions.amount}::numeric)`))
      .limit(limit);

    return results.map(r => ({
      customerEmail: r.customerEmail || '',
      customerPhone: r.customerPhone,
      totalPurchases: Number(r.totalPurchases),
      totalSpent: Number(r.totalSpent),
      lastPurchase: r.lastPurchase,
    }));
  }
}

export const storage = new DatabaseStorage();
