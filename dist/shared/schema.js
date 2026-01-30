import { pgTable, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";
// User roles enum
export const UserRole = {
    ADMIN: "admin",
    AGENT: "agent",
    DEALER: "dealer",
    SUPER_DEALER: "super_dealer",
    MASTER: "master",
    USER: "user",
    GUEST: "guest",
};
// Transaction status enum
export const TransactionStatus = {
    PENDING: "pending",
    PROCESSING: "processing",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    FAILED: "failed",
    REFUNDED: "refunded",
};
// Delivery status enum
export const DeliveryStatus = {
    PENDING: "pending",
    PROCESSING: "processing",
    DELIVERED: "delivered",
    FAILED: "failed",
};
// Payment status enum
export const PaymentStatus = {
    PENDING: "pending",
    PAID: "paid",
    FAILED: "failed",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
};
// Product type enum
export const ProductType = {
    DATA_BUNDLE: "data_bundle",
    RESULT_CHECKER: "result_checker",
    AGENT_ACTIVATION: "agent_activation",
};
// Network provider enum
export const NetworkProvider = {
    MTN: "mtn",
    TELECEL: "telecel",
    AT_BIGTIME: "at_bigtime",
    AT_ISHARE: "at_ishare",
};
// Result checker type enum
export const ResultCheckerType = {
    BECE: "bece",
    WASSCE: "wassce",
};
// Withdrawal status enum
export const WithdrawalStatus = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    PAID: "paid",
};
// Payment method enum for withdrawals
export const PaymentMethod = {
    BANK: "bank",
    MTN_MOMO: "mtn_momo",
    TELECEL_CASH: "telecel_cash",
    AIRTEL_TIGO_CASH: "airtel_tigo_cash",
    AT_BIGTIME: "at_bigtime",
    AT_ISHARE: "at_ishare",
    VODAFONE_CASH: "vodafone_cash",
};
// Chat status enum
export const ChatStatus = {
    OPEN: "open",
    CLOSED: "closed",
};
// Chat sender type enum
export const ChatSenderType = {
    USER: "user",
    ADMIN: "admin",
};
// SMS status enum
export const SmsStatus = {
    PENDING: "pending",
    SENT: "sent",
    FAILED: "failed",
    RETRYING: "retrying",
};
// ============================================
// USERS TABLE
// ============================================
export const users = pgTable("users", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    role: text("role").notNull().default("agent"),
    walletBalance: text("wallet_balance").notNull().default("0.00"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    roleIdx: index("users_role_idx").on(table.role),
}));
// ============================================
// AGENTS TABLE
// ============================================
export const agents = pgTable("agents", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    storefrontSlug: text("storefront_slug").notNull().unique(),
    businessName: text("business_name").notNull(),
    businessDescription: text("business_description"),
    customPricingMarkup: text("custom_pricing_markup").notNull().default("0.00"),
    balance: text("balance").notNull().default("0.00"),
    totalSales: text("total_sales").notNull().default("0.00"),
    totalProfit: text("total_profit").notNull().default("0.00"),
    isApproved: boolean("is_approved").notNull().default(false),
    paymentPending: boolean("payment_pending").notNull().default(true),
    activationFee: text("activation_fee").default("60.00"),
    whatsappSupportLink: text("whatsapp_support_link"),
    whatsappChannelLink: text("whatsapp_channel_link"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdIdx: index("agents_user_id_idx").on(table.userId),
    slugIdx: index("agents_slug_idx").on(table.storefrontSlug),
}));
// ============================================
// DATA BUNDLES TABLE
// ============================================
export const dataBundles = pgTable("data_bundles", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    network: text("network").notNull(),
    dataAmount: text("data_amount").notNull(),
    validity: text("validity").notNull(),
    basePrice: text("base_price").notNull(),
    agentPrice: text("agent_price"),
    dealerPrice: text("dealer_price"),
    superDealerPrice: text("super_dealer_price"),
    masterPrice: text("master_price"),
    adminPrice: text("admin_price"),
    isActive: boolean("is_active").notNull().default(true),
    apiCode: text("api_code"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    networkIdx: index("data_bundles_network_idx").on(table.network),
    activeIdx: index("data_bundles_active_idx").on(table.isActive),
}));
// ============================================
// RESULT CHECKERS TABLE (Stock-based)
// ============================================
export const resultCheckers = pgTable("result_checkers", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    type: text("type").notNull(),
    year: integer("year").notNull(),
    serialNumber: text("serial_number").notNull().unique(),
    pin: text("pin").notNull(),
    basePrice: text("base_price").notNull(),
    isSold: boolean("is_sold").notNull().default(false),
    soldAt: timestamp("sold_at"),
    soldToPhone: text("sold_to_phone"),
    transactionId: text("transaction_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    typeIdx: index("result_checkers_type_idx").on(table.type),
    soldIdx: index("result_checkers_sold_idx").on(table.isSold),
    yearIdx: index("result_checkers_year_idx").on(table.year),
}));
// ============================================
// TRANSACTIONS TABLE
// ============================================
export const transactions = pgTable("transactions", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    reference: text("reference").notNull().unique(),
    type: text("type").notNull(),
    productId: text("product_id"),
    productName: text("product_name").notNull(),
    network: text("network"),
    amount: text("amount").notNull(),
    profit: text("profit").notNull(),
    customerPhone: text("customer_phone"),
    customerEmail: text("customer_email"),
    phoneNumbers: text("phone_numbers"), // Array of phone numbers for bulk orders
    isBulkOrder: boolean("is_bulk_order").default(false),
    paymentMethod: text("payment_method").notNull().default("paystack"), // "paystack" or "wallet"
    status: text("status").notNull().default("processing"),
    deliveryStatus: text("delivery_status").notNull().default("processing"),
    paymentReference: text("payment_reference"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    agentId: text("agent_id"),
    agentProfit: text("agent_profit").default("0.00"),
    providerId: text("provider_id"), // External API provider used for this transaction
    webhookUrl: text("webhook_url"), // Optional webhook URL for status notifications
    apiResponse: text("api_response"),
    deliveredPin: text("delivered_pin"),
    deliveredSerial: text("delivered_serial"),
    smsStatus: text("sms_status"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
}, (table) => ({
    referenceIdx: index("transactions_reference_idx").on(table.reference),
    statusIdx: index("transactions_status_idx").on(table.status),
    agentIdx: index("transactions_agent_idx").on(table.agentId),
    typeIdx: index("transactions_type_idx").on(table.type),
    createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
}));
// ============================================
// WITHDRAWALS TABLE (UPDATED FOR ALL ROLES)
// ============================================
export const withdrawals = pgTable("withdrawals", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: text("amount").notNull(),
    status: text("status").notNull().default("pending"), // "pending" | "approved" | "rejected" | "paid"
    paymentMethod: text("payment_method").notNull().default("bank"),
    bankName: text("bank_name"),
    bankCode: text("bank_code"),
    accountNumber: text("account_number").notNull(),
    accountName: text("account_name").notNull(),
    adminNote: text("admin_note"),
    rejectionReason: text("rejection_reason"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("withdrawals_user_idx").on(table.userId),
    statusIdx: index("withdrawals_status_idx").on(table.status),
}));
// ============================================
// SMS LOGS TABLE
// ============================================
export const smsLogs = pgTable("sms_logs", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    transactionId: text("transaction_id").notNull(),
    phone: text("phone").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("pending"),
    provider: text("provider"),
    providerMessageId: text("provider_message_id"),
    retryCount: integer("retry_count").notNull().default(0),
    lastRetryAt: timestamp("last_retry_at"),
    sentAt: timestamp("sent_at"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    transactionIdx: index("sms_logs_transaction_idx").on(table.transactionId),
    statusIdx: index("sms_logs_status_idx").on(table.status),
}));
// ============================================
// AUDIT LOGS TABLE
// ============================================
export const auditLogs = pgTable("audit_logs", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("audit_logs_user_idx").on(table.userId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));
// ============================================
// CUSTOM PRICING TABLE (Unified for all roles)
// ============================================
export const customPricing = pgTable("custom_pricing", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    productId: text("product_id").notNull(), // Can reference dataBundles or resultCheckers
    roleOwnerId: text("role_owner_id").notNull(), // Agent ID, Dealer User ID, etc.
    role: text("role").notNull(), // agent, dealer, super_dealer, master
    sellingPrice: text("selling_price").notNull(), // Final selling price
    profit: text("profit"), // Agent-defined profit margin
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    productIdx: index("custom_pricing_product_idx").on(table.productId),
    roleOwnerIdx: index("custom_pricing_role_owner_idx").on(table.roleOwnerId),
    roleIdx: index("custom_pricing_role_idx").on(table.role),
    uniqueProductRoleOwner: index("custom_pricing_unique").on(table.productId, table.roleOwnerId, table.role),
}));
// ============================================
// ADMIN BASE PRICES TABLE
// ============================================
export const adminBasePrices = pgTable("admin_base_prices", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    productId: text("product_id").notNull(), // Can reference dataBundles or resultCheckers
    basePrice: text("base_price").notNull(), // Admin-set base price
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    productIdx: index("admin_base_prices_product_idx").on(table.productId),
    uniqueProduct: index("admin_base_prices_unique").on(table.productId),
}));
// ============================================
// ROLE BASE PRICES TABLE
// ============================================
export const roleBasePrices = pgTable("role_base_prices", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    bundleId: text("bundle_id").notNull().references(() => dataBundles.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // admin, agent, dealer, super_dealer, master
    basePrice: text("base_price").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    bundleIdx: index("role_base_prices_bundle_idx").on(table.bundleId),
    roleIdx: index("role_base_prices_role_idx").on(table.role),
    uniqueBundleRole: index("role_base_prices_unique").on(table.bundleId, table.role),
}));
// ============================================
// SUPPORT CHATS TABLE
// ============================================
export const supportChats = pgTable("support_chats", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull(),
    userEmail: text("user_email").notNull(),
    userName: text("user_name").notNull(),
    status: text("status").notNull().default("open"), // open, closed
    lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
    assignedToAdminId: text("assigned_to_admin_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    closedAt: timestamp("closed_at"),
}, (table) => ({
    userIdx: index("support_chats_user_idx").on(table.userId),
    statusIdx: index("support_chats_status_idx").on(table.status),
    assignedAdminIdx: index("support_chats_assigned_admin_idx").on(table.assignedToAdminId),
}));
// ============================================
// CHAT MESSAGES TABLE
// ============================================
export const chatMessages = pgTable("chat_messages", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    chatId: text("chat_id").notNull(),
    senderId: text("sender_id").notNull(),
    senderType: text("sender_type").notNull(), // user, admin
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    chatIdx: index("chat_messages_chat_idx").on(table.chatId),
    senderIdx: index("chat_messages_sender_idx").on(table.senderId),
}));
// ============================================
// API KEYS TABLE
// ============================================
export const apiKeys = pgTable("api_keys", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    key: text("key").notNull().unique(),
    permissions: text("permissions").notNull().default("{}"),
    isActive: boolean("is_active").notNull().default(true),
    lastUsed: timestamp("last_used"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("api_keys_user_idx").on(table.userId),
    keyIdx: index("api_keys_key_idx").on(table.key),
    activeIdx: index("api_keys_active_idx").on(table.isActive),
}));
// ============================================
// ANNOUNCEMENTS TABLE
// ============================================
export const announcements = pgTable("announcements", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    audiences: text("audiences").notNull().default('["all"]'), // JSON array: 'all', 'guest', 'loggedIn', 'agent', 'storefront'
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    activeIdx: index("announcements_active_idx").on(table.isActive),
    createdAtIdx: index("announcements_created_at_idx").on(table.createdAt),
}));
// ============================================
// WALLET TOP-UP TRANSACTIONS TABLE
// ============================================
export const walletTopupTransactions = pgTable("wallet_topup_transactions", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    adminId: text("admin_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: text("amount").notNull(),
    reason: text("reason"),
    transactionId: text("transaction_id").references(() => transactions.id, { onDelete: 'set null' }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("wallet_topup_transactions_user_idx").on(table.userId),
    adminIdx: index("wallet_topup_transactions_admin_idx").on(table.adminId),
    transactionIdx: index("wallet_topup_transactions_transaction_idx").on(table.transactionId),
}));
// ============================================
// WALLET DEDUCTION TRANSACTIONS TABLE
// ============================================
export const walletDeductionTransactions = pgTable("wallet_deduction_transactions", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    adminId: text("admin_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: text("amount").notNull(),
    reason: text("reason"),
    transactionId: text("transaction_id").references(() => transactions.id, { onDelete: 'set null' }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("wallet_deduction_transactions_user_idx").on(table.userId),
    adminIdx: index("wallet_deduction_transactions_admin_idx").on(table.adminId),
    transactionIdx: index("wallet_deduction_transactions_transaction_idx").on(table.transactionId),
}));
// ============================================
// SETTINGS TABLE
// ============================================
export const settings = pgTable("settings", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    description: text("description"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// ============================================
// VIDEO GUIDES TABLE
// ============================================
export const videoGuides = pgTable("video_guides", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category").notNull(), // guest | customer | agent
    url: text("url").notNull(),
    provider: text("provider"), // youtube | vimeo | mp4 | other
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    categoryIdx: index("video_guides_category_idx").on(table.category),
    publishedIdx: index("video_guides_published_idx").on(table.isPublished),
}));
// ============================================
// EXTERNAL API PROVIDERS TABLE
// ============================================
export const externalApiProviders = pgTable("external_api_providers", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    name: text("name").notNull(),
    provider: text("provider").notNull(), // e.g., "skytech", "another_provider"
    apiKey: text("api_key").notNull(),
    apiSecret: text("api_secret").notNull(),
    endpoint: text("endpoint").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    networkMappings: text("network_mappings"), // JSON string for network mappings
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// ============================================
// PROFIT WALLETS TABLE
// ============================================
export const profitWallets = pgTable("profit_wallets", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    availableBalance: text("available_balance").notNull().default("0.00"),
    pendingBalance: text("pending_balance").notNull().default("0.00"),
    totalEarned: text("total_earned").notNull().default("0.00"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("profit_wallets_user_idx").on(table.userId),
}));
// ============================================
// PROFIT TRANSACTIONS TABLE (LEDGER)
// ============================================
export const profitTransactions = pgTable("profit_transactions", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderId: text("order_id").references(() => transactions.id, { onDelete: 'set null' }),
    productId: text("product_id"),
    sellingPrice: text("selling_price").notNull(),
    basePrice: text("base_price").notNull(),
    profit: text("profit").notNull(),
    status: text("status").notNull().default("pending"), // "pending" | "available"
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
    userIdx: index("profit_transactions_user_idx").on(table.userId),
    orderIdx: index("profit_transactions_order_idx").on(table.orderId),
    statusIdx: index("profit_transactions_status_idx").on(table.status),
}));
// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ one, many }) => ({
    agent: one(agents, {
        fields: [users.id],
        references: [agents.userId],
    }),
    apiKeys: many(apiKeys),
    profitWallet: one(profitWallets, {
        fields: [users.id],
        references: [profitWallets.userId],
    }),
    profitTransactions: many(profitTransactions),
    withdrawals: many(withdrawals),
}));
export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
    user: one(users, {
        fields: [apiKeys.userId],
        references: [users.id],
    }),
}));
export const agentsRelations = relations(agents, ({ one, many }) => ({
    user: one(users, {
        fields: [agents.userId],
        references: [users.id],
    }),
    transactions: many(transactions),
    withdrawals: many(withdrawals),
}));
export const transactionsRelations = relations(transactions, ({ one }) => ({
    agent: one(agents, {
        fields: [transactions.agentId],
        references: [agents.id],
    }),
}));
export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
    user: one(users, {
        fields: [withdrawals.userId],
        references: [users.id],
    }),
}));
export const profitWalletsRelations = relations(profitWallets, ({ one }) => ({
    user: one(users, {
        fields: [profitWallets.userId],
        references: [users.id],
    }),
}));
export const profitTransactionsRelations = relations(profitTransactions, ({ one }) => ({
    user: one(users, {
        fields: [profitTransactions.userId],
        references: [users.id],
    }),
    order: one(transactions, {
        fields: [profitTransactions.orderId],
        references: [transactions.id],
    }),
}));
export const supportChatsRelations = relations(supportChats, ({ many, one }) => ({
    messages: many(chatMessages),
    user: one(users, {
        fields: [supportChats.userId],
        references: [users.id],
    }),
}));
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
    chat: one(supportChats, {
        fields: [chatMessages.chatId],
        references: [supportChats.id],
    }),
}));
// ============================================
// INSERT SCHEMAS
// ============================================
export const insertUserSchema = z.object({
    id: z.string().optional(),
    email: z.string().email(),
    password: z.string(),
    name: z.string(),
    phone: z.string().optional(),
    role: z.enum(["admin", "agent", "dealer", "super_dealer", "master", "user", "guest"]).default("user"),
    walletBalance: z.string().optional(),
    isActive: z.boolean().optional(),
});
export const insertApiKeySchema = z.object({
    userId: z.string(),
    name: z.string(),
    key: z.string(),
    permissions: z.string().optional(),
    isActive: z.boolean().optional(),
});
export const insertAgentSchema = z.object({
    userId: z.string(),
    storefrontSlug: z.string(),
    businessName: z.string(),
    businessDescription: z.string(),
    customPricingMarkup: z.string().optional(),
    isApproved: z.boolean().optional(),
    paymentPending: z.boolean().optional(),
    activationFee: z.string().optional(),
    whatsappSupportLink: z.string().optional(),
    whatsappChannelLink: z.string().optional(),
});
export const insertCustomPricingSchema = z.object({
    productId: z.string(),
    roleOwnerId: z.string(),
    role: z.string(),
    sellingPrice: z.string(),
});
export const insertAdminBasePricesSchema = z.object({
    productId: z.string(),
    basePrice: z.string(),
});
export const insertRoleBasePricesSchema = z.object({
    bundleId: z.string(),
    role: z.string(),
    basePrice: z.string(),
});
export const insertDataBundleSchema = z.object({
    name: z.string(),
    network: z.string(),
    dataAmount: z.string(),
    validity: z.string(),
    basePrice: z.string(),
    agentPrice: z.string().optional(),
    dealerPrice: z.string().optional(),
    superDealerPrice: z.string().optional(),
    masterPrice: z.string().optional(),
    adminPrice: z.string().optional(),
    isActive: z.boolean().optional(),
    apiCode: z.string().optional(),
});
export const insertResultCheckerSchema = z.object({
    type: z.string(),
    year: z.number(),
    serialNumber: z.string(),
    pin: z.string(),
    basePrice: z.string(),
    isSold: z.boolean().optional(),
    soldAt: z.date().optional(),
    soldToPhone: z.string().optional(),
    transactionId: z.string().optional(),
    name: z.string().optional(),
    price: z.string().optional(),
    examType: z.enum(["bece", "wassce"]).optional(),
    indexNumber: z.string().optional(),
    schoolName: z.string().optional(),
    currency: z.string().optional(),
});
export const insertTransactionSchema = z.object({
    reference: z.string(),
    type: z.string(),
    productId: z.string().optional(),
    productName: z.string(),
    network: z.string().optional(),
    amount: z.string(),
    profit: z.string(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().optional(),
    phoneNumbers: z.string().optional(),
    isBulkOrder: z.boolean().optional(),
    paymentMethod: z.string().optional(),
    status: z.string().optional(),
    deliveryStatus: z.string().optional(),
    paymentReference: z.string().optional(),
    paymentStatus: z.string().optional(),
    agentId: z.string().optional(),
    agentProfit: z.string().optional(),
    providerId: z.string().optional(),
    webhookUrl: z.string().optional(), // Webhook URL for status notifications
    apiResponse: z.string().optional(),
    deliveredPin: z.string().optional(),
    deliveredSerial: z.string().optional(),
    smsStatus: z.string().optional(),
    failureReason: z.string().optional(),
    completedAt: z.date().optional(),
});
export const insertWithdrawalSchema = z.object({
    userId: z.string(),
    amount: z.string(),
    status: z.string().optional(),
    paymentMethod: z.string().optional(),
    bankName: z.string().optional(),
    bankCode: z.string().optional(),
    accountNumber: z.string(),
    accountName: z.string(),
    adminNote: z.string().optional(),
    rejectionReason: z.string().optional(),
    approvedBy: z.string().optional(),
    approvedAt: z.date().optional(),
    paidAt: z.date().optional(),
    paymentDetails: z.string().optional(),
    requestedAt: z.date().optional(),
});
export const insertProfitWalletSchema = z.object({
    userId: z.string(),
    availableBalance: z.string().optional(),
    pendingBalance: z.string().optional(),
    totalEarned: z.string().optional(),
    agentId: z.string().optional(),
    balance: z.string().optional(),
    totalSales: z.string().optional(),
    totalProfit: z.string().optional(),
});
export const insertProfitTransactionSchema = z.object({
    userId: z.string(),
    orderId: z.string().optional(),
    productId: z.string().optional(),
    sellingPrice: z.string(),
    basePrice: z.string(),
    profit: z.string(),
    status: z.string().optional(),
    agentId: z.string().optional(),
    type: z.enum(["sale", "refund", "adjustment"]).optional(),
    amount: z.string().optional(),
    description: z.string().optional(),
});
export const insertSmsLogSchema = z.object({
    transactionId: z.string(),
    phone: z.string(),
    message: z.string(),
    status: z.string().optional(),
    provider: z.string().optional(),
    providerMessageId: z.string().optional(),
    retryCount: z.number().optional(),
    lastRetryAt: z.date().optional(),
    sentAt: z.date().optional(),
    errorMessage: z.string().optional(),
});
export const insertAuditLogSchema = z.object({
    userId: z.string().optional(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().optional(),
    oldValue: z.string().optional(),
    newValue: z.string().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
});
export const insertSupportChatSchema = z.object({
    userId: z.string(),
    userEmail: z.string(),
    userName: z.string(),
    status: z.string().optional(),
    lastMessageAt: z.date().optional(),
    assignedToAdminId: z.string().optional(),
    closedAt: z.date().optional(),
});
export const insertChatMessageSchema = z.object({
    chatId: z.string(),
    senderId: z.string(),
    senderType: z.string(),
    message: z.string(),
    isRead: z.boolean().optional(),
});
export const insertAnnouncementSchema = z.object({
    title: z.string(),
    message: z.string(),
    audiences: z.string().optional(), // JSON string of audience array
    isActive: z.boolean().optional(),
    createdBy: z.string(),
    content: z.string().optional(),
    type: z.enum(["info", "warning", "success", "error"]).optional(),
    expiresAt: z.date().optional(),
});
export const insertWalletTopupTransactionSchema = z.object({
    userId: z.string(),
    adminId: z.string(),
    amount: z.string(),
    reason: z.string().optional(),
    transactionId: z.string().optional(),
    method: z.string().optional(),
    status: z.string().optional(),
    reference: z.string().optional(),
    agentId: z.string().optional(),
});
export const insertWalletDeductionTransactionSchema = z.object({
    userId: z.string(),
    adminId: z.string(),
    amount: z.string(),
    reason: z.string().optional(),
    transactionId: z.string().optional(),
});
export const insertSettingsSchema = z.object({
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
});
export const insertVideoGuideSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.enum(["guest", "customer", "agent"]),
    url: z.string(),
    provider: z.enum(["youtube", "vimeo", "mp4", "other"]).optional(),
    isPublished: z.boolean().optional(),
});
export const insertExternalApiProviderSchema = z.object({
    name: z.string(),
    provider: z.string(),
    apiKey: z.string(),
    apiSecret: z.string(),
    endpoint: z.string(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    networkMappings: z.string().optional(),
    type: z.string().optional(),
});
export const updateExternalApiProviderSchema = z.object({
    name: z.string().optional(),
    provider: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    endpoint: z.string().optional(),
    isActive: z.boolean().optional(),
    isDefault: z.boolean().optional(),
    networkMappings: z.string().optional(),
});
// ============================================
// VALIDATION SCHEMAS
// ============================================
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
export const registerSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone must be at least 10 characters"),
});
export const agentRegisterSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Phone must be at least 10 characters"),
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    storefrontSlug: z.string().min(3, "Storefront URL must be at least 3 characters")
        .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
    businessDescription: z.string().min(10, "Business description must be at least 10 characters"),
});
export const purchaseSchema = z.object({
    productId: z.string().optional(), // Optional - can use volume + network instead
    productType: z.enum(["data_bundle", "result_checker"]),
    volume: z.string().optional(), // e.g., "1GB", "2GB", "5GB"
    customerPhone: z.string().optional(),
    customerEmail: z.union([z.string().email(), z.literal("")]).optional(),
    agentSlug: z.union([z.string(), z.null()]).optional(),
    amount: z.string().optional(),
    paymentMethod: z.enum(["paystack", "wallet"]).optional(),
    webhookUrl: z.string().url().optional(), // Optional webhook URL for status notifications
    phoneNumbers: z.array(z.object({
        phone: z.string(),
        bundleName: z.string(),
        dataAmount: z.string(),
    })).optional(),
    isBulkOrder: z.boolean().optional(),
    network: z.string().optional(), // Required when using volume
    orderItems: z.array(z.object({
        phone: z.string(),
        bundleId: z.string(),
        bundleName: z.string(),
        price: z.number(),
    })).optional(),
    totalAmount: z.number().optional(),
    quantity: z.number().optional(),
}).refine((data) => {
    // customerPhone is required for data_bundle, optional for result_checker
    if (data.productType === "data_bundle" && (!data.customerPhone || (typeof data.customerPhone === 'string' && data.customerPhone.length < 10))) {
        return false;
    }
    return true;
}, {
    message: "Phone number is required for data bundle purchases and must be at least 10 digits",
    path: ["customerPhone"],
}).refine((data) => {
    // If orderItems exist, productId is not required
    if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0)
        return true;
    // If volume + network are provided, productId is not required
    if (data.volume && data.network)
        return true;
    // Otherwise, productId is required
    return data.productId !== undefined;
}, {
    message: "Either productId, orderItems, or (volume + network) must be provided",
    path: ["productId"],
});
export const withdrawalRequestSchema = z.object({
    amount: z.number().min(10, "Minimum withdrawal amount is GH₵10").positive("Amount must be positive"),
    paymentMethod: z.enum(["mtn_momo", "telecel_cash", "airtel_tigo_cash", "at_bigtime", "at_ishare", "vodafone_cash"], {
        required_error: "Please select a payment method"
    }),
    bankName: z.string().optional(),
    bankCode: z.string().optional(),
    accountNumber: z.string().min(5, "Account/Phone number is required"),
    accountName: z.string().min(2, "Account name is required"),
});
