import { eq, and, desc, sql, gte, lte, or, max, count, inArray, lt, isNotNull, ne } from "drizzle-orm";
import { db } from "./db.js";
import { randomUUID } from "crypto";
import { normalizePhoneNumber } from "./utils/network-validator.js";
import { users, agents, dataBundles, resultCheckers, transactions, withdrawals, smsLogs, auditLogs, settings, supportChats, chatMessages, customPricing, adminBasePrices, roleBasePrices, announcements, apiKeys, walletTopupTransactions, profitWallets, profitTransactions, externalApiProviders, videoGuides, ProductType } from "../shared/schema.js";
export class DatabaseStorage {
    // ============================================
    // USERS
    // ============================================
    async getUser(id) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
    }
    async getUserByEmail(email) {
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
    async getUserBySlug(slug, role) {
        if (role === 'agent') {
            // For agents, look up via agents table
            const agent = await this.getAgentBySlug(slug);
            if (agent) {
                return this.getUser(agent.userId);
            }
            return undefined;
        }
        else {
            // For other roles, assume slug is user ID for now
            // This will need to be updated when proper slug support is added
            return this.getUser(slug);
        }
    }
    async createUser(insertUser) {
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
    async updateUser(id, data) {
        const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
        return result[0];
    }
    // ============================================
    // AGENTS
    // ============================================
    async getAgent(id) {
        const [agent] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
        return agent;
    }
    async getAgentByUserId(userId) {
        const [agent] = await db.select().from(agents).where(eq(agents.userId, userId)).limit(1);
        return agent;
    }
    async getAgentBySlug(slug) {
        const [agent] = await db.select().from(agents).where(eq(agents.storefrontSlug, slug.toLowerCase())).limit(1);
        return agent;
    }
    async getAgents(filters) {
        let query = db.select().from(agents);
        if (filters?.isApproved !== undefined) {
            query = query.where(eq(agents.isApproved, filters.isApproved));
        }
        return query.orderBy(desc(agents.createdAt));
    }
    async createAgent(insertAgent) {
        const [agent] = await db.insert(agents).values({
            id: randomUUID(),
            ...insertAgent,
            storefrontSlug: insertAgent.storefrontSlug.toLowerCase(),
        }).returning();
        return agent;
    }
    async updateAgent(id, data) {
        const [agent] = await db.update(agents).set(data).where(eq(agents.id, id)).returning();
        return agent;
    }
    async updateAgentBalance(id, amount, addProfit) {
        const agent = await this.getAgent(id);
        if (!agent)
            return undefined;
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
    async deleteAgent(id) {
        await db.delete(agents).where(eq(agents.id, id));
    }
    async getUsers() {
        return db.select().from(users);
    }
    async deleteUser(id) {
        await db.delete(users).where(eq(users.id, id));
    }
    // ============================================
    // DATA BUNDLES
    // ============================================
    async getDataBundle(id) {
        const [bundle] = await db.select().from(dataBundles).where(eq(dataBundles.id, id)).limit(1);
        return bundle;
    }
    async getDataBundles(filters) {
        const conditions = [];
        if (filters?.network)
            conditions.push(eq(dataBundles.network, filters.network));
        if (filters?.isActive !== undefined)
            conditions.push(eq(dataBundles.isActive, filters.isActive));
        let query = db.select().from(dataBundles);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        // Order by network, then by data amount in MB (GB converted to MB), then by base price
        const dataAmountInMB = sql `
      CASE 
        WHEN ${dataBundles.dataAmount} LIKE '%GB' THEN CAST(SUBSTRING(${dataBundles.dataAmount} FROM 1 FOR LENGTH(${dataBundles.dataAmount})-2) AS FLOAT) * 1024
        WHEN ${dataBundles.dataAmount} LIKE '%MB' THEN CAST(SUBSTRING(${dataBundles.dataAmount} FROM 1 FOR LENGTH(${dataBundles.dataAmount})-2) AS FLOAT)
        ELSE 0
      END
    `;
        return query.orderBy(dataBundles.network, dataAmountInMB, dataBundles.basePrice);
    }
    async getNetworksWithBasePrices() {
        // Get distinct networks with their minimum base price and a display name
        const result = await db
            .select({
            network: dataBundles.network,
            basePrice: sql `min(${dataBundles.basePrice})`,
            name: sql `CASE 
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
    async createDataBundle(bundle) {
        const [created] = await db.insert(dataBundles).values({
            id: randomUUID(),
            ...bundle,
        }).returning();
        return created;
    }
    async updateDataBundle(id, data) {
        const [bundle] = await db.update(dataBundles).set(data).where(eq(dataBundles.id, id)).returning();
        return bundle;
    }
    async deleteDataBundle(id) {
        const result = await db.delete(dataBundles).where(eq(dataBundles.id, id));
        return true;
    }
    // ============================================
    // RESULT CHECKERS
    // ============================================
    async getResultChecker(id) {
        const [checker] = await db.select().from(resultCheckers).where(eq(resultCheckers.id, id)).limit(1);
        return checker;
    }
    async getAvailableResultChecker(type, year) {
        const [checker] = await db.select().from(resultCheckers)
            .where(and(eq(resultCheckers.type, type), eq(resultCheckers.year, year), eq(resultCheckers.isSold, false)))
            .limit(1);
        return checker;
    }
    async getAvailableResultCheckersByQuantity(type, year, quantity) {
        const checkers = await db.select().from(resultCheckers)
            .where(and(eq(resultCheckers.type, type), eq(resultCheckers.year, year), eq(resultCheckers.isSold, false)))
            .limit(quantity);
        return checkers;
    }
    async getResultCheckersByTransaction(transactionId) {
        const checkers = await db.select().from(resultCheckers)
            .where(eq(resultCheckers.transactionId, transactionId));
        return checkers;
    }
    async getResultCheckerStock(type, year) {
        const result = await db.select({ count: count() })
            .from(resultCheckers)
            .where(and(eq(resultCheckers.type, type), eq(resultCheckers.year, year), eq(resultCheckers.isSold, false)));
        return Number(result[0]?.count || 0);
    }
    async getResultCheckers(filters) {
        const conditions = [];
        if (filters?.type)
            conditions.push(eq(resultCheckers.type, filters.type));
        if (filters?.year)
            conditions.push(eq(resultCheckers.year, filters.year));
        if (filters?.isSold !== undefined)
            conditions.push(eq(resultCheckers.isSold, filters.isSold));
        let query = db.select().from(resultCheckers);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        return query.orderBy(desc(resultCheckers.createdAt));
    }
    async createResultChecker(checker) {
        const [created] = await db.insert(resultCheckers).values({
            ...checker,
        }).returning();
        return created;
    }
    async createResultCheckersBulk(checkers) {
        if (checkers.length === 0)
            return [];
        const checkersWithIds = checkers.map(checker => ({
            ...checker
        }));
        return db.insert(resultCheckers).values(checkersWithIds).returning();
    }
    async markResultCheckerSold(id, transactionId, phone) {
        const [checker] = await db.update(resultCheckers).set({
            isSold: true,
            soldAt: new Date(),
            soldToPhone: phone,
            transactionId,
        }).where(eq(resultCheckers.id, id)).returning();
        return checker;
    }
    async updateResultChecker(id, data) {
        const [checker] = await db.update(resultCheckers).set(data).where(eq(resultCheckers.id, id)).returning();
        return checker;
    }
    async deleteResultChecker(id) {
        const result = await db.delete(resultCheckers).where(eq(resultCheckers.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    async getResultCheckerSummary() {
        const result = await db.select({
            type: resultCheckers.type,
            year: resultCheckers.year,
            total: count(),
            available: sql `count(case when ${resultCheckers.isSold} = false then 1 end)`,
            sold: sql `count(case when ${resultCheckers.isSold} = true then 1 end)`,
        })
            .from(resultCheckers)
            .groupBy(resultCheckers.type, resultCheckers.year)
            .orderBy(resultCheckers.type, resultCheckers.year);
        return result;
    }
    // ============================================
    // TRANSACTIONS
    // ============================================
    async getTransaction(id) {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
        return transaction;
    }
    async getTransactionByReference(reference) {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.reference, reference)).limit(1);
        return transaction;
    }
    async getTransactionByBeneficiaryPhone(phone) {
        // First try exact match on customerPhone
        let [transaction] = await db.select().from(transactions).where(eq(transactions.customerPhone, phone)).orderBy(desc(transactions.createdAt)).limit(1);
        // If not found, search in phoneNumbers array for bulk orders
        if (!transaction) {
            const allTransactions = await db.select().from(transactions).where(sql `${transactions.phoneNumbers} LIKE ${'%' + phone + '%'}`).orderBy(desc(transactions.createdAt)).limit(1);
            transaction = allTransactions[0];
        }
        return transaction;
    }
    async getLatestDataBundleTransactionByPhone(phone) {
        const normalized = normalizePhoneNumber(phone);
        console.log(`[Cooldown Query] Looking for paid data bundle transactions for phone: ${normalized}`);
        let [transaction] = await db.select()
            .from(transactions)
            .where(and(eq(transactions.type, ProductType.DATA_BUNDLE), eq(transactions.customerPhone, normalized), eq(transactions.paymentStatus, "paid")))
            .orderBy(desc(transactions.createdAt))
            .limit(1);
        if (transaction) {
            console.log(`[Cooldown Query] Found paid transaction: ${transaction.reference} (paymentStatus: ${transaction.paymentStatus}, createdAt: ${transaction.createdAt})`);
            return transaction;
        }
        console.log(`[Cooldown Query] No direct phone match, checking bulk orders...`);
        const likePattern = `%${normalized}%`;
        const matches = await db.select()
            .from(transactions)
            .where(and(eq(transactions.type, ProductType.DATA_BUNDLE), sql `${transactions.phoneNumbers} LIKE ${likePattern}`, eq(transactions.paymentStatus, "paid")))
            .orderBy(desc(transactions.createdAt))
            .limit(1);
        transaction = matches[0];
        if (transaction) {
            console.log(`[Cooldown Query] Found paid bulk transaction: ${transaction.reference} (paymentStatus: ${transaction.paymentStatus})`);
        }
        else {
            console.log(`[Cooldown Query] No paid transactions found for ${normalized}`);
        }
        return transaction;
    }
    async getTransactions(filters) {
        const conditions = [];
        if (filters?.customerEmail)
            conditions.push(eq(transactions.customerEmail, filters.customerEmail));
        if (filters?.agentId)
            conditions.push(eq(transactions.agentId, filters.agentId));
        if (filters?.status)
            conditions.push(eq(transactions.status, filters.status));
        if (filters?.type)
            conditions.push(eq(transactions.type, filters.type));
        let query = db.select().from(transactions);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        query = query.orderBy(desc(transactions.createdAt));
        if (filters?.limit)
            query = query.limit(filters.limit);
        if (filters?.offset)
            query = query.offset(filters.offset);
        return query;
    }
    async getTransactionsForExport(paymentStatusFilter) {
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
        }
        else {
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
    async createTransaction(transaction) {
        const [created] = await db.insert(transactions).values({
            id: randomUUID(),
            ...transaction,
        }).returning();
        return created;
    }
    async updateTransaction(id, data) {
        const [transaction] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
        return transaction;
    }
    async updateTransactionDeliveryStatus(id, deliveryStatus) {
        const [transaction] = await db.update(transactions).set({ deliveryStatus }).where(eq(transactions.id, id)).returning();
        return transaction;
    }
    async getTransactionStats(agentId) {
        const conditions = agentId ? [eq(transactions.agentId, agentId)] : [];
        const totalSql = sql `count(*)`;
        const completedSql = sql `sum(case when status = 'completed' then 1 else 0 end)`;
        const pendingSql = sql `sum(case when status = 'pending' then 1 else 0 end)`;
        const revenueSql = sql `coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`;
        const profitSql = sql `coalesce(sum(case when status = 'completed' then cast(agent_profit as numeric) else 0 end), 0)`;
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
    async getWithdrawal(id) {
        const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id)).limit(1);
        return withdrawal;
    }
    async getWithdrawals(filters) {
        const conditions = [];
        if (filters?.userId)
            conditions.push(eq(withdrawals.userId, filters.userId));
        if (filters?.status)
            conditions.push(eq(withdrawals.status, filters.status));
        let query = db.select().from(withdrawals);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        return query.orderBy(desc(withdrawals.createdAt));
    }
    async createWithdrawal(withdrawal) {
        const [created] = await db.insert(withdrawals).values({
            ...withdrawal,
        }).returning();
        return created;
    }
    async updateWithdrawal(id, data) {
        const [withdrawal] = await db.update(withdrawals).set(data).where(eq(withdrawals.id, id)).returning();
        return withdrawal;
    }
    // ============================================
    // PROFIT WALLETS
    // ============================================
    async getProfitWallet(userId) {
        const [wallet] = await db.select().from(profitWallets).where(eq(profitWallets.userId, userId)).limit(1);
        return wallet;
    }
    async createProfitWallet(wallet) {
        const [created] = await db.insert(profitWallets).values({
            ...wallet,
        }).returning();
        return created;
    }
    async updateProfitWallet(userId, data) {
        const [wallet] = await db.update(profitWallets).set({ ...data, updatedAt: new Date() }).where(eq(profitWallets.userId, userId)).returning();
        return wallet;
    }
    async addProfit(userId, amount, orderId, productId, sellingPrice, basePrice) {
        // Start transaction for atomicity
        await db.transaction(async (tx) => {
            // Get or create profit wallet
            let wallet = await tx.select().from(profitWallets).where(eq(profitWallets.userId, userId)).limit(1).then((rows) => rows[0]);
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
    async getProfitTransactions(userId, filters) {
        const conditions = [eq(profitTransactions.userId, userId)];
        if (filters?.status)
            conditions.push(eq(profitTransactions.status, filters.status));
        let query = db.select().from(profitTransactions).where(and(...conditions));
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }
        return query.orderBy(desc(profitTransactions.createdAt));
    }
    async createProfitTransaction(transaction) {
        const [created] = await db.insert(profitTransactions).values({
            ...transaction,
        }).returning();
        return created;
    }
    async updateProfitTransactionStatus(id, status) {
        const [transaction] = await db.update(profitTransactions).set({ status }).where(eq(profitTransactions.id, id)).returning();
        return transaction;
    }
    // ============================================
    // SMS LOGS
    // ============================================
    async createSmsLog(log) {
        const [created] = await db.insert(smsLogs).values({
            ...log,
        }).returning();
        return created;
    }
    async updateSmsLog(id, data) {
        const [log] = await db.update(smsLogs).set(data).where(eq(smsLogs.id, id)).returning();
        return log;
    }
    async getPendingSmsLogs() {
        return db.select().from(smsLogs)
            .where(or(eq(smsLogs.status, "pending"), eq(smsLogs.status, "retrying")))
            .orderBy(smsLogs.createdAt);
    }
    // ============================================
    // AUDIT LOGS
    // ============================================
    async createAuditLog(log) {
        const [created] = await db.insert(auditLogs).values({
            ...log,
        }).returning();
        return created;
    }
    // ============================================
    // BREAK SETTINGS
    // ============================================
    async getBreakSettings() {
        const isEnabledStr = await this.getSetting("break_mode_enabled");
        const message = await this.getSetting("break_mode_message") || "";
        return {
            isEnabled: isEnabledStr === "true",
            message,
        };
    }
    async updateBreakSettings(settings) {
        await this.setSetting("break_mode_enabled", settings.isEnabled.toString(), "Site break mode enabled/disabled");
        await this.setSetting("break_mode_message", settings.message, "Site break mode message");
        return settings;
    }
    // ============================================
    // ADMIN STATS
    // ============================================
    async getAdminStats() {
        const [txStats] = await db.select({
            totalTransactions: sql `count(*)`,
            totalRevenue: sql `coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`,
            totalProfit: sql `coalesce(sum(case when status = 'completed' then cast(profit as numeric) else 0 end), 0)`,
        }).from(transactions);
        // Get agent activation revenue
        const [activationStats] = await db.select({
            revenue: sql `coalesce(sum(case when status = 'completed' and type = 'agent_activation' then cast(amount as numeric) else 0 end), 0)`,
        }).from(transactions);
        const [withdrawalStats] = await db.select({
            pending: sql `count(*)`,
        }).from(withdrawals).where(eq(withdrawals.status, "pending"));
        const [agentStats] = await db.select({
            total: sql `count(*)`,
        }).from(agents);
        const [pendingAgentStats] = await db.select({
            pending: sql `count(*)`,
        }).from(agents).where(eq(agents.paymentPending, true));
        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [todayStats] = await db.select({
            revenue: sql `coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`,
            transactions: sql `count(*)`,
        }).from(transactions).where(and(gte(transactions.createdAt, today), lt(transactions.createdAt, tomorrow)));
        const [bundleStats] = await db.select({
            count: sql `count(*)`,
        }).from(dataBundles).where(eq(dataBundles.isActive, true));
        const [checkerStats] = await db.select({
            count: sql `count(*)`,
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
    async getRevenueAnalytics(days = 7) {
        const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - (safeDays - 1));
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        // Pre-seed map so the frontend always receives a contiguous date range
        const dailyTotals = new Map();
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
            .where(and(gte(transactions.createdAt, startDate), lte(transactions.createdAt, endDate)));
        for (const row of rows) {
            if (!row.createdAt)
                continue;
            const dateKey = new Date(row.createdAt).toISOString().slice(0, 10);
            const totals = dailyTotals.get(dateKey);
            if (!totals)
                continue;
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
    async createSupportChat(userId, userEmail, userName) {
        const [chat] = await db.insert(supportChats).values({
            userId,
            userEmail,
            userName,
            status: 'open',
            lastMessageAt: new Date(),
        }).returning();
        return chat.id;
    }
    async getUserSupportChats(userId) {
        return await db.select()
            .from(supportChats)
            .where(eq(supportChats.userId, userId))
            .orderBy(desc(supportChats.lastMessageAt));
    }
    async getAllSupportChats(status) {
        if (status) {
            return await db.select()
                .from(supportChats)
                .where(eq(supportChats.status, status))
                .orderBy(desc(supportChats.lastMessageAt));
        }
        return await db.select()
            .from(supportChats)
            .orderBy(desc(supportChats.lastMessageAt));
    }
    async getSupportChatById(chatId) {
        const [chat] = await db.select()
            .from(supportChats)
            .where(eq(supportChats.id, chatId));
        return chat;
    }
    async closeSupportChat(chatId) {
        await db.update(supportChats)
            .set({ status: 'closed', closedAt: new Date() })
            .where(eq(supportChats.id, chatId));
    }
    async assignChatToAdmin(chatId, adminId) {
        await db.update(supportChats)
            .set({ assignedToAdminId: adminId })
            .where(eq(supportChats.id, chatId));
    }
    async createChatMessage(chatId, senderId, senderType, message) {
        const [msg] = await db.insert(chatMessages).values({
            chatId,
            senderId,
            senderType: senderType,
            message,
            isRead: false,
        }).returning();
        // Update last message timestamp on chat
        await db.update(supportChats)
            .set({ lastMessageAt: new Date() })
            .where(eq(supportChats.id, chatId));
        return msg.id;
    }
    async getChatMessages(chatId) {
        return await db.select()
            .from(chatMessages)
            .where(eq(chatMessages.chatId, chatId))
            .orderBy(chatMessages.createdAt);
    }
    async markMessageAsRead(messageId) {
        await db.update(chatMessages)
            .set({ isRead: true })
            .where(eq(chatMessages.id, messageId));
    }
    async getUnreadUserMessagesCount(userId) {
        // Get all chats for this user
        const userChats = await db.select({ id: supportChats.id })
            .from(supportChats)
            .where(eq(supportChats.userId, userId));
        if (userChats.length === 0)
            return 0;
        const chatIds = userChats.map((chat) => chat.id);
        // Count unread messages from admin in user's chats
        const result = await db.select({ count: count() })
            .from(chatMessages)
            .where(and(chatIds.length > 0 ? inArray(chatMessages.chatId, chatIds) : eq(chatMessages.chatId, ''), eq(chatMessages.senderType, 'admin'), eq(chatMessages.isRead, false)));
        return Number(result[0]?.count || 0);
    }
    async getUnreadAdminMessagesCount() {
        // Count all unread messages from users across all chats
        const result = await db.select({ count: sql `count(*)` })
            .from(chatMessages)
            .where(and(eq(chatMessages.senderType, 'user'), eq(chatMessages.isRead, false)));
        return Number(result[0]?.count || 0);
    }
    // Agent Pricing Methods
    // Custom Pricing (Unified for all roles)
    async getCustomPricing(roleOwnerId, role) {
        try {
            const pricing = await db.select({
                productId: customPricing.productId,
                sellingPrice: customPricing.sellingPrice,
            })
                .from(customPricing)
                .where(and(eq(customPricing.roleOwnerId, roleOwnerId), eq(customPricing.role, role)));
            return pricing.map((p) => ({
                productId: p.productId,
                sellingPrice: p.sellingPrice || "0",
            }));
        }
        catch (error) {
            console.warn("Custom pricing table not available:", error);
            return [];
        }
    }
    async setCustomPricing(productId, roleOwnerId, role, sellingPrice) {
        const priceNum = parseFloat(sellingPrice);
        if (isNaN(priceNum) || priceNum < 0) {
            throw new Error('Invalid selling price');
        }
        try {
            // Check if pricing exists
            const [existing] = await db.select()
                .from(customPricing)
                .where(and(eq(customPricing.productId, productId), eq(customPricing.roleOwnerId, roleOwnerId), eq(customPricing.role, role)))
                .limit(1);
            if (existing) {
                // Update existing
                await db.update(customPricing)
                    .set({
                    sellingPrice: sellingPrice,
                    updatedAt: new Date()
                })
                    .where(and(eq(customPricing.productId, productId), eq(customPricing.roleOwnerId, roleOwnerId), eq(customPricing.role, role)));
            }
            else {
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
        }
        catch (error) {
            console.error("Custom pricing update error:", error);
            throw new Error("Failed to update custom pricing");
        }
    }
    async deleteCustomPricing(productId, roleOwnerId, role) {
        try {
            await db.delete(customPricing)
                .where(and(eq(customPricing.productId, productId), eq(customPricing.roleOwnerId, roleOwnerId), eq(customPricing.role, role)));
        }
        catch (error) {
            console.error("Custom pricing delete error:", error);
            throw new Error("Failed to delete custom pricing");
        }
    }
    async getCustomPrice(productId, roleOwnerId, role) {
        try {
            const [result] = await db.select({
                sellingPrice: customPricing.sellingPrice,
            })
                .from(customPricing)
                .where(and(eq(customPricing.productId, productId), eq(customPricing.roleOwnerId, roleOwnerId), eq(customPricing.role, role)))
                .limit(1);
            return result?.sellingPrice || null;
        }
        catch (error) {
            console.warn("Custom pricing lookup error:", error);
            return null;
        }
    }
    // Admin Base Prices
    async getAdminBasePrice(productId) {
        try {
            const [result] = await db.select({
                basePrice: adminBasePrices.basePrice,
            })
                .from(adminBasePrices)
                .where(eq(adminBasePrices.productId, productId))
                .limit(1);
            return result?.basePrice || null;
        }
        catch (error) {
            console.warn("Admin base price lookup error:", error);
            return null;
        }
    }
    async setAdminBasePrice(productId, basePrice) {
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
            }
            else {
                // Insert new
                await db.insert(adminBasePrices).values({
                    productId,
                    basePrice: basePrice,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
        catch (error) {
            console.error("Admin base price update error:", error);
            throw new Error("Failed to update admin base price");
        }
    }
    // Price Resolution (combines custom + admin base price)
    async getResolvedPrice(productId, roleOwnerId, role) {
        // First check for custom selling price
        const customPrice = await this.getCustomPrice(productId, roleOwnerId, role);
        if (customPrice) {
            return customPrice;
        }
        // Fall back to role base price
        return await this.getRoleBasePrice(productId, role);
    }
    async getRoleBasePrices() {
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
            const prices = [];
            bundles.forEach((bundle) => {
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
        }
        catch (error) {
            console.warn("Error fetching role base prices from data bundles:", error);
            return [];
        }
    }
    async setRoleBasePrice(bundleId, role, basePrice, userRole) {
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
        }
        catch (error) {
            console.warn("Error updating role base price in data bundles:", error);
            throw error;
        }
    }
    async getRoleBasePrice(bundleId, role) {
        try {
            // First check if admin has set a role-specific base price
            const [rolePrice] = await db.select({
                basePrice: roleBasePrices.basePrice,
            })
                .from(roleBasePrices)
                .where(and(eq(roleBasePrices.bundleId, bundleId), eq(roleBasePrices.role, role)))
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
        }
        catch (error) {
            console.warn("Error fetching role base price:", error);
            return null;
        }
    }
    // Rankings Methods
    async getTopCustomers(limit = 10) {
        try {
            // First, get all customer emails from completed transactions
            const allCustomerEmails = await db.select({
                email: transactions.customerEmail,
            })
                .from(transactions)
                .where(and(eq(transactions.status, 'completed'), isNotNull(transactions.customerEmail), ne(transactions.customerEmail, '')))
                .groupBy(transactions.customerEmail);
            const emailList = allCustomerEmails.map((row) => row.email).filter(Boolean);
            // Filter out agent emails by checking user roles
            let filteredEmails = [];
            if (emailList.length > 0) {
                const userRoles = await db.select({
                    email: users.email,
                    role: users.role,
                })
                    .from(users)
                    .where(inArray(users.email, emailList));
                // Include emails that are either not in users table (guests) or have user/guest role
                const agentEmails = new Set(userRoles
                    .filter((user) => user.role && !['user', 'guest'].includes(user.role))
                    .map((user) => user.email));
                filteredEmails = emailList.filter((email) => !agentEmails.has(email));
            }
            // Now get stats only for filtered customers
            let customerStats = [];
            if (filteredEmails.length > 0) {
                customerStats = await db.select({
                    customerEmail: transactions.customerEmail,
                    customerPhone: max(transactions.customerPhone),
                    totalPurchases: count(),
                    totalSpent: sql `coalesce(sum(cast(${transactions.amount} as numeric)), 0)`,
                    lastPurchase: max(transactions.createdAt),
                })
                    .from(transactions)
                    .where(and(eq(transactions.status, 'completed'), inArray(transactions.customerEmail, filteredEmails)))
                    .groupBy(transactions.customerEmail);
            }
            // Get user names for the customers
            const customerEmails = customerStats.map((stat) => stat.customerEmail).filter(Boolean);
            let userRecords = [];
            if (customerEmails.length > 0) {
                userRecords = await db.select({
                    email: users.email,
                    name: users.name,
                })
                    .from(users)
                    .where(inArray(users.email, customerEmails));
            }
            const userMap = new Map(userRecords.map((user) => [user.email, user.name]));
            // Sort and assign ranks
            const sortedCustomers = customerStats
                .map((stat) => ({
                customerEmail: stat.customerEmail,
                customerPhone: stat.customerPhone || null,
                customerName: userMap.get(stat.customerEmail) || null,
                totalPurchases: Number(stat.totalPurchases) || 0,
                totalSpent: Number(stat.totalSpent) || 0,
                lastPurchase: stat.lastPurchase,
            }))
                .sort((a, b) => {
                // Primary sort: total spent descending
                if (b.totalSpent !== a.totalSpent) {
                    return b.totalSpent - a.totalSpent;
                }
                // Secondary sort: total purchases descending (tie-breaker)
                return b.totalPurchases - a.totalPurchases;
            })
                .slice(0, limit)
                .map((customer, index) => ({
                ...customer,
                rank: index + 1,
                lastPurchase: customer.lastPurchase ? customer.lastPurchase.toISOString() : new Date().toISOString(),
            }));
            return sortedCustomers;
        }
        catch (error) {
            console.error('Error in getTopCustomers:', error);
            throw error;
        }
    }
    // ============================================
    // ANNOUNCEMENTS
    // ============================================
    async getAnnouncements() {
        return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
    }
    async getActiveAnnouncements() {
        return await db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt));
    }
    async createAnnouncement(announcement) {
        const result = await db.insert(announcements).values({
            ...announcement,
        }).returning();
        return result[0];
    }
    async updateAnnouncement(id, data) {
        const result = await db.update(announcements)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(announcements.id, id))
            .returning();
        return result[0];
    }
    async deleteAnnouncement(id) {
        const result = await db.delete(announcements).where(eq(announcements.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // ============================================
    // VIDEO GUIDES
    // ============================================
    async getVideoGuides(filters) {
        let query = db.select().from(videoGuides);
        const conditions = [];
        if (filters?.category)
            conditions.push(eq(videoGuides.category, filters.category));
        if (filters?.publishedOnly)
            conditions.push(eq(videoGuides.isPublished, true));
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        return query.orderBy(desc(videoGuides.createdAt));
    }
    async getVideoGuide(id) {
        const result = await db.select().from(videoGuides).where(eq(videoGuides.id, id)).limit(1);
        return result[0];
    }
    async createVideoGuide(guide) {
        const [created] = await db.insert(videoGuides).values({
            id: randomUUID(),
            ...guide,
        }).returning();
        return created;
    }
    async updateVideoGuide(id, data) {
        const [updated] = await db.update(videoGuides)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(videoGuides.id, id))
            .returning();
        return updated;
    }
    async deleteVideoGuide(id) {
        const result = await db.delete(videoGuides).where(eq(videoGuides.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // ============================================
    // API KEYS
    // ============================================
    async getApiKeys(userId) {
        return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
    }
    async getApiKeyByKey(key) {
        const result = await db.select().from(apiKeys).where(eq(apiKeys.key, key)).limit(1);
        return result[0];
    }
    async createApiKey(apiKey) {
        const result = await db.insert(apiKeys).values({
            ...apiKey,
        }).returning();
        return result[0];
    }
    async updateApiKey(id, data) {
        const result = await db.update(apiKeys).set(data).where(eq(apiKeys.id, id)).returning();
        return result[0];
    }
    async deleteApiKey(id) {
        const result = await db.delete(apiKeys).where(eq(apiKeys.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // ============================================
    // SETTINGS
    // ============================================
    async getSetting(key) {
        const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
        return result[0]?.value;
    }
    async setSetting(key, value, description) {
        const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
        if (existing[0]) {
            await db.update(settings)
                .set({ value, description, updatedAt: new Date() })
                .where(eq(settings.key, key));
        }
        else {
            await db.insert(settings).values({ key, value, description });
        }
    }
    async getAllSettings() {
        const result = await db.select().from(settings);
        return result.map(setting => ({
            key: setting.key,
            value: setting.value,
            description: setting.description || undefined,
        }));
    }
    // ============================================
    // EXTERNAL API PROVIDERS
    // ============================================
    async getExternalApiProviders() {
        return await db.select().from(externalApiProviders).orderBy(desc(externalApiProviders.createdAt));
    }
    async getExternalApiProvider(id) {
        const result = await db.select().from(externalApiProviders).where(eq(externalApiProviders.id, id)).limit(1);
        return result[0];
    }
    async getActiveExternalApiProviders() {
        return await db.select().from(externalApiProviders).where(eq(externalApiProviders.isActive, true));
    }
    async getDefaultExternalApiProvider() {
        const result = await db.select().from(externalApiProviders)
            .where(eq(externalApiProviders.isDefault, true))
            .limit(1);
        return result[0];
    }
    async getProviderForNetwork(network) {
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
                }
                catch (e) {
                    // Continue to next provider if JSON parsing fails
                    continue;
                }
            }
        }
        // If no provider supports the network specifically, use default
        return await this.getDefaultExternalApiProvider();
    }
    async createExternalApiProvider(provider) {
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
    async updateExternalApiProvider(id, data) {
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
    async deleteExternalApiProvider(id) {
        const result = await db.delete(externalApiProviders).where(eq(externalApiProviders.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    async setDefaultExternalApiProvider(id) {
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
    async createWalletTopupTransaction(topup) {
        const [created] = await db.insert(walletTopupTransactions).values({
            id: randomUUID(),
            ...topup,
        }).returning();
        return created;
    }
    async getWalletTopupTransactions(filters) {
        const conditions = [];
        if (filters?.userId)
            conditions.push(eq(walletTopupTransactions.userId, filters.userId));
        if (filters?.adminId)
            conditions.push(eq(walletTopupTransactions.adminId, filters.adminId));
        let query = db.select().from(walletTopupTransactions);
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        return query.orderBy(desc(walletTopupTransactions.createdAt));
    }
    // ============================================
    // CRON JOB HELPERS
    // ============================================
    async getTransactionsByStatusAndDelivery(status, deliveryStatus) {
        return db.select()
            .from(transactions)
            .where(and(eq(transactions.status, status), eq(transactions.deliveryStatus, deliveryStatus), eq(transactions.type, 'data_bundle') // Only data bundle transactions
        ))
            .orderBy(desc(transactions.createdAt));
    }
    async getFailedTransactionsOlderThan(cutoffDate) {
        return db.select()
            .from(transactions)
            .where(and(eq(transactions.deliveryStatus, 'failed'), eq(transactions.type, 'data_bundle'), lt(transactions.createdAt, cutoffDate)))
            .orderBy(desc(transactions.createdAt));
    }
}
export const storage = new DatabaseStorage();
