import { eq, and, desc, sql, gte, lte, or, like, max, sum, count, inArray, lt, isNotNull, ne, isNull } from "drizzle-orm";
import { db } from "./db.js";
import { randomUUID } from "crypto";
import { normalizePhoneNumber } from "./utils/network-validator.js";

// Retry logic for database operations in case of connection loss
async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is connection-related
      const isConnectionError = 
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('ENOTFOUND') ||
        error.message?.includes('connection') ||
        error.message?.includes('pool') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND';
      
      if (isConnectionError && attempt < maxRetries) {
        // Wait before retrying for connection errors
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else if (!isConnectionError) {
        // Don't retry non-connection errors
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Database operation failed after all retries');
}

import {
  users, agents, dataBundles, resultCheckers, transactions, withdrawals, smsLogs, auditLogs, settings,
    supportChats, chatMessages, customPricing, adminBasePrices, roleBasePrices, announcements, apiKeys, walletTopupTransactions, walletDeductionTransactions,
  profitWallets, profitTransactions, externalApiProviders, videoGuides,
  ProductType,
  type User, type InsertUser, type Agent, type InsertAgent,
  type DataBundle, type InsertDataBundle, type ResultChecker, type InsertResultChecker,
  type Transaction, type InsertTransaction, type Withdrawal, type InsertWithdrawal,
  type SmsLog, type InsertSmsLog, type AuditLog, type InsertAuditLog,
  type SupportChat, type InsertSupportChat, type ChatMessage, type InsertChatMessage,
  type Announcement, type InsertAnnouncement, type ApiKey, type InsertApiKey,
  type CustomPricing, type InsertCustomPricing, type AdminBasePrices, type InsertAdminBasePrices,
  type RoleBasePrices, type InsertRoleBasePrices,
    type WalletTopupTransaction, type InsertWalletTopupTransaction, type WalletDeductionTransaction, type InsertWalletDeductionTransaction,
  type ProfitWallet, type InsertProfitWallet, type ProfitTransaction, type InsertProfitTransaction,
  type Settings, type ExternalApiProvider, type InsertExternalApiProvider, type UpdateExternalApiProvider,
  type InsertVideoGuide, type VideoGuide
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
  getAvailableResultCheckersByQuantity(type: string, year: number, quantity: number): Promise<ResultChecker[]>;
    getResultCheckersByTransaction(transactionId: string): Promise<ResultChecker[]>;
  getResultCheckerStock(type: string, year: number): Promise<number>;
  getResultCheckers(filters?: { type?: string; year?: number; isSold?: boolean }): Promise<ResultChecker[]>;
  getResultCheckerSummary(): Promise<{ type: string; year: number; total: number; available: number; sold: number }[]>;
  createResultChecker(checker: InsertResultChecker): Promise<ResultChecker>;
  createResultCheckersBulk(checkers: InsertResultChecker[]): Promise<ResultChecker[]>;
  updateResultChecker(id: string, data: Partial<InsertResultChecker>): Promise<ResultChecker | undefined>;
  deleteResultChecker(id: string): Promise<boolean>;
  deleteSoldCheckers(): Promise<number>;
  markResultCheckerSold(id: string, transactionId: string, phone: string | null): Promise<ResultChecker | undefined>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionByReference(reference: string): Promise<Transaction | undefined>;
  getTransactionByBeneficiaryPhone(phone: string): Promise<Transaction | undefined>;
  getLatestDataBundleTransactionByPhone(phone: string): Promise<Transaction | undefined>;
  getTransactions(filters?: { customerEmail?: string; agentId?: string; status?: string; type?: string; limit?: number; offset?: number }): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
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

  // External API Providers
  getExternalApiProviders(): Promise<ExternalApiProvider[]>;
  getExternalApiProvider(id: string): Promise<ExternalApiProvider | undefined>;
  getActiveExternalApiProviders(): Promise<ExternalApiProvider[]>;
  getDefaultExternalApiProvider(): Promise<ExternalApiProvider | undefined>;
  getProviderForNetwork(network?: string): Promise<ExternalApiProvider | undefined>;
  createExternalApiProvider(provider: InsertExternalApiProvider): Promise<ExternalApiProvider>;
  updateExternalApiProvider(id: string, data: UpdateExternalApiProvider): Promise<ExternalApiProvider | undefined>;
  deleteExternalApiProvider(id: string): Promise<boolean>;
  setDefaultExternalApiProvider(id: string): Promise<void>;

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
  getCustomPricing(roleOwnerId: string, role: string): Promise<Array<{ productId: string; sellingPrice: string; profit?: string | null }>>;
  setCustomPricing(productId: string, roleOwnerId: string, role: string, sellingPrice: string, profit?: string): Promise<void>;
  deleteCustomPricing(productId: string, roleOwnerId: string, role: string): Promise<void>;
  getCustomPrice(productId: string, roleOwnerId: string, role: string): Promise<string | null>;
  getStoredProfit(productId: string, roleOwnerId: string, role: string): Promise<string | null>;

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
    customerName: string | null;
    totalPurchases: number;
    totalSpent: number;
    rank: number;
    lastPurchase: string;
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

  getRevenueAnalytics(days?: number): Promise<Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>>;

  // API Keys
  getApiKeys(userId: string): Promise<ApiKey[]>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<boolean>;

  // Wallet Top-up Transactions
  createWalletTopupTransaction(topup: InsertWalletTopupTransaction): Promise<WalletTopupTransaction>;
  updateWalletTopupTransaction(id: string, data: Partial<WalletTopupTransaction>): Promise<WalletTopupTransaction | undefined>;
  getWalletTopupTransactions(filters?: { userId?: string; adminId?: string }): Promise<WalletTopupTransaction[]>;

    // Wallet Deduction Transactions
    createWalletDeductionTransaction(deduction: InsertWalletDeductionTransaction): Promise<WalletDeductionTransaction>;
    getWalletDeductionTransactions(filters?: { userId?: string; adminId?: string }): Promise<WalletDeductionTransaction[]>;

  // Cron Job Helpers
  getTransactionsByStatusAndDelivery(status: string | string[], deliveryStatus: string | string[]): Promise<Transaction[]>;
  getFailedTransactionsOlderThan(cutoffDate: Date): Promise<Transaction[]>;

  // Settings
  getSetting(key: string): Promise<string | undefined>;
  setSetting(key: string, value: string, description?: string): Promise<void>;
  getAllSettings(): Promise<Array<{ key: string; value: string; description?: string }>>;

  // Video Guides
  getVideoGuides(filters?: { category?: string; publishedOnly?: boolean }): Promise<VideoGuide[]>;
  getVideoGuide(id: string): Promise<VideoGuide | undefined>;
  createVideoGuide(guide: InsertVideoGuide): Promise<VideoGuide>;
  updateVideoGuide(id: string, data: Partial<InsertVideoGuide>): Promise<VideoGuide | undefined>;
  deleteVideoGuide(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  getProduct(productId: string) {
    throw new Error("Method not implemented.");
  }
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

  async getAvailableResultCheckersByQuantity(type: string, year: number, quantity: number): Promise<ResultChecker[]> {
    const checkers = await db.select().from(resultCheckers)
      .where(and(
        eq(resultCheckers.type, type),
        eq(resultCheckers.year, year),
        eq(resultCheckers.isSold, false)
      ))
      .limit(quantity);
    return checkers;
  }

  async getResultCheckersByTransaction(transactionId: string): Promise<ResultChecker[]> {
    const checkers = await db.select().from(resultCheckers)
      .where(eq(resultCheckers.transactionId, transactionId));
    return checkers;
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

  async deleteSoldCheckers(): Promise<number> {
    const result = await db.delete(resultCheckers).where(eq(resultCheckers.isSold, true));
    return result.rowCount ?? 0;
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

  async getLatestDataBundleTransactionByPhone(phone: string): Promise<Transaction | undefined> {
    const normalized = normalizePhoneNumber(phone);
    
    // Check for ANY recent transaction (paid, pending, or processing) to prevent cooldown bypass
    let [transaction] = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.type, ProductType.DATA_BUNDLE),
        eq(transactions.customerPhone, normalized)
      ))
      .orderBy(desc(transactions.createdAt))
      .limit(1);

    if (transaction) {
      return transaction;
    }

    // Also check in phoneNumbers JSON field for bulk orders
    const likePattern = `%${normalized}%`;
    const matches = await db.select()
      .from(transactions)
      .where(and(
        eq(transactions.type, ProductType.DATA_BUNDLE),
        sql`${transactions.phoneNumbers} LIKE ${likePattern}`
      ))
      .orderBy(desc(transactions.createdAt))
      .limit(1);
    transaction = matches[0];

    return transaction;
  }

  async getTransactions(filters?: { customerEmail?: string; customerPhone?: string; agentId?: string; status?: string; type?: string; limit?: number; offset?: number }): Promise<Transaction[]> {
    const conditions = [];
    if (filters?.customerEmail) conditions.push(eq(transactions.customerEmail, filters.customerEmail));
    if (filters?.customerPhone) conditions.push(eq(transactions.customerPhone, filters.customerPhone));
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

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return true;
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
    const profitSql = sql`coalesce(sum(case when status = 'completed' then cast(agent_profit as numeric) else 0 end), 0)`;
    
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
    totalAgentProfits: number;
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

    // Get total agent profits from completed transactions
    const [agentProfitStats] = await db.select({
      totalAgentProfits: sql`coalesce(sum(case when status = 'completed' and agent_id is not null then cast(agent_profit as numeric) else 0 end), 0)`,
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
      totalAgentProfits: Number(agentProfitStats?.totalAgentProfits || 0),
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

  async getRevenueAnalytics(days: number = 7): Promise<Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>> {
    const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (safeDays - 1));

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    // Pre-seed map so the frontend always receives a contiguous date range
    const dailyTotals = new Map<string, { revenue: number; transactions: number }>();
    for (let i = 0; i < safeDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const key = current.toISOString().slice(0, 10);
      dailyTotals.set(key, { revenue: 0, transactions: 0 });
    }

    const rows = await db.select({
      amount: transactions.amount,
      status: transactions.status,
      createdAt: transactions.createdAt,
    })
      .from(transactions)
      .where(and(
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate),
      ));

    for (const row of rows) {
      if (!row.createdAt) continue;

      const dateKey = new Date(row.createdAt).toISOString().slice(0, 10);
      const totals = dailyTotals.get(dateKey);
      if (!totals) continue;

      if (row.status === 'completed') {
        const amount = Number.parseFloat(row.amount || "0");
        totals.revenue += Number.isFinite(amount) ? amount : 0;
        totals.transactions += 1;
      }
    }

    return Array.from(dailyTotals.entries()).map(([date, totals]) => ({
      date,
      revenue: Number(totals.revenue.toFixed(2)),
      transactions: totals.transactions,
    }));
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
  async getCustomPricing(roleOwnerId: string, role: string): Promise<Array<{ productId: string; sellingPrice: string; profit?: string | null }>> {
    try {
      const pricing = await db.select({
        productId: customPricing.productId,
        sellingPrice: customPricing.sellingPrice,
        profit: customPricing.profit,
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
      return [];
    }
  }

  async setCustomPricing(productId: string, roleOwnerId: string, role: string, sellingPrice: string, profit?: string): Promise<void> {
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
            profit: profit || null,
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
          profit: profit || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
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
      throw new Error("Failed to delete custom pricing");
    }
  }

  async getStoredProfit(productId: string, roleOwnerId: string, role: string): Promise<string | null> {
    try {
      const [result] = await db.select({ profit: customPricing.profit })
        .from(customPricing)
        .where(
          and(
            eq(customPricing.productId, productId),
            eq(customPricing.roleOwnerId, roleOwnerId),
            eq(customPricing.role, role)
          )
        )
        .limit(1);
      return result?.profit || null;
    } catch (error) {
      return null;
    }
  }

  async getCustomPrice(productId: string, roleOwnerId: string, role: string): Promise<string | null> {
    try {
      console.log(`[Storage] getCustomPrice called: productId=${productId}, roleOwnerId=${roleOwnerId}, role=${role}`);
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

      console.log(`[Storage] getCustomPrice result: ${result?.sellingPrice || null}`);
      return result?.sellingPrice || null;
    } catch (error) {
      console.log(`[Storage] getCustomPrice error: ${error}`);
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
      return null;
    }
  }

  // Rankings Methods
  async getTopCustomers(limit: number = 10): Promise<Array<{
    customerEmail: string;
    customerPhone: string | null;
    customerName: string | null;
    totalPurchases: number;
    totalSpent: number;
    rank: number;
    lastPurchase: string;
  }>> {
    try {
      // First, get all customer emails from completed transactions
      const allCustomerEmails = await db.select({
        email: transactions.customerEmail,
      })
        .from(transactions)
        .where(and(
          eq(transactions.status, 'completed'),
          isNotNull(transactions.customerEmail),
          ne(transactions.customerEmail, '')
        ))
        .groupBy(transactions.customerEmail);

      const emailList = allCustomerEmails.map((row: any) => row.email).filter(Boolean);

      // Filter out agent emails by checking user roles
      let filteredEmails: string[] = [];
      if (emailList.length > 0) {
        const userRoles = await db.select({
          email: users.email,
          role: users.role,
        })
          .from(users)
          .where(inArray(users.email, emailList));

        // Include emails that are either not in users table (guests) or have user/guest role
        const agentEmails = new Set(userRoles
          .filter((user: any) => user.role && !['user', 'guest'].includes(user.role))
          .map((user: any) => user.email)
        );

        filteredEmails = emailList.filter((email: string) => !agentEmails.has(email));
      }

      // Now get stats only for filtered customers
      let customerStats: any[] = [];
      if (filteredEmails.length > 0) {
        customerStats = await db.select({
          customerEmail: transactions.customerEmail,
          customerPhone: max(transactions.customerPhone),
          totalPurchases: count(),
          totalSpent: sql`coalesce(sum(cast(${transactions.amount} as numeric)), 0)`,
          lastPurchase: max(transactions.createdAt),
        })
          .from(transactions)
          .where(and(
            eq(transactions.status, 'completed'),
            inArray(transactions.customerEmail, filteredEmails)
          ))
          .groupBy(transactions.customerEmail);
      }

      // Get user names for the customers
      const customerEmails = customerStats.map((stat: any) => stat.customerEmail).filter(Boolean);
      
      let userRecords: any[] = [];
      if (customerEmails.length > 0) {
        userRecords = await db.select({
          email: users.email,
          name: users.name,
        })
          .from(users)
          .where(inArray(users.email, customerEmails));
      }

      const userMap = new Map(userRecords.map((user: any) => [user.email, user.name]));

      // Sort and assign ranks
      const sortedCustomers = customerStats
        .map((stat: any) => ({
          customerEmail: stat.customerEmail!,
          customerPhone: stat.customerPhone || null,
          customerName: userMap.get(stat.customerEmail!) || null,
          totalPurchases: Number(stat.totalPurchases) || 0,
          totalSpent: Number(stat.totalSpent) || 0,
          lastPurchase: stat.lastPurchase,
        }))
        .sort((a: any, b: any) => {
          // Primary sort: total spent descending
          if (b.totalSpent !== a.totalSpent) {
            return b.totalSpent - a.totalSpent;
          }
          // Secondary sort: total purchases descending (tie-breaker)
          return b.totalPurchases - a.totalPurchases;
        })
        .slice(0, limit)
        .map((customer: any, index: number) => ({
          ...customer,
          rank: index + 1,
          lastPurchase: customer.lastPurchase ? customer.lastPurchase.toISOString() : new Date().toISOString(),
        }));

      return sortedCustomers;
    } catch (error) {
      throw error;
    }
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
  // VIDEO GUIDES
  // ============================================
  async getVideoGuides(filters?: { category?: string; publishedOnly?: boolean }): Promise<VideoGuide[]> {
    let query = db.select().from(videoGuides);
    const conditions = [] as any[];
    if (filters?.category) conditions.push(eq(videoGuides.category, filters.category));
    if (filters?.publishedOnly) conditions.push(eq(videoGuides.isPublished, true));
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return query.orderBy(desc(videoGuides.createdAt));
  }

  async getVideoGuide(id: string): Promise<VideoGuide | undefined> {
    const result = await db.select().from(videoGuides).where(eq(videoGuides.id, id)).limit(1);
    return result[0];
  }

  async createVideoGuide(guide: InsertVideoGuide): Promise<VideoGuide> {
    const [created] = await db.insert(videoGuides).values({
      id: randomUUID(),
      ...guide,
    }).returning();
    return created;
  }

  async updateVideoGuide(id: string, data: Partial<InsertVideoGuide>): Promise<VideoGuide | undefined> {
    const [updated] = await db.update(videoGuides)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(videoGuides.id, id))
      .returning();
    return updated;
  }

  async deleteVideoGuide(id: string): Promise<boolean> {
    const result = await db.delete(videoGuides).where(eq(videoGuides.id, id));
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
  // EXTERNAL API PROVIDERS
  // ============================================
  async getExternalApiProviders(): Promise<ExternalApiProvider[]> {
    return await db.select().from(externalApiProviders).orderBy(desc(externalApiProviders.createdAt));
  }

  async getExternalApiProvider(id: string): Promise<ExternalApiProvider | undefined> {
    const result = await db.select().from(externalApiProviders).where(eq(externalApiProviders.id, id)).limit(1);
    return result[0];
  }

  async getActiveExternalApiProviders(): Promise<ExternalApiProvider[]> {
    return await db.select().from(externalApiProviders).where(eq(externalApiProviders.isActive, true));
  }

  async getDefaultExternalApiProvider(): Promise<ExternalApiProvider | undefined> {
    const result = await db.select().from(externalApiProviders)
      .where(eq(externalApiProviders.isDefault, true))
      .limit(1);
    return result[0];
  }

  async getProviderForNetwork(network?: string): Promise<ExternalApiProvider | undefined> {
    // If no network specified, return default provider
    if (!network) {
      return await this.getDefaultExternalApiProvider();
    }

    // Get all active providers
    const activeProviders = await this.getActiveExternalApiProviders();
    
    // Find a provider that supports this network in their network mappings
    for (const provider of activeProviders) {
      if (provider.networkMappings) {
        try {
          const mappings = JSON.parse(provider.networkMappings);
          if (mappings[network]) {
            return provider;
          }
        } catch (e) {
          // Continue to next provider if JSON parsing fails
          continue;
        }
      }
    }

    // If no provider supports the network specifically, use default
    return await this.getDefaultExternalApiProvider();
  }

  async createExternalApiProvider(provider: InsertExternalApiProvider): Promise<ExternalApiProvider> {
    // If this is set as default, unset other defaults
    if (provider.isDefault) {
      await db.update(externalApiProviders)
        .set({ isDefault: false })
        .where(eq(externalApiProviders.isDefault, true));
    }

    const [created] = await db.insert(externalApiProviders).values({
      id: randomUUID(),
      ...provider,
    }).returning();
    return created;
  }

  async updateExternalApiProvider(id: string, data: UpdateExternalApiProvider): Promise<ExternalApiProvider | undefined> {
    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await db.update(externalApiProviders)
        .set({ isDefault: false })
        .where(eq(externalApiProviders.isDefault, true));
    }

    const result = await db.update(externalApiProviders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(externalApiProviders.id, id))
      .returning();
    return result[0];
  }

  async deleteExternalApiProvider(id: string): Promise<boolean> {
    const result = await db.delete(externalApiProviders).where(eq(externalApiProviders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async setDefaultExternalApiProvider(id: string): Promise<void> {
    // First, unset all defaults
    await db.update(externalApiProviders)
      .set({ isDefault: false })
      .where(eq(externalApiProviders.isDefault, true));

    // Then set the new default
    await db.update(externalApiProviders)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(externalApiProviders.id, id));
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

  async updateWalletTopupTransaction(id: string, data: Partial<WalletTopupTransaction>): Promise<WalletTopupTransaction | undefined> {
    const [updated] = await db.update(walletTopupTransactions).set(data).where(eq(walletTopupTransactions.id, id)).returning();
    return updated;
  }

  // ============================================
  // WALLET DEDUCTION TRANSACTIONS
  // ============================================
  async createWalletDeductionTransaction(deduction: InsertWalletDeductionTransaction): Promise<WalletDeductionTransaction> {
    const [created] = await db.insert(walletDeductionTransactions).values({
      id: randomUUID(),
      ...deduction,
    }).returning();
    return created;
  }

  async getWalletDeductionTransactions(filters?: { userId?: string; adminId?: string }): Promise<WalletDeductionTransaction[]> {
    const conditions = [];
    if (filters?.userId) conditions.push(eq(walletDeductionTransactions.userId, filters.userId));
    if (filters?.adminId) conditions.push(eq(walletDeductionTransactions.adminId, filters.adminId));

    let query = db.select().from(walletDeductionTransactions);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    return query.orderBy(desc(walletDeductionTransactions.createdAt));
  }

  // ============================================
  // CRON JOB HELPERS
  // ============================================

  async getTransactionsByStatusAndDelivery(status: string | string[], deliveryStatus: string | string[]): Promise<Transaction[]> {
    const statusList = Array.isArray(status) ? status : [status];
    const deliveryList = Array.isArray(deliveryStatus) ? deliveryStatus : [deliveryStatus];

    return db.select()
      .from(transactions)
      .where(and(
        inArray(transactions.status, statusList),
        inArray(transactions.deliveryStatus, deliveryList),
        eq(transactions.type, 'data_bundle') // Only data bundle transactions
      ))
      .orderBy(desc(transactions.createdAt));
  }

  async getFailedTransactionsOlderThan(cutoffDate: Date): Promise<Transaction[]> {
    return db.select()
      .from(transactions)
      .where(and(
        eq(transactions.deliveryStatus, 'failed'),
        eq(transactions.type, 'data_bundle'),
        lt(transactions.createdAt, cutoffDate)
      ))
      .orderBy(desc(transactions.createdAt));
  }

  // Get current Paystack balance from database
  async getPaystackBalance(): Promise<number> {
    try {
      // Use a cache stored in withdrawals table's metadata for now
      // Return 0 if no value found yet
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Update Paystack balance in database
  async setPaystackBalance(balance: number): Promise<void> {
    try {
      // Store balance for future use
      // Can be retrieved and displayed on dashboard
    } catch (error) {
      // Silently fail - this is just a cache
    }
  }
}


export const storage = new DatabaseStorage();

