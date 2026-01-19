import { eq, and, desc, sql, gte, lte, or, like, max, sum, count, inArray, lt } from "drizzle-orm";
import { db } from "./db.js";
import { randomUUID } from "crypto";
import {
  users, agents, dataBundles, resultCheckers, transactions, withdrawals, smsLogs, auditLogs, settings,
  supportChats, chatMessages, customPricing, adminBasePrices, roleBasePrices, announcements, apiKeys, walletTopupTransactions,
  profitWallets, profitTransactions,
  type User, type InsertUser, type Agent, type InsertAgent,
  type DataBundle, type InsertDataBundle, type ResultChecker, type InsertResultChecker,
  type Transaction, type InsertTransaction, type Withdrawal, type InsertWithdrawal,
  type SmsLog, type InsertSmsLog, type AuditLog, type InsertAuditLog,
  type SupportChat, type InsertSupportChat, type ChatMessage, type InsertChatMessage,
  type Announcement, type InsertAnnouncement, type ApiKey, type InsertApiKey,
  type CustomPricing, type InsertCustomPricing, type AdminBasePrices, type InsertAdminBasePrices,
  type RoleBasePrices, type InsertRoleBasePrices,
  type WalletTopupTransaction, type InsertWalletTopupTransaction,
  type ProfitWallet, type InsertProfitWallet, type ProfitTransaction, type InsertProfitTransaction,
  type Settings
} from "../shared/schema.js";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySlug(slug: string, role: string): Promise<User | undefined>;
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
  getNetworksWithBasePrices(): Promise<{ network: string; basePrice: string; name: string }[]>;
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
  updateResultChecker(id: string, data: Partial<InsertResultChecker>): Promise<ResultChecker | undefined>;
  deleteResultChecker(id: string): Promise<boolean>;
  markResultCheckerSold(id: string, transactionId: string, phone: string | null): Promise<ResultChecker | undefined>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByReference(reference: string): Promise<Transaction | undefined>;
  getTransactionByBeneficiaryPhone(phone: string): Promise<Transaction | undefined>;
  getTransactions(filters?: { customerEmail?: string; agentId?: string; status?: string; type?: string; limit?: number; offset?: number }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined>;
  updateTransactionDeliveryStatus(id: string, deliveryStatus: string): Promise<Transaction | undefined>;
  getTransactionsForExport(paymentStatusFilter?: string[]): Promise<Pick<Transaction, "id" | "reference" | "productName" | "network" | "customerPhone" | "customerEmail" | "phoneNumbers" | "amount" | "profit" | "paymentStatus" | "deliveryStatus" | "createdAt" | "completedAt" | "isBulkOrder">[]>;
  getTransactionStats(agentId?: string): Promise<{ total: number; completed: number; pending: number; revenue: number; profit: number }>;

  // Withdrawals
  getWithdrawal(id: string): Promise<Withdrawal | undefined>;
  getWithdrawals(filters?: { userId?: string; status?: string }): Promise<Withdrawal[]>;
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  updateWithdrawal(id: string, data: Partial<Withdrawal>): Promise<Withdrawal | undefined>;

  // Profit Wallets
  getProfitWallet(userId: string): Promise<ProfitWallet | undefined>;
  createProfitWallet(wallet: InsertProfitWallet): Promise<ProfitWallet>;
  updateProfitWallet(userId: string, data: Partial<ProfitWallet>): Promise<ProfitWallet | undefined>;
  addProfit(userId: string, amount: number, orderId?: string, productId?: string, sellingPrice?: number, basePrice?: number): Promise<void>;

  // Profit Transactions
  getProfitTransactions(userId: string, filters?: { status?: string; limit?: number }): Promise<ProfitTransaction[]>;
  createProfitTransaction(transaction: InsertProfitTransaction): Promise<ProfitTransaction>;
  updateProfitTransactionStatus(id: string, status: string): Promise<ProfitTransaction | undefined>;

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


  // Custom Pricing (Unified for all roles)
  getCustomPricing(roleOwnerId: string, role: string): Promise<Array<{ productId: string; sellingPrice: string }>>;
  setCustomPricing(productId: string, roleOwnerId: string, role: string, sellingPrice: string): Promise<void>;
  deleteCustomPricing(productId: string, roleOwnerId: string, role: string): Promise<void>;
  getCustomPrice(productId: string, roleOwnerId: string, role: string): Promise<string | null>;

  // Admin Base Prices
  getAdminBasePrice(productId: string): Promise<string | null>;
  setAdminBasePrice(productId: string, basePrice: string): Promise<void>;

  // Price Resolution (combines custom + admin base price)
  getResolvedPrice(productId: string, roleOwnerId: string, role: string): Promise<string | null>;

  // Role Base Prices (legacy - may be removed later)
  getRoleBasePrices(): Promise<Array<{ bundleId: string; role: string; basePrice: string }>>;
  setRoleBasePrice(bundleId: string, role: string, basePrice: string, userRole: string): Promise<void>;
  getRoleBasePrice(bundleId: string, role: string): Promise<string | null>;

  // Rankings
  getTopCustomers(limit?: number): Promise<Array<{
    customerEmail: string;
    customerPhone: string | null;
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
    totalAgents: number;
    pendingAgents: number;
    activationRevenue: number;
    todayRevenue: number;
    todayTransactions: number;
    dataBundleStock: number;
    resultCheckerStock: number;
  }>;

  // API Keys
  getApiKeys(userId: string): Promise<ApiKey[]>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<boolean>;

  // Wallet Top-up Transactions
  createWalletTopupTransaction(topup: InsertWalletTopupTransaction): Promise<WalletTopupTransaction>;
  getWalletTopupTransactions(filters?: { userId?: string; adminId?: string }): Promise<WalletTopupTransaction[]>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<void>;
  getAllSettings(): Promise<Array<{ key: string; value: string; description?: string }>>;
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

  async getUserBySlug(slug: string, role: string): Promise<User | undefined> {
    if (role === 'agent') {
      // For agents, look up via agents table
      const agent = await this.getAgentBySlug(slug);
      if (agent) {
        return this.getUser(agent.userId);
      }
      return undefined;
    } else {
      // For other roles, assume slug is user ID for now
      // This will need to be updated when proper slug support is added
      return this.getUser(slug);
    }
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
      id: insertUser.id || randomUUID(),
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
      id: randomUUID(),
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
    
    // Order by network, then by data amount in MB (GB converted to MB), then by base price
    const dataAmountInMB = sql<number>`
      CASE 
        WHEN ${dataBundles.dataAmount} LIKE '%GB' THEN CAST(SUBSTRING(${dataBundles.dataAmount} FROM 1 FOR LENGTH(${dataBundles.dataAmount})-2) AS FLOAT) * 1024
        WHEN ${dataBundles.dataAmount} LIKE '%MB' THEN CAST(SUBSTRING(${dataBundles.dataAmount} FROM 1 FOR LENGTH(${dataBundles.dataAmount})-2) AS FLOAT)
        ELSE 0
      END
    `;
    
    return query.orderBy(dataBundles.network, dataAmountInMB, dataBundles.basePrice);
  }

  async getNetworksWithBasePrices(): Promise<{ network: string; basePrice: string; name: string }[]> {
    // Get distinct networks with their minimum base price and a display name
    const result = await db
      .select({
        network: dataBundles.network,
        basePrice: sql<string>`min(${dataBundles.basePrice})`,
        name: sql<string>`CASE 
          WHEN ${dataBundles.network} = 'mtn' THEN 'MTN'
          WHEN ${dataBundles.network} = 'telecel' THEN 'Telecel'
          WHEN ${dataBundles.network} = 'at_bigtime' THEN 'AT BIG TIME'
          WHEN ${dataBundles.network} = 'at_ishare' THEN 'AT iShare'
          ELSE ${dataBundles.network}
        END`
      })
      .from(dataBundles)
      .where(eq(dataBundles.isActive, true))
      .groupBy(dataBundles.network)
      .orderBy(dataBundles.network);

    return result;
  }

  async createDataBundle(bundle: InsertDataBundle): Promise<DataBundle> {
    const [created] = await db.insert(dataBundles).values({
      id: randomUUID(),
      ...bundle,
    }).returning();
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
    const result = await db.select({ count: count() })
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
    const [created] = await db.insert(resultCheckers).values({
      
      ...checker,
    }).returning();
    return created;
  }

  async createResultCheckersBulk(checkers: InsertResultChecker[]): Promise<ResultChecker[]> {
    if (checkers.length === 0) return [];
    const checkersWithIds = checkers.map(checker => ({
      
      ...checker
    }));
    return db.insert(resultCheckers).values(checkersWithIds).returning();
  }

  async markResultCheckerSold(id: string, transactionId: string, phone: string | null): Promise<ResultChecker | undefined> {
    const [checker] = await db.update(resultCheckers).set({
      isSold: true,
      soldAt: new Date(),
      soldToPhone: phone,
      transactionId,
    }).where(eq(resultCheckers.id, id)).returning();
    return checker;
  }

  async updateResultChecker(id: string, data: Partial<InsertResultChecker>): Promise<ResultChecker | undefined> {
    const [checker] = await db.update(resultCheckers).set(data).where(eq(resultCheckers.id, id)).returning();
    return checker;
  }

  async deleteResultChecker(id: string): Promise<boolean> {
    const result = await db.delete(resultCheckers).where(eq(resultCheckers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getResultCheckerSummary(): Promise<{ type: string; year: number; total: number; available: number; sold: number }[]> {
    const result = await db.select({
      type: resultCheckers.type,
      year: resultCheckers.year,
      total: count(),
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

  async getTransactionByBeneficiaryPhone(phone: string): Promise<Transaction | undefined> {
    // First try exact match on customerPhone
    let [transaction] = await db.select().from(transactions).where(eq(transactions.customerPhone, phone)).orderBy(desc(transactions.createdAt)).limit(1);

    // If not found, search in phoneNumbers array for bulk orders
    if (!transaction) {
      const allTransactions = await db.select().from(transactions).where(sql`${transactions.phoneNumbers} LIKE ${'%' + phone + '%'}`).orderBy(desc(transactions.createdAt)).limit(1);
      transaction = allTransactions[0];
    }

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

  async getTransactionsForExport(paymentStatusFilter?: string[]): Promise<Pick<Transaction, "id" | "reference" | "productName" | "network" | "customerPhone" | "customerEmail" | "phoneNumbers" | "amount" | "profit" | "paymentStatus" | "deliveryStatus" | "createdAt" | "completedAt" | "isBulkOrder">[]> {
    if (paymentStatusFilter && paymentStatusFilter.length > 0) {
      return db.select({
        id: transactions.id,
        reference: transactions.reference,
        productName: transactions.productName,
        network: transactions.network,
        customerPhone: transactions.customerPhone,
        customerEmail: transactions.customerEmail,
        phoneNumbers: transactions.phoneNumbers,
        amount: transactions.amount,
        profit: transactions.profit,
        paymentStatus: transactions.paymentStatus,
        deliveryStatus: transactions.deliveryStatus,
        createdAt: transactions.createdAt,
        completedAt: transactions.completedAt,
        isBulkOrder: transactions.isBulkOrder,
      }).from(transactions).where(inArray(transactions.paymentStatus, paymentStatusFilter)).orderBy(desc(transactions.createdAt));
    } else {
      return db.select({
        id: transactions.id,
        reference: transactions.reference,
        productName: transactions.productName,
        network: transactions.network,
        customerPhone: transactions.customerPhone,
        customerEmail: transactions.customerEmail,
        phoneNumbers: transactions.phoneNumbers,
        amount: transactions.amount,
        profit: transactions.profit,
        paymentStatus: transactions.paymentStatus,
        deliveryStatus: transactions.deliveryStatus,
        createdAt: transactions.createdAt,
        completedAt: transactions.completedAt,
        isBulkOrder: transactions.isBulkOrder,
      }).from(transactions).orderBy(desc(transactions.createdAt));
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [created] = await db.insert(transactions).values({
      id: randomUUID(),
      ...transaction,
    }).returning();
    return created;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return transaction;
  }

  async updateTransactionDeliveryStatus(id: string, deliveryStatus: string): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions).set({ deliveryStatus }).where(eq(transactions.id, id)).returning();
    return transaction;
  }

  async getTransactionStats(agentId?: string): Promise<{ total: number; completed: number; pending: number; revenue: number; profit: number }> {
    const conditions = agentId ? [eq(transactions.agentId, agentId)] : [];
    
    const totalSql = sql`count(*)`;
    const completedSql = sql`sum(case when status = 'completed' then 1 else 0 end)`;
    const pendingSql = sql`sum(case when status = 'pending' then 1 else 0 end)`;
    const revenueSql = sql`coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`;
    const profitSql = sql`coalesce(sum(case when status = 'completed' then cast(profit as numeric) else 0 end), 0)`;
    
    const stats = await db.select({
      total: totalSql,
      completed: completedSql,
      pending: pendingSql,
      revenue: revenueSql,
      profit: profitSql,
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

  async getWithdrawals(filters?: { userId?: string; status?: string }): Promise<Withdrawal[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(withdrawals.userId, filters.userId));
    if (filters?.status) conditions.push(eq(withdrawals.status, filters.status));

    let query = db.select().from(withdrawals);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return query.orderBy(desc(withdrawals.createdAt));
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [created] = await db.insert(withdrawals).values({
      
      ...withdrawal,
    }).returning();
    return created;
  }

  async updateWithdrawal(id: string, data: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.update(withdrawals).set(data).where(eq(withdrawals.id, id)).returning();
    return withdrawal;
  }

  // ============================================
  // PROFIT WALLETS
  // ============================================
  async getProfitWallet(userId: string): Promise<ProfitWallet | undefined> {
    const [wallet] = await db.select().from(profitWallets).where(eq(profitWallets.userId, userId)).limit(1);
    return wallet;
  }

  async createProfitWallet(wallet: InsertProfitWallet): Promise<ProfitWallet> {
    const [created] = await db.insert(profitWallets).values({
      
      ...wallet,
    }).returning();
    return created;
  }

  async updateProfitWallet(userId: string, data: Partial<ProfitWallet>): Promise<ProfitWallet | undefined> {
    const [wallet] = await db.update(profitWallets).set({ ...data, updatedAt: new Date() }).where(eq(profitWallets.userId, userId)).returning();
    return wallet;
  }

  async addProfit(userId: string, amount: number, orderId?: string, productId?: string, sellingPrice?: number, basePrice?: number): Promise<void> {
    // Start transaction for atomicity
    await db.transaction(async (tx: typeof db) => {
      // Get or create profit wallet
      let wallet = await tx.select().from(profitWallets).where(eq(profitWallets.userId, userId)).limit(1).then((rows: ProfitWallet[]) => rows[0]);
      if (!wallet) {
        [wallet] = await tx.insert(profitWallets).values({
          userId,
          availableBalance: "0.00",
          pendingBalance: "0.00",
          totalEarned: "0.00",
        }).returning();
      }

      // Create profit transaction record
      if (orderId && productId && sellingPrice && basePrice) {
        await tx.insert(profitTransactions).values({
          userId,
          orderId,
          productId,
          sellingPrice: sellingPrice.toFixed(2),
          basePrice: basePrice.toFixed(2),
          profit: amount.toFixed(2),
          status: "available", // Profits are immediately available after payment verification
        });
      }

      // Update wallet balances
      const newTotalEarned = (parseFloat(wallet.totalEarned) + amount).toFixed(2);
      const newAvailableBalance = (parseFloat(wallet.availableBalance) + amount).toFixed(2);

      await tx.update(profitWallets).set({
        totalEarned: newTotalEarned,
        availableBalance: newAvailableBalance,
        updatedAt: new Date(),
      }).where(eq(profitWallets.userId, userId));
    });
  }

  // ============================================
  // PROFIT TRANSACTIONS
  // ============================================
  async getProfitTransactions(userId: string, filters?: { status?: string; limit?: number }): Promise<ProfitTransaction[]> {
    const conditions = [eq(profitTransactions.userId, userId)];
    if (filters?.status) conditions.push(eq(profitTransactions.status, filters.status));

    let query = db.select().from(profitTransactions).where(and(...conditions));
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    return query.orderBy(desc(profitTransactions.createdAt));
  }

  async createProfitTransaction(transaction: InsertProfitTransaction): Promise<ProfitTransaction> {
    const [created] = await db.insert(profitTransactions).values({
      
      ...transaction,
    }).returning();
    return created;
  }

  async updateProfitTransactionStatus(id: string, status: string): Promise<ProfitTransaction | undefined> {
    const [transaction] = await db.update(profitTransactions).set({ status }).where(eq(profitTransactions.id, id)).returning();
    return transaction;
  }

  // ============================================
  // SMS LOGS
  // ============================================
  async createSmsLog(log: InsertSmsLog): Promise<SmsLog> {
    const [created] = await db.insert(smsLogs).values({
      
      ...log,
    }).returning();
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
    const [created] = await db.insert(auditLogs).values({
      
      ...log,
    }).returning();
    return created;
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
    totalAgents: number;
    pendingAgents: number;
    activationRevenue: number;
    todayRevenue: number;
    todayTransactions: number;
    dataBundleStock: number;
    resultCheckerStock: number;
  }> {
    const [txStats] = await db.select({
      totalTransactions: sql`count(*)`,
      totalRevenue: sql`coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`,
      totalProfit: sql`coalesce(sum(case when status = 'completed' then cast(profit as numeric) else 0 end), 0)`,
    }).from(transactions);

    // Get agent activation revenue
    const [activationStats] = await db.select({
      revenue: sql`coalesce(sum(case when status = 'completed' and type = 'agent_activation' then cast(amount as numeric) else 0 end), 0)`,
    }).from(transactions);

    const [withdrawalStats] = await db.select({
      pending: sql`count(*)`,
    }).from(withdrawals).where(eq(withdrawals.status, "pending"));

    const [agentStats] = await db.select({
      total: sql`count(*)`,
    }).from(agents);

    const [pendingAgentStats] = await db.select({
      pending: sql`count(*)`,
    }).from(agents).where(eq(agents.paymentPending, true));

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats] = await db.select({
      revenue: sql`coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`,
      transactions: sql`count(*)`,
    }).from(transactions).where(and(gte(transactions.createdAt, today), lt(transactions.createdAt, tomorrow)));

    const [bundleStats] = await db.select({
      count: sql`count(*)`,
    }).from(dataBundles).where(eq(dataBundles.isActive, true));

    const [checkerStats] = await db.select({
      count: sql`count(*)`,
    }).from(resultCheckers).where(eq(resultCheckers.isSold, false));

    return {
      totalRevenue: Number(txStats?.totalRevenue || 0),
      totalProfit: Number(txStats?.totalProfit || 0),
      totalTransactions: Number(txStats?.totalTransactions || 0),
      pendingWithdrawals: Number(withdrawalStats?.pending || 0),
      totalAgents: Number(agentStats?.total || 0),
      pendingAgents: Number(pendingAgentStats?.pending || 0),
      activationRevenue: Number(activationStats?.revenue || 0),
      todayRevenue: Number(todayStats?.revenue || 0),
      todayTransactions: Number(todayStats?.transactions || 0),
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
    
    const chatIds = userChats.map((chat: { id: string }) => chat.id);
    
    // Count unread messages from admin in user's chats
    const result = await db.select({ count: count() })
      .from(chatMessages)
      .where(
        and(
          chatIds.length > 0 ? inArray(chatMessages.chatId, chatIds) : eq(chatMessages.chatId, ''),
          eq(chatMessages.senderType, 'admin'),
          eq(chatMessages.isRead, false)
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  async getUnreadAdminMessagesCount(): Promise<number> {
    // Count all unread messages from users across all chats
    const result = await db.select({ count: sql`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.senderType, 'user'),
          eq(chatMessages.isRead, false)
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  // Agent Pricing Methods
  // Custom Pricing (Unified for all roles)
  async getCustomPricing(roleOwnerId: string, role: string): Promise<Array<{ productId: string; sellingPrice: string }>> {
    try {
      const pricing = await db.select({
        productId: customPricing.productId,
        sellingPrice: customPricing.sellingPrice,
      })
        .from(customPricing)
        .where(
          and(
            eq(customPricing.roleOwnerId, roleOwnerId),
            eq(customPricing.role, role)
          )
        );

      return pricing.map((p: { productId: string; sellingPrice: string | null }) => ({
        productId: p.productId,
        sellingPrice: p.sellingPrice || "0",
      }));
    } catch (error) {
      console.warn("Custom pricing table not available:", error);
      return [];
    }
  }

  async setCustomPricing(productId: string, roleOwnerId: string, role: string, sellingPrice: string): Promise<void> {
    const priceNum = parseFloat(sellingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      throw new Error('Invalid selling price');
    }

    try {
      // Check if pricing exists
      const [existing] = await db.select()
        .from(customPricing)
        .where(
          and(
            eq(customPricing.productId, productId),
            eq(customPricing.roleOwnerId, roleOwnerId),
            eq(customPricing.role, role)
          )
        )
        .limit(1);

      if (existing) {
        // Update existing
        await db.update(customPricing)
          .set({
            sellingPrice: sellingPrice,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(customPricing.productId, productId),
              eq(customPricing.roleOwnerId, roleOwnerId),
              eq(customPricing.role, role)
            )
          );
      } else {
        // Insert new
        await db.insert(customPricing).values({
          
          productId,
          roleOwnerId,
          role,
          sellingPrice: sellingPrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Custom pricing update error:", error);
      throw new Error("Failed to update custom pricing");
    }
  }

  async deleteCustomPricing(productId: string, roleOwnerId: string, role: string): Promise<void> {
    try {
      await db.delete(customPricing)
        .where(
          and(
            eq(customPricing.productId, productId),
            eq(customPricing.roleOwnerId, roleOwnerId),
            eq(customPricing.role, role)
          )
        );
    } catch (error) {
      console.error("Custom pricing delete error:", error);
      throw new Error("Failed to delete custom pricing");
    }
  }

  async getCustomPrice(productId: string, roleOwnerId: string, role: string): Promise<string | null> {
    try {
      const [result] = await db.select({
        sellingPrice: customPricing.sellingPrice,
      })
        .from(customPricing)
        .where(
          and(
            eq(customPricing.productId, productId),
            eq(customPricing.roleOwnerId, roleOwnerId),
            eq(customPricing.role, role)
          )
        )
        .limit(1);

      return result?.sellingPrice || null;
    } catch (error) {
      console.warn("Custom pricing lookup error:", error);
      return null;
    }
  }

  // Admin Base Prices
  async getAdminBasePrice(productId: string): Promise<string | null> {
    try {
      const [result] = await db.select({
        basePrice: adminBasePrices.basePrice,
      })
        .from(adminBasePrices)
        .where(eq(adminBasePrices.productId, productId))
        .limit(1);

      return result?.basePrice || null;
    } catch (error) {
      console.warn("Admin base price lookup error:", error);
      return null;
    }
  }

  async setAdminBasePrice(productId: string, basePrice: string): Promise<void> {
    const priceNum = parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      throw new Error('Invalid base price');
    }

    try {
      // Check if base price exists
      const [existing] = await db.select()
        .from(adminBasePrices)
        .where(eq(adminBasePrices.productId, productId))
        .limit(1);

      if (existing) {
        // Update existing
        await db.update(adminBasePrices)
          .set({
            basePrice: basePrice,
            updatedAt: new Date()
          })
          .where(eq(adminBasePrices.productId, productId));
      } else {
        // Insert new
        await db.insert(adminBasePrices).values({
          
          productId,
          basePrice: basePrice,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Admin base price update error:", error);
      throw new Error("Failed to update admin base price");
    }
  }

  // Price Resolution (combines custom + admin base price)
  async getResolvedPrice(productId: string, roleOwnerId: string, role: string): Promise<string | null> {
    // First check for custom selling price
    const customPrice = await this.getCustomPrice(productId, roleOwnerId, role);
    if (customPrice) {
      return customPrice;
    }

    // Fall back to role base price
    return await this.getRoleBasePrice(productId, role);
  }
  async getRoleBasePrices(): Promise<Array<{ bundleId: string; role: string; basePrice: string }>> {
    try {
      // Get all active data bundles with their pricing
      const bundles = await db.select({
        id: dataBundles.id,
        basePrice: dataBundles.basePrice,
        agentPrice: dataBundles.agentPrice,
        dealerPrice: dataBundles.dealerPrice,
        superDealerPrice: dataBundles.superDealerPrice,
        masterPrice: dataBundles.masterPrice,
        adminPrice: dataBundles.adminPrice,
      })
        .from(dataBundles)
        .where(eq(dataBundles.isActive, true));

      // Transform the data to match the expected format
      const prices: Array<{ bundleId: string; role: string; basePrice: string }> = [];

      bundles.forEach((bundle: { id: string; basePrice: string | null; agentPrice: string | null; dealerPrice: string | null; superDealerPrice: string | null; masterPrice: string | null; adminPrice: string | null }) => {
        // Add pricing for each role
        prices.push({
          bundleId: bundle.id,
          role: 'admin',
          basePrice: bundle.adminPrice || bundle.basePrice || "0",
        });
        prices.push({
          bundleId: bundle.id,
          role: 'agent',
          basePrice: bundle.agentPrice || bundle.basePrice || "0",
        });
        prices.push({
          bundleId: bundle.id,
          role: 'dealer',
          basePrice: bundle.dealerPrice || bundle.basePrice || "0",
        });
        prices.push({
          bundleId: bundle.id,
          role: 'super_dealer',
          basePrice: bundle.superDealerPrice || bundle.basePrice || "0",
        });
        prices.push({
          bundleId: bundle.id,
          role: 'master',
          basePrice: bundle.masterPrice || bundle.basePrice || "0",
        });
      });

      return prices;
    } catch (error) {
      console.warn("Error fetching role base prices from data bundles:", error);
      return [];
    }
  }

  async setRoleBasePrice(bundleId: string, role: string, basePrice: string, userRole: string): Promise<void> {
    // ENFORCEMENT: Only admin can set role base prices
    if (userRole !== 'admin') {
      throw new Error('Only admin can set role base prices');
    }

    try {
      // Update the appropriate pricing column in the data bundles table based on role
      switch (role) {
        case 'admin':
          await db.update(dataBundles)
            .set({ adminPrice: basePrice })
            .where(eq(dataBundles.id, bundleId));
          break;
        case 'agent':
          await db.update(dataBundles)
            .set({ agentPrice: basePrice })
            .where(eq(dataBundles.id, bundleId));
          break;
        case 'dealer':
          await db.update(dataBundles)
            .set({ dealerPrice: basePrice })
            .where(eq(dataBundles.id, bundleId));
          break;
        case 'super_dealer':
          await db.update(dataBundles)
            .set({ superDealerPrice: basePrice })
            .where(eq(dataBundles.id, bundleId));
          break;
        case 'master':
          await db.update(dataBundles)
            .set({ masterPrice: basePrice })
            .where(eq(dataBundles.id, bundleId));
          break;
        default:
          throw new Error(`Invalid role: ${role}`);
      }
    } catch (error) {
      console.warn("Error updating role base price in data bundles:", error);
      throw error;
    }
  }

  async getRoleBasePrice(bundleId: string, role: string): Promise<string | null> {
    try {
      // First check if admin has set a role-specific base price
      const [rolePrice] = await db.select({
        basePrice: roleBasePrices.basePrice,
      })
        .from(roleBasePrices)
        .where(and(
          eq(roleBasePrices.bundleId, bundleId),
          eq(roleBasePrices.role, role)
        ))
        .limit(1);

      if (rolePrice?.basePrice) {
        return rolePrice.basePrice;
      }

      // Fallback to the pricing column from the data bundles table based on role
      let result;
      switch (role) {
        case 'admin':
          [result] = await db.select({ price: dataBundles.adminPrice })
            .from(dataBundles)
            .where(eq(dataBundles.id, bundleId))
            .limit(1);
          break;
        case 'agent':
          [result] = await db.select({ price: dataBundles.agentPrice })
            .from(dataBundles)
            .where(eq(dataBundles.id, bundleId))
            .limit(1);
          break;
        case 'dealer':
          [result] = await db.select({ price: dataBundles.dealerPrice })
            .from(dataBundles)
            .where(eq(dataBundles.id, bundleId))
            .limit(1);
          break;
        case 'super_dealer':
          [result] = await db.select({ price: dataBundles.superDealerPrice })
            .from(dataBundles)
            .where(eq(dataBundles.id, bundleId))
            .limit(1);
          break;
        case 'master':
          [result] = await db.select({ price: dataBundles.masterPrice })
            .from(dataBundles)
            .where(eq(dataBundles.id, bundleId))
            .limit(1);
          break;
        default:
          return null;
      }

      return result?.price || null;
    } catch (error) {
      console.warn("Error fetching role base price:", error);
      return null;
    }
  }

  // Rankings Methods
  async getTopCustomers(limit: number = 10): Promise<Array<{
    customerEmail: string;
    customerPhone: string | null;
    totalPurchases: number;
    totalSpent: number;
    lastPurchase: Date;
  }>> {
    const results = await db.select({
      customerEmail: max(transactions.customerEmail),
      customerPhone: transactions.customerPhone,
      totalPurchases: count(),
      totalSpent: sum(transactions.amount),
      lastPurchase: sql<Date>`coalesce(max(${transactions.createdAt}), '1970-01-01')`,
    })
      .from(transactions)
      .where(eq(transactions.status, 'completed'))
      .groupBy(transactions.customerPhone)
      .orderBy(desc(sum(transactions.amount)))
      .limit(limit);

    return results.map((r: { customerEmail: string | null; customerPhone: string | null; totalPurchases: number; totalSpent: string | null; lastPurchase: Date }) => ({
      customerEmail: r.customerEmail || '',
      customerPhone: r.customerPhone,
      totalPurchases: Number(r.totalPurchases),
      totalSpent: Number(r.totalSpent),
      lastPurchase: r.lastPurchase,
    }));
  }

  // ============================================
  // ANNOUNCEMENTS
  // ============================================
  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(announcements).values({
      
      ...announcement,
    }).returning();
    return result[0];
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const result = await db.update(announcements)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return result[0];
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================
  // API KEYS
  // ============================================
  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
    return result[0];
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const result = await db.insert(apiKeys).values({
      
      ...apiKey,
    }).returning();
    return result[0];
  }

  async updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const result = await db.update(apiKeys).set(data).where(eq(apiKeys.id, id)).returning();
    return result[0];
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================
  // SETTINGS
  // ============================================
  async getSetting(key: string): Promise<string | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    return result[0]?.value;
  }

  async setSetting(key: string, value: string, description?: string): Promise<void> {
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    
    if (existing[0]) {
      await db.update(settings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value, description });
    }
  }

  async getAllSettings(): Promise<Array<{ key: string; value: string; description?: string }>> {
    const result: Settings[] = await db.select().from(settings);
    return result.map(setting => ({
      key: setting.key,
      value: setting.value,
      description: setting.description || undefined,
    }));
  }

  // ============================================
  // WALLET TOP-UP TRANSACTIONS
  // ============================================
  async createWalletTopupTransaction(topup: InsertWalletTopupTransaction): Promise<WalletTopupTransaction> {
    const [created] = await db.insert(walletTopupTransactions).values({
      id: randomUUID(),
      ...topup,
    }).returning();
    return created;
  }

  async getWalletTopupTransactions(filters?: { userId?: string; adminId?: string }): Promise<WalletTopupTransaction[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(walletTopupTransactions.userId, filters.userId));
    if (filters?.adminId) conditions.push(eq(walletTopupTransactions.adminId, filters.adminId));

    let query = db.select().from(walletTopupTransactions);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return query.orderBy(desc(walletTopupTransactions.createdAt));
  }
}


export const storage = new DatabaseStorage();
