var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  ChatSenderType: () => ChatSenderType,
  ChatStatus: () => ChatStatus,
  DeliveryStatus: () => DeliveryStatus,
  NetworkProvider: () => NetworkProvider,
  PaymentMethod: () => PaymentMethod,
  PaymentStatus: () => PaymentStatus,
  ProductType: () => ProductType,
  ResultCheckerType: () => ResultCheckerType,
  SmsStatus: () => SmsStatus,
  TransactionStatus: () => TransactionStatus,
  UserRole: () => UserRole,
  WithdrawalStatus: () => WithdrawalStatus,
  adminBasePrices: () => adminBasePrices,
  agentRegisterSchema: () => agentRegisterSchema,
  agents: () => agents,
  agentsRelations: () => agentsRelations,
  announcements: () => announcements,
  apiKeys: () => apiKeys,
  apiKeysRelations: () => apiKeysRelations,
  auditLogs: () => auditLogs,
  chatMessages: () => chatMessages,
  chatMessagesRelations: () => chatMessagesRelations,
  customPricing: () => customPricing,
  dataBundles: () => dataBundles,
  externalApiProviders: () => externalApiProviders,
  insertAdminBasePricesSchema: () => insertAdminBasePricesSchema,
  insertAgentSchema: () => insertAgentSchema,
  insertAnnouncementSchema: () => insertAnnouncementSchema,
  insertApiKeySchema: () => insertApiKeySchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertCustomPricingSchema: () => insertCustomPricingSchema,
  insertDataBundleSchema: () => insertDataBundleSchema,
  insertExternalApiProviderSchema: () => insertExternalApiProviderSchema,
  insertProfitTransactionSchema: () => insertProfitTransactionSchema,
  insertProfitWalletSchema: () => insertProfitWalletSchema,
  insertResultCheckerSchema: () => insertResultCheckerSchema,
  insertRoleBasePricesSchema: () => insertRoleBasePricesSchema,
  insertSettingsSchema: () => insertSettingsSchema,
  insertSmsLogSchema: () => insertSmsLogSchema,
  insertSupportChatSchema: () => insertSupportChatSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  insertVideoGuideSchema: () => insertVideoGuideSchema,
  insertWalletDeductionTransactionSchema: () => insertWalletDeductionTransactionSchema,
  insertWalletTopupTransactionSchema: () => insertWalletTopupTransactionSchema,
  insertWithdrawalSchema: () => insertWithdrawalSchema,
  loginSchema: () => loginSchema,
  profitTransactions: () => profitTransactions,
  profitTransactionsRelations: () => profitTransactionsRelations,
  profitWallets: () => profitWallets,
  profitWalletsRelations: () => profitWalletsRelations,
  purchaseSchema: () => purchaseSchema,
  registerSchema: () => registerSchema,
  resultCheckers: () => resultCheckers,
  roleBasePrices: () => roleBasePrices,
  settings: () => settings,
  smsLogs: () => smsLogs,
  supportChats: () => supportChats,
  supportChatsRelations: () => supportChatsRelations,
  transactions: () => transactions,
  transactionsRelations: () => transactionsRelations,
  updateExternalApiProviderSchema: () => updateExternalApiProviderSchema,
  users: () => users,
  usersRelations: () => usersRelations,
  videoGuides: () => videoGuides,
  walletDeductionTransactions: () => walletDeductionTransactions,
  walletTopupTransactions: () => walletTopupTransactions,
  withdrawalRequestSchema: () => withdrawalRequestSchema,
  withdrawals: () => withdrawals,
  withdrawalsRelations: () => withdrawalsRelations
});
import { pgTable, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { randomUUID } from "crypto";
var UserRole, TransactionStatus, DeliveryStatus, PaymentStatus, ProductType, NetworkProvider, ResultCheckerType, WithdrawalStatus, PaymentMethod, ChatStatus, ChatSenderType, SmsStatus, users, agents, dataBundles, resultCheckers, transactions, withdrawals, smsLogs, auditLogs, customPricing, adminBasePrices, roleBasePrices, supportChats, chatMessages, apiKeys, announcements, walletTopupTransactions, walletDeductionTransactions, settings, videoGuides, externalApiProviders, profitWallets, profitTransactions, usersRelations, apiKeysRelations, agentsRelations, transactionsRelations, withdrawalsRelations, profitWalletsRelations, profitTransactionsRelations, supportChatsRelations, chatMessagesRelations, insertUserSchema, insertApiKeySchema, insertAgentSchema, insertCustomPricingSchema, insertAdminBasePricesSchema, insertRoleBasePricesSchema, insertDataBundleSchema, insertResultCheckerSchema, insertTransactionSchema, insertWithdrawalSchema, insertProfitWalletSchema, insertProfitTransactionSchema, insertSmsLogSchema, insertAuditLogSchema, insertSupportChatSchema, insertChatMessageSchema, insertAnnouncementSchema, insertWalletTopupTransactionSchema, insertWalletDeductionTransactionSchema, insertSettingsSchema, insertVideoGuideSchema, insertExternalApiProviderSchema, updateExternalApiProviderSchema, loginSchema, registerSchema, agentRegisterSchema, purchaseSchema, withdrawalRequestSchema;
var init_schema = __esm({
  "src/shared/schema.ts"() {
    UserRole = {
      ADMIN: "admin",
      AGENT: "agent",
      DEALER: "dealer",
      SUPER_DEALER: "super_dealer",
      MASTER: "master",
      USER: "user",
      GUEST: "guest"
    };
    TransactionStatus = {
      PENDING: "pending",
      PROCESSING: "processing",
      CONFIRMED: "confirmed",
      COMPLETED: "completed",
      DELIVERED: "delivered",
      CANCELLED: "cancelled",
      FAILED: "failed",
      REFUNDED: "refunded"
    };
    DeliveryStatus = {
      PENDING: "pending",
      PROCESSING: "processing",
      DELIVERED: "delivered",
      FAILED: "failed"
    };
    PaymentStatus = {
      PENDING: "pending",
      PAID: "paid",
      FAILED: "failed",
      CANCELLED: "cancelled",
      REFUNDED: "refunded"
    };
    ProductType = {
      DATA_BUNDLE: "data_bundle",
      RESULT_CHECKER: "result_checker",
      AGENT_ACTIVATION: "agent_activation"
    };
    NetworkProvider = {
      MTN: "mtn",
      TELECEL: "telecel",
      AT_BIGTIME: "at_bigtime",
      AT_ISHARE: "at_ishare"
    };
    ResultCheckerType = {
      BECE: "bece",
      WASSCE: "wassce"
    };
    WithdrawalStatus = {
      PENDING: "pending",
      APPROVED: "approved",
      REJECTED: "rejected",
      PAID: "paid"
    };
    PaymentMethod = {
      BANK: "bank",
      MTN_MOMO: "mtn_momo",
      TELECEL_CASH: "telecel_cash",
      AIRTEL_TIGO_CASH: "airtel_tigo_cash",
      AT_BIGTIME: "at_bigtime",
      AT_ISHARE: "at_ishare",
      VODAFONE_CASH: "vodafone_cash"
    };
    ChatStatus = {
      OPEN: "open",
      CLOSED: "closed"
    };
    ChatSenderType = {
      USER: "user",
      ADMIN: "admin"
    };
    SmsStatus = {
      PENDING: "pending",
      SENT: "sent",
      FAILED: "failed",
      RETRYING: "retrying"
    };
    users = pgTable("users", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      email: text("email").notNull().unique(),
      password: text("password").notNull(),
      name: text("name").notNull(),
      phone: text("phone"),
      role: text("role").notNull().default("agent"),
      walletBalance: text("wallet_balance").notNull().default("0.00"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      emailIdx: index("users_email_idx").on(table.email),
      roleIdx: index("users_role_idx").on(table.role)
    }));
    agents = pgTable("agents", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      userIdIdx: index("agents_user_id_idx").on(table.userId),
      slugIdx: index("agents_slug_idx").on(table.storefrontSlug)
    }));
    dataBundles = pgTable("data_bundles", {
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
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      networkIdx: index("data_bundles_network_idx").on(table.network),
      activeIdx: index("data_bundles_active_idx").on(table.isActive)
    }));
    resultCheckers = pgTable("result_checkers", {
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
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      typeIdx: index("result_checkers_type_idx").on(table.type),
      soldIdx: index("result_checkers_sold_idx").on(table.isSold),
      yearIdx: index("result_checkers_year_idx").on(table.year)
    }));
    transactions = pgTable("transactions", {
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
      phoneNumbers: text("phone_numbers"),
      // Array of phone numbers for bulk orders
      isBulkOrder: boolean("is_bulk_order").default(false),
      paymentMethod: text("payment_method").notNull().default("paystack"),
      // "paystack" or "wallet"
      status: text("status").notNull().default("processing"),
      deliveryStatus: text("delivery_status").notNull().default("processing"),
      paymentReference: text("payment_reference"),
      paymentStatus: text("payment_status").notNull().default("pending"),
      agentId: text("agent_id"),
      agentProfit: text("agent_profit").default("0.00"),
      providerId: text("provider_id"),
      // External API provider used for this transaction
      webhookUrl: text("webhook_url"),
      // Optional webhook URL for status notifications
      apiResponse: text("api_response"),
      deliveredPin: text("delivered_pin"),
      deliveredSerial: text("delivered_serial"),
      smsStatus: text("sms_status"),
      failureReason: text("failure_reason"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      completedAt: timestamp("completed_at")
    }, (table) => ({
      referenceIdx: index("transactions_reference_idx").on(table.reference),
      statusIdx: index("transactions_status_idx").on(table.status),
      agentIdx: index("transactions_agent_idx").on(table.agentId),
      typeIdx: index("transactions_type_idx").on(table.type),
      createdAtIdx: index("transactions_created_at_idx").on(table.createdAt)
    }));
    withdrawals = pgTable("withdrawals", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      amount: text("amount").notNull(),
      status: text("status").notNull().default("pending"),
      // "pending" | "approved" | "rejected" | "paid"
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
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      userIdx: index("withdrawals_user_idx").on(table.userId),
      statusIdx: index("withdrawals_status_idx").on(table.status)
    }));
    smsLogs = pgTable("sms_logs", {
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
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      transactionIdx: index("sms_logs_transaction_idx").on(table.transactionId),
      statusIdx: index("sms_logs_status_idx").on(table.status)
    }));
    auditLogs = pgTable("audit_logs", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id"),
      action: text("action").notNull(),
      entityType: text("entity_type").notNull(),
      entityId: text("entity_id"),
      oldValue: text("old_value"),
      newValue: text("new_value"),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      userIdx: index("audit_logs_user_idx").on(table.userId),
      actionIdx: index("audit_logs_action_idx").on(table.action),
      entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
      createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt)
    }));
    customPricing = pgTable("custom_pricing", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      productId: text("product_id").notNull(),
      // Can reference dataBundles or resultCheckers
      roleOwnerId: text("role_owner_id").notNull(),
      // Agent ID, Dealer User ID, etc.
      role: text("role").notNull(),
      // agent, dealer, super_dealer, master
      sellingPrice: text("selling_price").notNull(),
      // Final selling price
      profit: text("profit"),
      // Agent-defined profit margin
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      productIdx: index("custom_pricing_product_idx").on(table.productId),
      roleOwnerIdx: index("custom_pricing_role_owner_idx").on(table.roleOwnerId),
      roleIdx: index("custom_pricing_role_idx").on(table.role),
      uniqueProductRoleOwner: index("custom_pricing_unique").on(table.productId, table.roleOwnerId, table.role)
    }));
    adminBasePrices = pgTable("admin_base_prices", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      productId: text("product_id").notNull(),
      // Can reference dataBundles or resultCheckers
      basePrice: text("base_price").notNull(),
      // Admin-set base price
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      productIdx: index("admin_base_prices_product_idx").on(table.productId),
      uniqueProduct: index("admin_base_prices_unique").on(table.productId)
    }));
    roleBasePrices = pgTable("role_base_prices", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      bundleId: text("bundle_id").notNull().references(() => dataBundles.id, { onDelete: "cascade" }),
      role: text("role").notNull(),
      // admin, agent, dealer, super_dealer, master
      basePrice: text("base_price").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      bundleIdx: index("role_base_prices_bundle_idx").on(table.bundleId),
      roleIdx: index("role_base_prices_role_idx").on(table.role),
      uniqueBundleRole: index("role_base_prices_unique").on(table.bundleId, table.role)
    }));
    supportChats = pgTable("support_chats", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull(),
      userEmail: text("user_email").notNull(),
      userName: text("user_name").notNull(),
      status: text("status").notNull().default("open"),
      // open, closed
      lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
      assignedToAdminId: text("assigned_to_admin_id"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      closedAt: timestamp("closed_at")
    }, (table) => ({
      userIdx: index("support_chats_user_idx").on(table.userId),
      statusIdx: index("support_chats_status_idx").on(table.status),
      assignedAdminIdx: index("support_chats_assigned_admin_idx").on(table.assignedToAdminId)
    }));
    chatMessages = pgTable("chat_messages", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      chatId: text("chat_id").notNull(),
      senderId: text("sender_id").notNull(),
      senderType: text("sender_type").notNull(),
      // user, admin
      message: text("message").notNull(),
      isRead: boolean("is_read").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      chatIdx: index("chat_messages_chat_idx").on(table.chatId),
      senderIdx: index("chat_messages_sender_idx").on(table.senderId)
    }));
    apiKeys = pgTable("api_keys", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      key: text("key").notNull().unique(),
      permissions: text("permissions").notNull().default("{}"),
      isActive: boolean("is_active").notNull().default(true),
      lastUsed: timestamp("last_used"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      userIdx: index("api_keys_user_idx").on(table.userId),
      keyIdx: index("api_keys_key_idx").on(table.key),
      activeIdx: index("api_keys_active_idx").on(table.isActive)
    }));
    announcements = pgTable("announcements", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      title: text("title").notNull(),
      message: text("message").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      audiences: text("audiences").notNull().default('["all"]'),
      // JSON array: 'all', 'guest', 'loggedIn', 'agent', 'storefront'
      createdBy: text("created_by").notNull(),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      activeIdx: index("announcements_active_idx").on(table.isActive),
      createdAtIdx: index("announcements_created_at_idx").on(table.createdAt)
    }));
    walletTopupTransactions = pgTable("wallet_topup_transactions", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      adminId: text("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      amount: text("amount").notNull(),
      reason: text("reason"),
      transactionId: text("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      userIdx: index("wallet_topup_transactions_user_idx").on(table.userId),
      adminIdx: index("wallet_topup_transactions_admin_idx").on(table.adminId),
      transactionIdx: index("wallet_topup_transactions_transaction_idx").on(table.transactionId)
    }));
    walletDeductionTransactions = pgTable("wallet_deduction_transactions", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      adminId: text("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      amount: text("amount").notNull(),
      reason: text("reason"),
      transactionId: text("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      userIdx: index("wallet_deduction_transactions_user_idx").on(table.userId),
      adminIdx: index("wallet_deduction_transactions_admin_idx").on(table.adminId),
      transactionIdx: index("wallet_deduction_transactions_transaction_idx").on(table.transactionId)
    }));
    settings = pgTable("settings", {
      key: text("key").primaryKey(),
      value: text("value").notNull(),
      description: text("description"),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    videoGuides = pgTable("video_guides", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      title: text("title").notNull(),
      description: text("description"),
      category: text("category").notNull(),
      // guest | customer | agent
      url: text("url").notNull(),
      provider: text("provider"),
      // youtube | vimeo | mp4 | other
      isPublished: boolean("is_published").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      categoryIdx: index("video_guides_category_idx").on(table.category),
      publishedIdx: index("video_guides_published_idx").on(table.isPublished)
    }));
    externalApiProviders = pgTable("external_api_providers", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      name: text("name").notNull(),
      provider: text("provider").notNull(),
      // e.g., "skytech", "another_provider"
      apiKey: text("api_key").notNull(),
      apiSecret: text("api_secret").notNull(),
      endpoint: text("endpoint").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      isDefault: boolean("is_default").notNull().default(false),
      networkMappings: text("network_mappings"),
      // JSON string for network mappings
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    profitWallets = pgTable("profit_wallets", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      availableBalance: text("available_balance").notNull().default("0.00"),
      pendingBalance: text("pending_balance").notNull().default("0.00"),
      totalEarned: text("total_earned").notNull().default("0.00"),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      userIdx: index("profit_wallets_user_idx").on(table.userId)
    }));
    profitTransactions = pgTable("profit_transactions", {
      id: text("id").primaryKey().$defaultFn(() => randomUUID()),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      orderId: text("order_id").references(() => transactions.id, { onDelete: "set null" }),
      productId: text("product_id"),
      sellingPrice: text("selling_price").notNull(),
      basePrice: text("base_price").notNull(),
      profit: text("profit").notNull(),
      status: text("status").notNull().default("pending"),
      // "pending" | "available"
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      userIdx: index("profit_transactions_user_idx").on(table.userId),
      orderIdx: index("profit_transactions_order_idx").on(table.orderId),
      statusIdx: index("profit_transactions_status_idx").on(table.status)
    }));
    usersRelations = relations(users, ({ one, many }) => ({
      agent: one(agents, {
        fields: [users.id],
        references: [agents.userId]
      }),
      apiKeys: many(apiKeys),
      profitWallet: one(profitWallets, {
        fields: [users.id],
        references: [profitWallets.userId]
      }),
      profitTransactions: many(profitTransactions),
      withdrawals: many(withdrawals)
    }));
    apiKeysRelations = relations(apiKeys, ({ one }) => ({
      user: one(users, {
        fields: [apiKeys.userId],
        references: [users.id]
      })
    }));
    agentsRelations = relations(agents, ({ one, many }) => ({
      user: one(users, {
        fields: [agents.userId],
        references: [users.id]
      }),
      transactions: many(transactions),
      withdrawals: many(withdrawals)
    }));
    transactionsRelations = relations(transactions, ({ one }) => ({
      agent: one(agents, {
        fields: [transactions.agentId],
        references: [agents.id]
      })
    }));
    withdrawalsRelations = relations(withdrawals, ({ one }) => ({
      user: one(users, {
        fields: [withdrawals.userId],
        references: [users.id]
      })
    }));
    profitWalletsRelations = relations(profitWallets, ({ one }) => ({
      user: one(users, {
        fields: [profitWallets.userId],
        references: [users.id]
      })
    }));
    profitTransactionsRelations = relations(profitTransactions, ({ one }) => ({
      user: one(users, {
        fields: [profitTransactions.userId],
        references: [users.id]
      }),
      order: one(transactions, {
        fields: [profitTransactions.orderId],
        references: [transactions.id]
      })
    }));
    supportChatsRelations = relations(supportChats, ({ many, one }) => ({
      messages: many(chatMessages),
      user: one(users, {
        fields: [supportChats.userId],
        references: [users.id]
      })
    }));
    chatMessagesRelations = relations(chatMessages, ({ one }) => ({
      chat: one(supportChats, {
        fields: [chatMessages.chatId],
        references: [supportChats.id]
      })
    }));
    insertUserSchema = z.object({
      id: z.string().optional(),
      email: z.string().email(),
      password: z.string(),
      name: z.string(),
      phone: z.string().optional(),
      role: z.enum(["admin", "agent", "dealer", "super_dealer", "master", "user", "guest"]).default("user"),
      walletBalance: z.string().optional(),
      isActive: z.boolean().optional()
    });
    insertApiKeySchema = z.object({
      userId: z.string(),
      name: z.string(),
      key: z.string(),
      permissions: z.string().optional(),
      isActive: z.boolean().optional()
    });
    insertAgentSchema = z.object({
      userId: z.string(),
      storefrontSlug: z.string(),
      businessName: z.string(),
      businessDescription: z.string(),
      customPricingMarkup: z.string().optional(),
      isApproved: z.boolean().optional(),
      paymentPending: z.boolean().optional(),
      activationFee: z.string().optional(),
      whatsappSupportLink: z.string().optional(),
      whatsappChannelLink: z.string().optional()
    });
    insertCustomPricingSchema = z.object({
      productId: z.string(),
      roleOwnerId: z.string(),
      role: z.string(),
      sellingPrice: z.string()
    });
    insertAdminBasePricesSchema = z.object({
      productId: z.string(),
      basePrice: z.string()
    });
    insertRoleBasePricesSchema = z.object({
      bundleId: z.string(),
      role: z.string(),
      basePrice: z.string()
    });
    insertDataBundleSchema = z.object({
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
      apiCode: z.string().optional()
    });
    insertResultCheckerSchema = z.object({
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
      currency: z.string().optional()
    });
    insertTransactionSchema = z.object({
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
      webhookUrl: z.string().optional(),
      // Webhook URL for status notifications
      apiResponse: z.string().optional(),
      deliveredPin: z.string().optional(),
      deliveredSerial: z.string().optional(),
      smsStatus: z.string().optional(),
      failureReason: z.string().optional(),
      completedAt: z.date().optional()
    });
    insertWithdrawalSchema = z.object({
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
      requestedAt: z.date().optional()
    });
    insertProfitWalletSchema = z.object({
      userId: z.string(),
      availableBalance: z.string().optional(),
      pendingBalance: z.string().optional(),
      totalEarned: z.string().optional(),
      agentId: z.string().optional(),
      balance: z.string().optional(),
      totalSales: z.string().optional(),
      totalProfit: z.string().optional()
    });
    insertProfitTransactionSchema = z.object({
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
      description: z.string().optional()
    });
    insertSmsLogSchema = z.object({
      transactionId: z.string(),
      phone: z.string(),
      message: z.string(),
      status: z.string().optional(),
      provider: z.string().optional(),
      providerMessageId: z.string().optional(),
      retryCount: z.number().optional(),
      lastRetryAt: z.date().optional(),
      sentAt: z.date().optional(),
      errorMessage: z.string().optional()
    });
    insertAuditLogSchema = z.object({
      userId: z.string().optional(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().optional(),
      oldValue: z.string().optional(),
      newValue: z.string().optional(),
      ipAddress: z.string().optional(),
      userAgent: z.string().optional()
    });
    insertSupportChatSchema = z.object({
      userId: z.string(),
      userEmail: z.string(),
      userName: z.string(),
      status: z.string().optional(),
      lastMessageAt: z.date().optional(),
      assignedToAdminId: z.string().optional(),
      closedAt: z.date().optional()
    });
    insertChatMessageSchema = z.object({
      chatId: z.string(),
      senderId: z.string(),
      senderType: z.string(),
      message: z.string(),
      isRead: z.boolean().optional()
    });
    insertAnnouncementSchema = z.object({
      title: z.string(),
      message: z.string(),
      audiences: z.string().optional(),
      // JSON string of audience array
      isActive: z.boolean().optional(),
      createdBy: z.string(),
      content: z.string().optional(),
      type: z.enum(["info", "warning", "success", "error"]).optional(),
      expiresAt: z.date().optional()
    });
    insertWalletTopupTransactionSchema = z.object({
      userId: z.string(),
      adminId: z.string(),
      amount: z.string(),
      reason: z.string().optional(),
      transactionId: z.string().optional(),
      method: z.string().optional(),
      status: z.string().optional(),
      reference: z.string().optional(),
      agentId: z.string().optional()
    });
    insertWalletDeductionTransactionSchema = z.object({
      userId: z.string(),
      adminId: z.string(),
      amount: z.string(),
      reason: z.string().optional(),
      transactionId: z.string().optional()
    });
    insertSettingsSchema = z.object({
      key: z.string(),
      value: z.string(),
      description: z.string().optional()
    });
    insertVideoGuideSchema = z.object({
      title: z.string(),
      description: z.string().optional(),
      category: z.enum(["guest", "customer", "agent"]),
      url: z.string(),
      provider: z.enum(["youtube", "vimeo", "mp4", "other"]).optional(),
      isPublished: z.boolean().optional()
    });
    insertExternalApiProviderSchema = z.object({
      name: z.string(),
      provider: z.string(),
      apiKey: z.string(),
      apiSecret: z.string(),
      endpoint: z.string(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
      networkMappings: z.string().optional(),
      type: z.string().optional()
    });
    updateExternalApiProviderSchema = z.object({
      name: z.string().optional(),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      endpoint: z.string().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
      networkMappings: z.string().optional()
    });
    loginSchema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters")
    });
    registerSchema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      name: z.string().min(2, "Name must be at least 2 characters"),
      phone: z.string().min(10, "Phone must be at least 10 characters")
    });
    agentRegisterSchema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      name: z.string().min(2, "Name must be at least 2 characters"),
      phone: z.string().min(10, "Phone must be at least 10 characters"),
      businessName: z.string().min(2, "Business name must be at least 2 characters"),
      storefrontSlug: z.string().min(3, "Storefront URL must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
      businessDescription: z.string().min(10, "Business description must be at least 10 characters")
    });
    purchaseSchema = z.object({
      productId: z.string().optional(),
      // Optional - can use volume + network instead
      productType: z.enum(["data_bundle", "result_checker"]),
      volume: z.string().optional(),
      // e.g., "1GB", "2GB", "5GB"
      customerPhone: z.string().optional(),
      customerEmail: z.union([z.string().email(), z.literal("")]).optional(),
      agentSlug: z.union([z.string(), z.null()]).optional(),
      amount: z.string().optional(),
      paymentMethod: z.enum(["paystack", "wallet"]).optional(),
      webhookUrl: z.string().url().optional(),
      // Optional webhook URL for status notifications
      phoneNumbers: z.array(z.object({
        phone: z.string(),
        bundleName: z.string(),
        dataAmount: z.string()
      })).optional(),
      isBulkOrder: z.boolean().optional(),
      network: z.string().optional(),
      // Required when using volume
      orderItems: z.array(z.object({
        phone: z.string(),
        bundleId: z.string(),
        bundleName: z.string(),
        price: z.number()
      })).optional(),
      totalAmount: z.number().optional(),
      quantity: z.number().optional()
    }).refine((data) => {
      if (data.productType === "data_bundle" && (!data.customerPhone || typeof data.customerPhone === "string" && data.customerPhone.length < 10)) {
        return false;
      }
      return true;
    }, {
      message: "Phone number is required for data bundle purchases and must be at least 10 digits",
      path: ["customerPhone"]
    }).refine((data) => {
      if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) return true;
      if (data.volume && data.network) return true;
      return data.productId !== void 0;
    }, {
      message: "Either productId, orderItems, or (volume + network) must be provided",
      path: ["productId"]
    });
    withdrawalRequestSchema = z.object({
      amount: z.number().min(10, "Minimum withdrawal amount is GH\u20B510").positive("Amount must be positive"),
      paymentMethod: z.enum(["mtn_momo", "telecel_cash", "airtel_tigo_cash", "at_bigtime", "at_ishare", "vodafone_cash"], {
        required_error: "Please select a payment method"
      }),
      bankName: z.string().optional(),
      bankCode: z.string().optional(),
      accountNumber: z.string().min(5, "Account/Phone number is required"),
      accountName: z.string().min(2, "Account name is required")
    });
  }
});

// src/server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  ensureDbInitialized: () => ensureDbInitialized,
  getPool: () => getPool,
  pool: () => pool
});
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";
import { fileURLToPath } from "url";
function initializeDatabase() {
  if (_initialized) return;
  const usePostgreSQL = process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith("postgresql://") || process.env.DATABASE_URL.startsWith("postgres://"));
  if (usePostgreSQL) {
    if (!process.env.DATABASE_URL) {
      throw new Error("[DB] DATABASE_URL environment variable is required");
    }
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      min: 2,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 1e4,
      statement_timeout: 3e4,
      query_timeout: 3e4,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });
    _pool.on("error", (err) => {
      console.error("[DB Pool] Connection error");
    });
    _db = drizzle(_pool, { schema: schema_exports });
  } else {
    const sqlite = new Database(path.resolve(__dirname, "../../dev.db"));
    _db = drizzleSqlite(sqlite, { schema: schema_exports });
  }
  _initialized = true;
}
function getPool() {
  if (!_initialized) {
    initializeDatabase();
  }
  return _pool;
}
function ensureDbInitialized() {
  if (!_initialized) {
    initializeDatabase();
  }
}
var __filename, __dirname, _db, _pool, _initialized, db, pool;
var init_db = __esm({
  "src/server/db.ts"() {
    init_schema();
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    _db = null;
    _pool = null;
    _initialized = false;
    db = new Proxy({}, {
      get(target, prop) {
        if (!_initialized) {
          initializeDatabase();
        }
        return _db[prop];
      }
    });
    pool = new Proxy({}, {
      get(target, prop) {
        const p = getPool();
        return p ? p[prop] : void 0;
      }
    });
  }
});

// src/server/utils/network-validator.ts
function normalizePhoneNumber(phone) {
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("233")) {
    normalized = "0" + normalized.substring(3);
  }
  if (!normalized.startsWith("0")) {
    normalized = "0" + normalized;
  }
  return normalized;
}
function isValidPhoneLength(phone) {
  const normalized = normalizePhoneNumber(phone);
  return normalized.length === 10;
}
function detectNetwork(phone) {
  return null;
}
function validatePhoneNetwork(phone, expectedNetwork) {
  return true;
}
function getNetworkMismatchError(phone, expectedNetwork) {
  return "";
}
var init_network_validator = __esm({
  "src/server/utils/network-validator.ts"() {
  }
});

// src/server/storage.ts
import { eq, and, desc, sql, gte, lte, or, max, count, inArray, lt, isNotNull, ne } from "drizzle-orm";
import { randomUUID as randomUUID2 } from "crypto";
var DatabaseStorage, storage;
var init_storage = __esm({
  "src/server/storage.ts"() {
    init_db();
    init_network_validator();
    init_schema();
    DatabaseStorage = class {
      getProduct(productId) {
        throw new Error("Method not implemented.");
      }
      // ============================================
      // USERS
      // ============================================
      async getUser(id) {
        const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
        return result[0];
      }
      async getUserByEmail(email) {
        if (!email || typeof email !== "string") {
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
        if (role === "agent") {
          const agent = await this.getAgentBySlug(slug);
          if (agent) {
            return this.getUser(agent.userId);
          }
          return void 0;
        } else {
          return this.getUser(slug);
        }
      }
      async createUser(insertUser) {
        if (!insertUser.email || typeof insertUser.email !== "string") {
          throw new Error("Invalid email");
        }
        if (!insertUser.name || typeof insertUser.name !== "string" || insertUser.name.length < 2) {
          throw new Error("Invalid name");
        }
        if (insertUser.password !== void 0 && insertUser.password !== "" && typeof insertUser.password !== "string") {
          throw new Error("Invalid password");
        }
        const normalizedEmail = insertUser.email.toLowerCase().trim();
        if (!normalizedEmail || !normalizedEmail.includes("@")) {
          throw new Error("Invalid email format");
        }
        const result = await db.insert(users).values({
          id: insertUser.id || randomUUID2(),
          ...insertUser,
          email: normalizedEmail,
          password: insertUser.password || ""
          // Default to empty string if not provided
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
        if (filters?.isApproved !== void 0) {
          query = query.where(eq(agents.isApproved, filters.isApproved));
        }
        return query.orderBy(desc(agents.createdAt));
      }
      async createAgent(insertAgent) {
        const [agent] = await db.insert(agents).values({
          id: randomUUID2(),
          ...insertAgent,
          storefrontSlug: insertAgent.storefrontSlug.toLowerCase()
        }).returning();
        return agent;
      }
      async updateAgent(id, data) {
        const [agent] = await db.update(agents).set(data).where(eq(agents.id, id)).returning();
        return agent;
      }
      async updateAgentBalance(id, amount, addProfit) {
        const agent = await this.getAgent(id);
        if (!agent) return void 0;
        const newBalance = parseFloat(agent.balance) + amount;
        const newTotalSales = parseFloat(agent.totalSales) + (amount > 0 ? amount : 0);
        const newTotalProfit = addProfit ? parseFloat(agent.totalProfit) + amount : parseFloat(agent.totalProfit);
        const [updated] = await db.update(agents).set({
          balance: newBalance.toFixed(2),
          totalSales: newTotalSales.toFixed(2),
          totalProfit: newTotalProfit.toFixed(2)
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
        if (filters?.network) conditions.push(eq(dataBundles.network, filters.network));
        if (filters?.isActive !== void 0) conditions.push(eq(dataBundles.isActive, filters.isActive));
        let query = db.select().from(dataBundles);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        const dataAmountInMB = sql`
      CASE 
        WHEN ${dataBundles.dataAmount} LIKE '%GB' THEN CAST(SUBSTRING(${dataBundles.dataAmount} FROM 1 FOR LENGTH(${dataBundles.dataAmount})-2) AS FLOAT) * 1024
        WHEN ${dataBundles.dataAmount} LIKE '%MB' THEN CAST(SUBSTRING(${dataBundles.dataAmount} FROM 1 FOR LENGTH(${dataBundles.dataAmount})-2) AS FLOAT)
        ELSE 0
      END
    `;
        return query.orderBy(dataBundles.network, dataAmountInMB, dataBundles.basePrice);
      }
      async getNetworksWithBasePrices() {
        const result = await db.select({
          network: dataBundles.network,
          basePrice: sql`min(${dataBundles.basePrice})`,
          name: sql`CASE 
          WHEN ${dataBundles.network} = 'mtn' THEN 'MTN'
          WHEN ${dataBundles.network} = 'telecel' THEN 'Telecel'
          WHEN ${dataBundles.network} = 'at_bigtime' THEN 'AT BIG TIME'
          WHEN ${dataBundles.network} = 'at_ishare' THEN 'AT iShare'
          ELSE ${dataBundles.network}
        END`
        }).from(dataBundles).where(eq(dataBundles.isActive, true)).groupBy(dataBundles.network).orderBy(dataBundles.network);
        return result;
      }
      async createDataBundle(bundle) {
        const [created] = await db.insert(dataBundles).values({
          id: randomUUID2(),
          ...bundle
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
        const [checker] = await db.select().from(resultCheckers).where(and(
          eq(resultCheckers.type, type),
          eq(resultCheckers.year, year),
          eq(resultCheckers.isSold, false)
        )).limit(1);
        return checker;
      }
      async getAvailableResultCheckersByQuantity(type, year, quantity) {
        const checkers = await db.select().from(resultCheckers).where(and(
          eq(resultCheckers.type, type),
          eq(resultCheckers.year, year),
          eq(resultCheckers.isSold, false)
        )).limit(quantity);
        return checkers;
      }
      async getResultCheckersByTransaction(transactionId) {
        const checkers = await db.select().from(resultCheckers).where(eq(resultCheckers.transactionId, transactionId));
        return checkers;
      }
      async getResultCheckerStock(type, year) {
        const result = await db.select({ count: count() }).from(resultCheckers).where(and(
          eq(resultCheckers.type, type),
          eq(resultCheckers.year, year),
          eq(resultCheckers.isSold, false)
        ));
        return Number(result[0]?.count || 0);
      }
      async getResultCheckers(filters) {
        const conditions = [];
        if (filters?.type) conditions.push(eq(resultCheckers.type, filters.type));
        if (filters?.year) conditions.push(eq(resultCheckers.year, filters.year));
        if (filters?.isSold !== void 0) conditions.push(eq(resultCheckers.isSold, filters.isSold));
        let query = db.select().from(resultCheckers);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        return query.orderBy(desc(resultCheckers.createdAt));
      }
      async createResultChecker(checker) {
        const [created] = await db.insert(resultCheckers).values({
          ...checker
        }).returning();
        return created;
      }
      async createResultCheckersBulk(checkers) {
        if (checkers.length === 0) return [];
        const checkersWithIds = checkers.map((checker) => ({
          ...checker
        }));
        return db.insert(resultCheckers).values(checkersWithIds).returning();
      }
      async markResultCheckerSold(id, transactionId, phone) {
        const [checker] = await db.update(resultCheckers).set({
          isSold: true,
          soldAt: /* @__PURE__ */ new Date(),
          soldToPhone: phone,
          transactionId
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
      async deleteSoldCheckers() {
        const result = await db.delete(resultCheckers).where(eq(resultCheckers.isSold, true));
        return result.rowCount ?? 0;
      }
      async getResultCheckerSummary() {
        const result = await db.select({
          type: resultCheckers.type,
          year: resultCheckers.year,
          total: count(),
          available: sql`count(case when ${resultCheckers.isSold} = false then 1 end)`,
          sold: sql`count(case when ${resultCheckers.isSold} = true then 1 end)`
        }).from(resultCheckers).groupBy(resultCheckers.type, resultCheckers.year).orderBy(resultCheckers.type, resultCheckers.year);
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
        let [transaction] = await db.select().from(transactions).where(eq(transactions.customerPhone, phone)).orderBy(desc(transactions.createdAt)).limit(1);
        if (!transaction) {
          const allTransactions = await db.select().from(transactions).where(sql`${transactions.phoneNumbers} LIKE ${"%" + phone + "%"}`).orderBy(desc(transactions.createdAt)).limit(1);
          transaction = allTransactions[0];
        }
        return transaction;
      }
      async getLatestDataBundleTransactionByPhone(phone) {
        const normalized = normalizePhoneNumber(phone);
        let [transaction] = await db.select().from(transactions).where(and(
          eq(transactions.type, ProductType.DATA_BUNDLE),
          eq(transactions.customerPhone, normalized)
        )).orderBy(desc(transactions.createdAt)).limit(1);
        if (transaction) {
          return transaction;
        }
        const likePattern = `%${normalized}%`;
        const matches = await db.select().from(transactions).where(and(
          eq(transactions.type, ProductType.DATA_BUNDLE),
          sql`${transactions.phoneNumbers} LIKE ${likePattern}`
        )).orderBy(desc(transactions.createdAt)).limit(1);
        transaction = matches[0];
        return transaction;
      }
      async getTransactions(filters) {
        const conditions = [];
        if (filters?.customerEmail) conditions.push(eq(transactions.customerEmail, filters.customerEmail));
        if (filters?.customerPhone) conditions.push(eq(transactions.customerPhone, filters.customerPhone));
        if (filters?.agentId) conditions.push(eq(transactions.agentId, filters.agentId));
        if (filters?.status) conditions.push(eq(transactions.status, filters.status));
        if (filters?.type) conditions.push(eq(transactions.type, filters.type));
        let query = db.select().from(transactions);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        query = query.orderBy(desc(transactions.createdAt));
        if (filters?.limit) query = query.limit(filters.limit);
        if (filters?.offset) query = query.offset(filters.offset);
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
            isBulkOrder: transactions.isBulkOrder
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
            isBulkOrder: transactions.isBulkOrder
          }).from(transactions).orderBy(desc(transactions.createdAt));
        }
      }
      async createTransaction(transaction) {
        const [created] = await db.insert(transactions).values({
          id: randomUUID2(),
          ...transaction
        }).returning();
        return created;
      }
      async updateTransaction(id, data) {
        const [transaction] = await db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
        return transaction;
      }
      async deleteTransaction(id) {
        const result = await db.delete(transactions).where(eq(transactions.id, id));
        return true;
      }
      async updateTransactionDeliveryStatus(id, deliveryStatus) {
        const [transaction] = await db.update(transactions).set({ deliveryStatus }).where(eq(transactions.id, id)).returning();
        return transaction;
      }
      async getTransactionStats(agentId) {
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
          profit: profitSql
        }).from(transactions).where(conditions.length > 0 ? and(...conditions) : void 0);
        return {
          total: Number(stats[0]?.total || 0),
          completed: Number(stats[0]?.completed || 0),
          pending: Number(stats[0]?.pending || 0),
          revenue: Number(stats[0]?.revenue || 0),
          profit: Number(stats[0]?.profit || 0)
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
        if (filters?.userId) conditions.push(eq(withdrawals.userId, filters.userId));
        if (filters?.status) conditions.push(eq(withdrawals.status, filters.status));
        let query = db.select().from(withdrawals);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        return query.orderBy(desc(withdrawals.createdAt));
      }
      async createWithdrawal(withdrawal) {
        const [created] = await db.insert(withdrawals).values({
          ...withdrawal
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
          ...wallet
        }).returning();
        return created;
      }
      async updateProfitWallet(userId, data) {
        const [wallet] = await db.update(profitWallets).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(profitWallets.userId, userId)).returning();
        return wallet;
      }
      async addProfit(userId, amount, orderId, productId, sellingPrice, basePrice) {
        await db.transaction(async (tx) => {
          let wallet = await tx.select().from(profitWallets).where(eq(profitWallets.userId, userId)).limit(1).then((rows) => rows[0]);
          if (!wallet) {
            [wallet] = await tx.insert(profitWallets).values({
              userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00"
            }).returning();
          }
          if (orderId && productId && sellingPrice && basePrice) {
            await tx.insert(profitTransactions).values({
              userId,
              orderId,
              productId,
              sellingPrice: sellingPrice.toFixed(2),
              basePrice: basePrice.toFixed(2),
              profit: amount.toFixed(2),
              status: "available"
              // Profits are immediately available after payment verification
            });
          }
          const newTotalEarned = (parseFloat(wallet.totalEarned) + amount).toFixed(2);
          const newAvailableBalance = (parseFloat(wallet.availableBalance) + amount).toFixed(2);
          await tx.update(profitWallets).set({
            totalEarned: newTotalEarned,
            availableBalance: newAvailableBalance,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(profitWallets.userId, userId));
        });
      }
      // ============================================
      // PROFIT TRANSACTIONS
      // ============================================
      async getProfitTransactions(userId, filters) {
        const conditions = [eq(profitTransactions.userId, userId)];
        if (filters?.status) conditions.push(eq(profitTransactions.status, filters.status));
        let query = db.select().from(profitTransactions).where(and(...conditions));
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        return query.orderBy(desc(profitTransactions.createdAt));
      }
      async createProfitTransaction(transaction) {
        const [created] = await db.insert(profitTransactions).values({
          ...transaction
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
      async createSmsLog(log2) {
        const [created] = await db.insert(smsLogs).values({
          ...log2
        }).returning();
        return created;
      }
      async updateSmsLog(id, data) {
        const [log2] = await db.update(smsLogs).set(data).where(eq(smsLogs.id, id)).returning();
        return log2;
      }
      async getPendingSmsLogs() {
        return db.select().from(smsLogs).where(or(
          eq(smsLogs.status, "pending"),
          eq(smsLogs.status, "retrying")
        )).orderBy(smsLogs.createdAt);
      }
      // ============================================
      // AUDIT LOGS
      // ============================================
      async createAuditLog(log2) {
        const [created] = await db.insert(auditLogs).values({
          ...log2
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
          message
        };
      }
      async updateBreakSettings(settings2) {
        await this.setSetting("break_mode_enabled", settings2.isEnabled.toString(), "Site break mode enabled/disabled");
        await this.setSetting("break_mode_message", settings2.message, "Site break mode message");
        return settings2;
      }
      // ============================================
      // ADMIN STATS
      // ============================================
      async getAdminStats() {
        const [txStats] = await db.select({
          totalTransactions: sql`count(*)`,
          totalRevenue: sql`coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`,
          totalProfit: sql`coalesce(sum(case when status = 'completed' then cast(profit as numeric) else 0 end), 0)`
        }).from(transactions);
        const [agentProfitStats] = await db.select({
          totalAgentProfits: sql`coalesce(sum(case when status = 'completed' and agent_id is not null then cast(agent_profit as numeric) else 0 end), 0)`
        }).from(transactions);
        const [activationStats] = await db.select({
          revenue: sql`coalesce(sum(case when status = 'completed' and type = 'agent_activation' then cast(amount as numeric) else 0 end), 0)`
        }).from(transactions);
        const [withdrawalStats] = await db.select({
          pending: sql`count(*)`
        }).from(withdrawals).where(eq(withdrawals.status, "pending"));
        const [agentStats] = await db.select({
          total: sql`count(*)`
        }).from(agents);
        const [pendingAgentStats] = await db.select({
          pending: sql`count(*)`
        }).from(agents).where(eq(agents.paymentPending, true));
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [todayStats] = await db.select({
          revenue: sql`coalesce(sum(case when status = 'completed' then cast(amount as numeric) else 0 end), 0)`,
          transactions: sql`count(*)`
        }).from(transactions).where(and(gte(transactions.createdAt, today), lt(transactions.createdAt, tomorrow)));
        const [bundleStats] = await db.select({
          count: sql`count(*)`
        }).from(dataBundles).where(eq(dataBundles.isActive, true));
        const [checkerStats] = await db.select({
          count: sql`count(*)`
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
          resultCheckerStock: Number(checkerStats?.count || 0)
        };
      }
      async getRevenueAnalytics(days = 7) {
        const safeDays = Math.min(Math.max(Math.floor(days), 1), 90);
        const startDate = /* @__PURE__ */ new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - (safeDays - 1));
        const endDate = /* @__PURE__ */ new Date();
        endDate.setHours(23, 59, 59, 999);
        const dailyTotals = /* @__PURE__ */ new Map();
        for (let i = 0; i < safeDays; i++) {
          const current = new Date(startDate);
          current.setDate(startDate.getDate() + i);
          const key = current.toISOString().slice(0, 10);
          dailyTotals.set(key, { revenue: 0, transactions: 0 });
        }
        const rows = await db.select({
          amount: transactions.amount,
          status: transactions.status,
          createdAt: transactions.createdAt
        }).from(transactions).where(and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        ));
        for (const row of rows) {
          if (!row.createdAt) continue;
          const dateKey = new Date(row.createdAt).toISOString().slice(0, 10);
          const totals = dailyTotals.get(dateKey);
          if (!totals) continue;
          if (row.status === "completed") {
            const amount = Number.parseFloat(row.amount || "0");
            totals.revenue += Number.isFinite(amount) ? amount : 0;
            totals.transactions += 1;
          }
        }
        return Array.from(dailyTotals.entries()).map(([date, totals]) => ({
          date,
          revenue: Number(totals.revenue.toFixed(2)),
          transactions: totals.transactions
        }));
      }
      // Support Chat Methods
      async createSupportChat(userId, userEmail, userName) {
        const [chat] = await db.insert(supportChats).values({
          userId,
          userEmail,
          userName,
          status: "open",
          lastMessageAt: /* @__PURE__ */ new Date()
        }).returning();
        return chat.id;
      }
      async getUserSupportChats(userId) {
        return await db.select().from(supportChats).where(eq(supportChats.userId, userId)).orderBy(desc(supportChats.lastMessageAt));
      }
      async getAllSupportChats(status) {
        if (status) {
          return await db.select().from(supportChats).where(eq(supportChats.status, status)).orderBy(desc(supportChats.lastMessageAt));
        }
        return await db.select().from(supportChats).orderBy(desc(supportChats.lastMessageAt));
      }
      async getSupportChatById(chatId) {
        const [chat] = await db.select().from(supportChats).where(eq(supportChats.id, chatId));
        return chat;
      }
      async closeSupportChat(chatId) {
        await db.update(supportChats).set({ status: "closed", closedAt: /* @__PURE__ */ new Date() }).where(eq(supportChats.id, chatId));
      }
      async assignChatToAdmin(chatId, adminId) {
        await db.update(supportChats).set({ assignedToAdminId: adminId }).where(eq(supportChats.id, chatId));
      }
      async createChatMessage(chatId, senderId, senderType, message) {
        const [msg] = await db.insert(chatMessages).values({
          chatId,
          senderId,
          senderType,
          message,
          isRead: false
        }).returning();
        await db.update(supportChats).set({ lastMessageAt: /* @__PURE__ */ new Date() }).where(eq(supportChats.id, chatId));
        return msg.id;
      }
      async getChatMessages(chatId) {
        return await db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId)).orderBy(chatMessages.createdAt);
      }
      async markMessageAsRead(messageId) {
        await db.update(chatMessages).set({ isRead: true }).where(eq(chatMessages.id, messageId));
      }
      async getUnreadUserMessagesCount(userId) {
        const userChats = await db.select({ id: supportChats.id }).from(supportChats).where(eq(supportChats.userId, userId));
        if (userChats.length === 0) return 0;
        const chatIds = userChats.map((chat) => chat.id);
        const result = await db.select({ count: count() }).from(chatMessages).where(
          and(
            chatIds.length > 0 ? inArray(chatMessages.chatId, chatIds) : eq(chatMessages.chatId, ""),
            eq(chatMessages.senderType, "admin"),
            eq(chatMessages.isRead, false)
          )
        );
        return Number(result[0]?.count || 0);
      }
      async getUnreadAdminMessagesCount() {
        const result = await db.select({ count: sql`count(*)` }).from(chatMessages).where(
          and(
            eq(chatMessages.senderType, "user"),
            eq(chatMessages.isRead, false)
          )
        );
        return Number(result[0]?.count || 0);
      }
      // Agent Pricing Methods
      // Custom Pricing (Unified for all roles)
      async getCustomPricing(roleOwnerId, role) {
        try {
          const pricing = await db.select({
            productId: customPricing.productId,
            sellingPrice: customPricing.sellingPrice,
            profit: customPricing.profit
          }).from(customPricing).where(
            and(
              eq(customPricing.roleOwnerId, roleOwnerId),
              eq(customPricing.role, role)
            )
          );
          return pricing.map((p) => ({
            productId: p.productId,
            sellingPrice: p.sellingPrice || "0"
          }));
        } catch (error) {
          return [];
        }
      }
      async setCustomPricing(productId, roleOwnerId, role, sellingPrice, profit) {
        const priceNum = parseFloat(sellingPrice);
        if (isNaN(priceNum) || priceNum < 0) {
          throw new Error("Invalid selling price");
        }
        try {
          const [existing] = await db.select().from(customPricing).where(
            and(
              eq(customPricing.productId, productId),
              eq(customPricing.roleOwnerId, roleOwnerId),
              eq(customPricing.role, role)
            )
          ).limit(1);
          if (existing) {
            await db.update(customPricing).set({
              sellingPrice,
              profit: profit || null,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(
              and(
                eq(customPricing.productId, productId),
                eq(customPricing.roleOwnerId, roleOwnerId),
                eq(customPricing.role, role)
              )
            );
          } else {
            await db.insert(customPricing).values({
              productId,
              roleOwnerId,
              role,
              sellingPrice,
              profit: profit || null,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            });
          }
        } catch (error) {
          throw new Error("Failed to update custom pricing");
        }
      }
      async deleteCustomPricing(productId, roleOwnerId, role) {
        try {
          await db.delete(customPricing).where(
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
      async getStoredProfit(productId, roleOwnerId, role) {
        try {
          const [result] = await db.select({ profit: customPricing.profit }).from(customPricing).where(
            and(
              eq(customPricing.productId, productId),
              eq(customPricing.roleOwnerId, roleOwnerId),
              eq(customPricing.role, role)
            )
          ).limit(1);
          return result?.profit || null;
        } catch (error) {
          return null;
        }
      }
      async getCustomPrice(productId, roleOwnerId, role) {
        try {
          console.log(`[Storage] getCustomPrice called: productId=${productId}, roleOwnerId=${roleOwnerId}, role=${role}`);
          const [result] = await db.select({
            sellingPrice: customPricing.sellingPrice
          }).from(customPricing).where(
            and(
              eq(customPricing.productId, productId),
              eq(customPricing.roleOwnerId, roleOwnerId),
              eq(customPricing.role, role)
            )
          ).limit(1);
          console.log(`[Storage] getCustomPrice result: ${result?.sellingPrice || null}`);
          return result?.sellingPrice || null;
        } catch (error) {
          console.log(`[Storage] getCustomPrice error: ${error}`);
          return null;
        }
      }
      // Admin Base Prices
      async getAdminBasePrice(productId) {
        try {
          const [result] = await db.select({
            basePrice: adminBasePrices.basePrice
          }).from(adminBasePrices).where(eq(adminBasePrices.productId, productId)).limit(1);
          return result?.basePrice || null;
        } catch (error) {
          return null;
        }
      }
      async setAdminBasePrice(productId, basePrice) {
        const priceNum = parseFloat(basePrice);
        if (isNaN(priceNum) || priceNum < 0) {
          throw new Error("Invalid base price");
        }
        try {
          const [existing] = await db.select().from(adminBasePrices).where(eq(adminBasePrices.productId, productId)).limit(1);
          if (existing) {
            await db.update(adminBasePrices).set({
              basePrice,
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq(adminBasePrices.productId, productId));
          } else {
            await db.insert(adminBasePrices).values({
              productId,
              basePrice,
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            });
          }
        } catch (error) {
          throw new Error("Failed to update admin base price");
        }
      }
      // Price Resolution (combines custom + admin base price)
      async getResolvedPrice(productId, roleOwnerId, role) {
        const customPrice = await this.getCustomPrice(productId, roleOwnerId, role);
        if (customPrice) {
          return customPrice;
        }
        return await this.getRoleBasePrice(productId, role);
      }
      async getRoleBasePrices() {
        try {
          const bundles = await db.select({
            id: dataBundles.id,
            basePrice: dataBundles.basePrice,
            agentPrice: dataBundles.agentPrice,
            dealerPrice: dataBundles.dealerPrice,
            superDealerPrice: dataBundles.superDealerPrice,
            masterPrice: dataBundles.masterPrice,
            adminPrice: dataBundles.adminPrice
          }).from(dataBundles).where(eq(dataBundles.isActive, true));
          const prices = [];
          bundles.forEach((bundle) => {
            prices.push({
              bundleId: bundle.id,
              role: "admin",
              basePrice: bundle.adminPrice || bundle.basePrice || "0"
            });
            prices.push({
              bundleId: bundle.id,
              role: "agent",
              basePrice: bundle.agentPrice || bundle.basePrice || "0"
            });
            prices.push({
              bundleId: bundle.id,
              role: "dealer",
              basePrice: bundle.dealerPrice || bundle.basePrice || "0"
            });
            prices.push({
              bundleId: bundle.id,
              role: "super_dealer",
              basePrice: bundle.superDealerPrice || bundle.basePrice || "0"
            });
            prices.push({
              bundleId: bundle.id,
              role: "master",
              basePrice: bundle.masterPrice || bundle.basePrice || "0"
            });
          });
          return prices;
        } catch (error) {
          return [];
        }
      }
      async setRoleBasePrice(bundleId, role, basePrice, userRole) {
        if (userRole !== "admin") {
          throw new Error("Only admin can set role base prices");
        }
        try {
          switch (role) {
            case "admin":
              await db.update(dataBundles).set({ adminPrice: basePrice }).where(eq(dataBundles.id, bundleId));
              break;
            case "agent":
              await db.update(dataBundles).set({ agentPrice: basePrice }).where(eq(dataBundles.id, bundleId));
              break;
            case "dealer":
              await db.update(dataBundles).set({ dealerPrice: basePrice }).where(eq(dataBundles.id, bundleId));
              break;
            case "super_dealer":
              await db.update(dataBundles).set({ superDealerPrice: basePrice }).where(eq(dataBundles.id, bundleId));
              break;
            case "master":
              await db.update(dataBundles).set({ masterPrice: basePrice }).where(eq(dataBundles.id, bundleId));
              break;
            default:
              throw new Error(`Invalid role: ${role}`);
          }
        } catch (error) {
          throw error;
        }
      }
      async getRoleBasePrice(bundleId, role) {
        try {
          const [rolePrice] = await db.select({
            basePrice: roleBasePrices.basePrice
          }).from(roleBasePrices).where(and(
            eq(roleBasePrices.bundleId, bundleId),
            eq(roleBasePrices.role, role)
          )).limit(1);
          if (rolePrice?.basePrice) {
            return rolePrice.basePrice;
          }
          let result;
          switch (role) {
            case "admin":
              [result] = await db.select({ price: dataBundles.adminPrice }).from(dataBundles).where(eq(dataBundles.id, bundleId)).limit(1);
              break;
            case "agent":
              [result] = await db.select({ price: dataBundles.agentPrice }).from(dataBundles).where(eq(dataBundles.id, bundleId)).limit(1);
              break;
            case "dealer":
              [result] = await db.select({ price: dataBundles.dealerPrice }).from(dataBundles).where(eq(dataBundles.id, bundleId)).limit(1);
              break;
            case "super_dealer":
              [result] = await db.select({ price: dataBundles.superDealerPrice }).from(dataBundles).where(eq(dataBundles.id, bundleId)).limit(1);
              break;
            case "master":
              [result] = await db.select({ price: dataBundles.masterPrice }).from(dataBundles).where(eq(dataBundles.id, bundleId)).limit(1);
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
      async getTopCustomers(limit = 10) {
        try {
          const allCustomerEmails = await db.select({
            email: transactions.customerEmail
          }).from(transactions).where(and(
            eq(transactions.status, "completed"),
            isNotNull(transactions.customerEmail),
            ne(transactions.customerEmail, "")
          )).groupBy(transactions.customerEmail);
          const emailList = allCustomerEmails.map((row) => row.email).filter(Boolean);
          let filteredEmails = [];
          if (emailList.length > 0) {
            const userRoles = await db.select({
              email: users.email,
              role: users.role
            }).from(users).where(inArray(users.email, emailList));
            const agentEmails = new Set(
              userRoles.filter((user) => user.role && !["user", "guest"].includes(user.role)).map((user) => user.email)
            );
            filteredEmails = emailList.filter((email) => !agentEmails.has(email));
          }
          let customerStats = [];
          if (filteredEmails.length > 0) {
            customerStats = await db.select({
              customerEmail: transactions.customerEmail,
              customerPhone: max(transactions.customerPhone),
              totalPurchases: count(),
              totalSpent: sql`coalesce(sum(cast(${transactions.amount} as numeric)), 0)`,
              lastPurchase: max(transactions.createdAt)
            }).from(transactions).where(and(
              eq(transactions.status, "completed"),
              inArray(transactions.customerEmail, filteredEmails)
            )).groupBy(transactions.customerEmail);
          }
          const customerEmails = customerStats.map((stat) => stat.customerEmail).filter(Boolean);
          let userRecords = [];
          if (customerEmails.length > 0) {
            userRecords = await db.select({
              email: users.email,
              name: users.name
            }).from(users).where(inArray(users.email, customerEmails));
          }
          const userMap = new Map(userRecords.map((user) => [user.email, user.name]));
          const sortedCustomers = customerStats.map((stat) => ({
            customerEmail: stat.customerEmail,
            customerPhone: stat.customerPhone || null,
            customerName: userMap.get(stat.customerEmail) || null,
            totalPurchases: Number(stat.totalPurchases) || 0,
            totalSpent: Number(stat.totalSpent) || 0,
            lastPurchase: stat.lastPurchase
          })).sort((a, b) => {
            if (b.totalSpent !== a.totalSpent) {
              return b.totalSpent - a.totalSpent;
            }
            return b.totalPurchases - a.totalPurchases;
          }).slice(0, limit).map((customer, index2) => ({
            ...customer,
            rank: index2 + 1,
            lastPurchase: customer.lastPurchase ? customer.lastPurchase.toISOString() : (/* @__PURE__ */ new Date()).toISOString()
          }));
          return sortedCustomers;
        } catch (error) {
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
          ...announcement
        }).returning();
        return result[0];
      }
      async updateAnnouncement(id, data) {
        const result = await db.update(announcements).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(announcements.id, id)).returning();
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
        if (filters?.category) conditions.push(eq(videoGuides.category, filters.category));
        if (filters?.publishedOnly) conditions.push(eq(videoGuides.isPublished, true));
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
          id: randomUUID2(),
          ...guide
        }).returning();
        return created;
      }
      async updateVideoGuide(id, data) {
        const [updated] = await db.update(videoGuides).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(videoGuides.id, id)).returning();
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
          ...apiKey
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
          await db.update(settings).set({ value, description, updatedAt: /* @__PURE__ */ new Date() }).where(eq(settings.key, key));
        } else {
          await db.insert(settings).values({ key, value, description });
        }
      }
      async getAllSettings() {
        const result = await db.select().from(settings);
        return result.map((setting) => ({
          key: setting.key,
          value: setting.value,
          description: setting.description || void 0
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
        const result = await db.select().from(externalApiProviders).where(eq(externalApiProviders.isDefault, true)).limit(1);
        return result[0];
      }
      async getProviderForNetwork(network) {
        if (!network) {
          return await this.getDefaultExternalApiProvider();
        }
        const activeProviders = await this.getActiveExternalApiProviders();
        for (const provider of activeProviders) {
          if (provider.networkMappings) {
            try {
              const mappings = JSON.parse(provider.networkMappings);
              if (mappings[network]) {
                return provider;
              }
            } catch (e) {
              continue;
            }
          }
        }
        return await this.getDefaultExternalApiProvider();
      }
      async createExternalApiProvider(provider) {
        if (provider.isDefault) {
          await db.update(externalApiProviders).set({ isDefault: false }).where(eq(externalApiProviders.isDefault, true));
        }
        const [created] = await db.insert(externalApiProviders).values({
          id: randomUUID2(),
          ...provider
        }).returning();
        return created;
      }
      async updateExternalApiProvider(id, data) {
        if (data.isDefault) {
          await db.update(externalApiProviders).set({ isDefault: false }).where(eq(externalApiProviders.isDefault, true));
        }
        const result = await db.update(externalApiProviders).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(externalApiProviders.id, id)).returning();
        return result[0];
      }
      async deleteExternalApiProvider(id) {
        const result = await db.delete(externalApiProviders).where(eq(externalApiProviders.id, id));
        return (result.rowCount ?? 0) > 0;
      }
      async setDefaultExternalApiProvider(id) {
        await db.update(externalApiProviders).set({ isDefault: false }).where(eq(externalApiProviders.isDefault, true));
        await db.update(externalApiProviders).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(externalApiProviders.id, id));
      }
      // ============================================
      // WALLET TOP-UP TRANSACTIONS
      // ============================================
      async createWalletTopupTransaction(topup) {
        const [created] = await db.insert(walletTopupTransactions).values({
          id: randomUUID2(),
          ...topup
        }).returning();
        return created;
      }
      async getWalletTopupTransactions(filters) {
        const conditions = [];
        if (filters?.userId) conditions.push(eq(walletTopupTransactions.userId, filters.userId));
        if (filters?.adminId) conditions.push(eq(walletTopupTransactions.adminId, filters.adminId));
        let query = db.select().from(walletTopupTransactions);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        return query.orderBy(desc(walletTopupTransactions.createdAt));
      }
      async updateWalletTopupTransaction(id, data) {
        const [updated] = await db.update(walletTopupTransactions).set(data).where(eq(walletTopupTransactions.id, id)).returning();
        return updated;
      }
      // ============================================
      // WALLET DEDUCTION TRANSACTIONS
      // ============================================
      async createWalletDeductionTransaction(deduction) {
        const [created] = await db.insert(walletDeductionTransactions).values({
          id: randomUUID2(),
          ...deduction
        }).returning();
        return created;
      }
      async getWalletDeductionTransactions(filters) {
        const conditions = [];
        if (filters?.userId) conditions.push(eq(walletDeductionTransactions.userId, filters.userId));
        if (filters?.adminId) conditions.push(eq(walletDeductionTransactions.adminId, filters.adminId));
        let query = db.select().from(walletDeductionTransactions);
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        return query.orderBy(desc(walletDeductionTransactions.createdAt));
      }
      // ============================================
      // CRON JOB HELPERS
      // ============================================
      async getTransactionsByStatusAndDelivery(status, deliveryStatus) {
        const statusList = Array.isArray(status) ? status : [status];
        const deliveryList = Array.isArray(deliveryStatus) ? deliveryStatus : [deliveryStatus];
        return db.select().from(transactions).where(and(
          inArray(transactions.status, statusList),
          inArray(transactions.deliveryStatus, deliveryList),
          eq(transactions.type, "data_bundle")
          // Only data bundle transactions
        )).orderBy(desc(transactions.createdAt));
      }
      async getFailedTransactionsOlderThan(cutoffDate) {
        return db.select().from(transactions).where(and(
          eq(transactions.deliveryStatus, "failed"),
          eq(transactions.type, "data_bundle"),
          lt(transactions.createdAt, cutoffDate)
        )).orderBy(desc(transactions.createdAt));
      }
      // Get current Paystack balance from database
      async getPaystackBalance() {
        try {
          return 0;
        } catch (error) {
          return 0;
        }
      }
      // Update Paystack balance in database
      async setPaystackBalance(balance) {
        try {
        } catch (error) {
        }
      }
    };
    storage = new DatabaseStorage();
  }
});

// src/server/paystack.ts
var paystack_exports = {};
__export(paystack_exports, {
  createTransferRecipient: () => createTransferRecipient,
  initializePayment: () => initializePayment,
  initiateTransfer: () => initiateTransfer,
  isPaystackConfigured: () => isPaystackConfigured,
  isPaystackTestMode: () => isPaystackTestMode,
  resolveBankAccount: () => resolveBankAccount,
  validateWebhookSignature: () => validateWebhookSignature,
  verifyPayment: () => verifyPayment,
  verifyTransfer: () => verifyTransfer
});
import crypto from "crypto";
async function getPaystackKey() {
  const env = process.env.PAYSTACK_SECRET_KEY || "";
  if (env) return env;
  const stored = await storage.getSetting("paystack.secret_key");
  return stored || "";
}
async function isPaystackTestMode() {
  const key = await getPaystackKey();
  return key.startsWith("sk_test_");
}
async function initializePayment(params) {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  if (!params.email || typeof params.email !== "string" || !params.email.includes("@")) {
    throw new Error("Invalid email address");
  }
  if (!params.amount || typeof params.amount !== "number" || params.amount <= 0) {
    throw new Error("Invalid amount");
  }
  if (!params.reference || typeof params.reference !== "string" || params.reference.length < 5) {
    throw new Error("Invalid reference");
  }
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount),
      // Amount already in pesewas from caller
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata
    })
  });
  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize payment");
  }
  return data;
}
async function verifyPayment(reference) {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1e4);
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to verify payment");
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Payment verification timed out. Please try again.");
    }
    throw error;
  }
}
async function validateWebhookSignature(rawBody, signature) {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY || !signature) {
    return false;
  }
  const hash2 = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  return hash2 === signature;
}
async function isPaystackConfigured() {
  const key = await getPaystackKey();
  return !!key;
}
async function resolveBankAccount(accountNumber, bankCode) {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  if (!accountNumber || !bankCode) {
    throw new Error("Account number and bank code are required");
  }
  const response = await fetch(`${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to resolve bank account");
  }
  return data;
}
async function createTransferRecipient(params) {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  if (!params.name || !params.account_number || !params.bank_code) {
    throw new Error("Missing required recipient details");
  }
  const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: params.type,
      name: params.name,
      account_number: params.account_number,
      bank_code: params.bank_code,
      currency: params.currency || "GHS"
    })
  });
  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to create transfer recipient");
  }
  return data;
}
async function initiateTransfer(params) {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  if (!params.amount || params.amount <= 0) {
    throw new Error("Invalid transfer amount");
  }
  if (!params.recipient) {
    throw new Error("Recipient code is required");
  }
  const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      source: params.source,
      amount: Math.round(params.amount * 100),
      // Convert to pesewas
      recipient: params.recipient,
      reason: params.reason || "Agent withdrawal",
      reference: params.reference
    })
  });
  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.message || "Failed to initiate transfer");
  }
  return data;
}
async function verifyTransfer(reference) {
  const PAYSTACK_SECRET_KEY = await getPaystackKey();
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("Paystack secret key not configured");
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1e4);
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to verify transfer");
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Transfer verification timed out. Please try again.");
    }
    throw error;
  }
}
var PAYSTACK_BASE_URL;
var init_paystack = __esm({
  "src/server/paystack.ts"() {
    init_storage();
    PAYSTACK_BASE_URL = "https://api.paystack.co";
  }
});

// src/server/utils/pdf-generator.ts
var pdf_generator_exports = {};
__export(pdf_generator_exports, {
  generateResultCheckerPDF: () => generateResultCheckerPDF,
  saveResultCheckerPDF: () => saveResultCheckerPDF
});
import PDFDocument from "pdfkit";
import fs from "fs";
function generateResultCheckerPDF(data) {
  return new Promise((resolve, reject) => {
    try {
      const isMultiple = data.pins && data.pins.length > 1;
      const pins = data.pins || (data.pin && data.serialNumber ? [{ pin: data.pin, serialNumber: data.serialNumber }] : []);
      const doc = new PDFDocument({
        size: [252, 144],
        margin: 0,
        info: {
          Title: `${data.type.toUpperCase()} Result Checker ${data.year}`,
          Author: "resellershubprogh.com",
          Subject: "Result Checker Credentials"
        }
      });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);
      pins.forEach((pinData, index2) => {
        if (index2 > 0) {
          doc.addPage();
        }
        const cardWidth = 252;
        const cardHeight = 144;
        const margin = 10;
        doc.roundedRect(2, 2, cardWidth - 4, cardHeight - 4, 3).stroke("#000000");
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#000000").text("RESELLERS HUB PRO", margin, 8, { align: "center", width: cardWidth - margin * 2 });
        doc.fontSize(7).font("Helvetica").fillColor("#333333").text(`${data.type.toUpperCase()} ${data.year} RESULT CHECKER`, margin, 22, { align: "center", width: cardWidth - margin * 2 });
        if (isMultiple) {
          doc.fontSize(6).fillColor("#666666").text(`Card ${index2 + 1} of ${pins.length}`, margin, 32, { align: "center", width: cardWidth - margin * 2 });
        }
        doc.moveTo(margin, 40).lineTo(cardWidth - margin, 40).stroke("#cccccc");
        let yPos = 52;
        doc.fontSize(7).font("Helvetica-Bold").fillColor("#666666").text("SERIAL NUMBER: ", margin, yPos, { continued: true }).fillColor("#000000").text(pinData.serialNumber);
        yPos += 14;
        doc.fontSize(7).font("Helvetica-Bold").fillColor("#666666").text("PIN: ", margin, yPos, { continued: true }).fillColor("#000000").text(pinData.pin);
        const footerY = cardHeight - 18;
        doc.moveTo(margin, footerY - 3).lineTo(cardWidth - margin, footerY - 3).stroke("#cccccc");
        doc.fontSize(5).font("Helvetica").fillColor("#666666").text(`Ref: ${data.transactionReference} | ${data.purchaseDate.toLocaleDateString()}`, margin, footerY, { align: "center", width: cardWidth - margin * 2 });
        doc.fontSize(5).fillColor("#999999").text("www.resellershubprogh.com", margin, footerY + 8, { align: "center", width: cardWidth - margin * 2 });
      });
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
async function saveResultCheckerPDF(data, filePath) {
  const pdfBuffer = await generateResultCheckerPDF(data);
  await fs.promises.writeFile(filePath, pdfBuffer);
}
var init_pdf_generator = __esm({
  "src/server/utils/pdf-generator.ts"() {
  }
});

// client/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __dirname2, vite_config_default;
var init_vite_config = __esm({
  "client/vite.config.js"() {
    "use strict";
    __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
    vite_config_default = defineConfig({
      base: "/",
      plugins: [
        react({
          jsxRuntime: "automatic",
          jsxImportSource: "react"
        })
        // VitePWA({
        //   registerType: 'autoUpdate',
        //   workbox: {
        //     globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        //   },
        //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        //   manifest: {
        //     name: 'resellershubprogh.com - Data & Result Checker',
        //     short_name: 'ResellersHubPro',
        //     description: 'Buy data bundles and WAEC result checkers instantly. Secure payments via Paystack.',
        //     theme_color: '#0f172a',
        //     icons: [
        //       {
        //         src: 'pwa-192x192.png',
        //         sizes: '192x192',
        //         type: 'image/png'
        //       },
        //       {
        //         src: 'pwa-512x512.png',
        //         sizes: '512x512',
        //         type: 'image/png'
        //       }
        //     ]
        //   }
        // }),
      ],
      resolve: {
        dedupe: ["react", "react-dom"],
        alias: {
          "@": path2.resolve(__dirname2, "src"),
          "@shared": path2.resolve(__dirname2, "../src/shared"),
          "@assets": path2.resolve(__dirname2, "assets")
        }
      },
      root: ".",
      css: {
        // PostCSS configured via tailwind.config.js
      },
      build: {
        outDir: "../dist/public",
        emptyOutDir: true,
        sourcemap: true,
        cssCodeSplit: true,
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
          input: "./index.html",
          output: {
            entryFileNames: "assets/[name].[hash].js",
            chunkFileNames: "assets/[name].[hash].js",
            assetFileNames: "assets/[name].[hash].[ext]",
            manualChunks(id) {
              if (!id)
                return;
              if (id.includes("node_modules")) {
                if (id.includes("jspdf"))
                  return "vendor_jspdf";
                return "vendor";
              }
            }
          }
        }
      },
      server: {
        host: true,
        // bind to all interfaces
        port: Number(process.env.CLIENT_PORT) || 5173,
        strictPort: true,
        allowedHosts: ["resellershubprogh.com", "localhost"],
        watch: { usePolling: true },
        fs: { strict: true, deny: ["**/.*"] },
        hmr: true,
        // Enable HMR for better development experience
        proxy: {
          "/api": {
            target: "http://localhost:10000",
            changeOrigin: true,
            secure: false
          }
        }
      },
      cacheDir: "node_modules/.vite",
      optimizeDeps: {
        include: ["react", "react-dom", "lodash", "jspdf"]
      }
    });
  }
});

// src/server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  setupVite: () => setupVite
});
import { createServer as createViteServer, createLogger } from "vite";
import fs2 from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { nanoid } from "nanoid";
async function setupVite(server, app2) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...clientViteConfig,
    configFile: false,
    root: path3.resolve(path3.dirname(fileURLToPath3(import.meta.url)), "../..", "client"),
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (req.path.startsWith("/api") || req.path.startsWith("/vite-hmr") || req.path.startsWith("/src/") || req.path.startsWith("/@") || req.path.startsWith("/node_modules/") || req.path.includes(".js") || req.path.includes(".css") || req.path.includes(".json") || req.path.includes(".png") || req.path.includes(".ico") || req.path.includes(".svg") || req.path.includes(".woff") || req.path.includes(".woff2") || req.path.includes(".ttf") || req.path.includes(".eot")) {
      return next();
    }
    try {
      const clientTemplate = path3.resolve(
        path3.dirname(fileURLToPath3(import.meta.url)),
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
var clientViteConfig, viteLogger;
var init_vite = __esm({
  "src/server/vite.ts"() {
    init_vite_config();
    clientViteConfig = vite_config_default;
    viteLogger = createLogger();
  }
});

// src/server/index.ts
import dotenv from "dotenv";
import path4 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
import { createClient } from "@supabase/supabase-js";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";

// src/server/routes.ts
init_storage();
init_db();
init_schema();
init_paystack();
import { sql as sql2, and as and2, eq as eq2, or as or2, gte as gte2, lte as lte2, desc as desc2 } from "drizzle-orm";
import { randomUUID as randomUUID3, randomBytes as randomBytes2 } from "crypto";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import multer from "multer";

// src/server/providers.ts
init_storage();
async function fulfillDataBundleTransaction(transaction, providerId) {
  console.log(`[Fulfill] STARTING fulfillment for transaction ${transaction.reference}, type: ${transaction.type}, isBulk: ${transaction.isBulkOrder}`);
  try {
    const network = transaction.network;
    if (!network) {
      return { success: false, error: "No network set on transaction" };
    }
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
      console.log(`[Fulfill] Using specified provider ${providerId}:`, provider ? "FOUND" : "NOT FOUND");
    } else {
      provider = await storage.getDefaultExternalApiProvider();
      console.log(`[Fulfill] Using default provider:`, provider ? "FOUND" : "NOT FOUND");
    }
    let apiKey, apiSecret, apiEndpoint;
    if (!provider) {
      console.log(`[Fulfill] No database provider found, checking environment variables...`);
      apiKey = process.env.SKYTECH_API_KEY;
      apiSecret = process.env.SKYTECH_API_SECRET;
      apiEndpoint = process.env.SKYTECH_API_ENDPOINT || "https://skytechgh.com/api/v1/orders";
      if (!apiKey || !apiSecret) {
        console.error(`[Fulfill] No external API provider configured and missing environment variables SKYTECH_API_KEY/SKYTECH_API_SECRET`);
        return { success: false, error: "No external API provider configured. Please set SKYTECH_API_KEY and SKYTECH_API_SECRET environment variables or configure a provider in the database." };
      }
      console.log(`[Fulfill] Using environment variables - endpoint: ${apiEndpoint}`);
    } else {
      if (!provider.isActive) {
        console.error(`[Fulfill] External API provider is not active`);
        return { success: false, error: "External API provider is not active" };
      }
      apiKey = provider.apiKey;
      apiSecret = provider.apiSecret;
      apiEndpoint = provider.endpoint;
      console.log(`[Fulfill] Provider details:`, {
        name: provider.name,
        endpoint: provider.endpoint,
        hasApiKey: !!provider.apiKey,
        hasApiSecret: !!provider.apiSecret
      });
    }
    let networkMappings = {};
    if (provider && provider.networkMappings) {
      try {
        networkMappings = JSON.parse(provider.networkMappings);
      } catch (e) {
        console.warn("Failed to parse network mappings, using defaults");
      }
    } else {
      networkMappings = {
        "mtn": "MTN",
        "telecel": "TELECEL",
        "at_bigtime": "AT_BIGTIME",
        "at_ishare": "AT_ISHARE",
        "airteltigo": "AIRTELTIGO"
      };
    }
    networkMappings["at_bigtime"] = "AT_BIGTIME";
    networkMappings["at_ishare"] = "AT_ISHARE";
    let phoneData = [];
    if (transaction.phoneNumbers) {
      if (Array.isArray(transaction.phoneNumbers)) {
        phoneData = transaction.phoneNumbers;
        console.log("[Fulfill] phoneNumbers is already an array");
      } else if (typeof transaction.phoneNumbers === "string") {
        console.log("[Fulfill] phoneNumbers is a string, attempting to parse");
        try {
          phoneData = JSON.parse(transaction.phoneNumbers);
          console.log("[Fulfill] Successfully parsed phoneNumbers string");
        } catch (e) {
          const error = e;
          console.warn("Failed to parse phoneNumbers JSON string:", error.message);
          console.warn("Raw phoneNumbers string:", transaction.phoneNumbers);
          phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || "1" }];
        }
      } else {
        console.log("[Fulfill] phoneNumbers is neither array nor string:", typeof transaction.phoneNumbers);
        phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || "1" }];
      }
    } else {
      console.log("[Fulfill] No phoneNumbers found in transaction");
      phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || "1" }];
    }
    console.log("[Fulfill] transaction.phoneNumbers:", transaction.phoneNumbers);
    console.log("[Fulfill] phoneData length:", phoneData.length);
    console.log("[Fulfill] Processing phone data");
    if (phoneData.length === 0) {
      console.log("[Fulfill] phoneData is empty, using fallback for single order");
      phoneData = [{ phone: transaction.customerPhone, dataAmount: transaction.productName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || "1" }];
      console.log("[Fulfill] Using fallback phone data");
    }
    console.log(`[Fulfill] Starting to process ${phoneData.length} items`);
    const results = [];
    for (let i = 0; i < phoneData.length; i++) {
      const item = phoneData[i];
      console.log(`[Fulfill] Processing item ${i + 1}/${phoneData.length}:`, item);
      const phone = item.phone;
      const dataAmount = item.dataAmount || item.bundleName?.match(/(\d+(?:\.\d+)?)\s*(?:GB|MB)/i)?.[1] || "1";
      console.log(`[Fulfill] Item dataAmount: ${dataAmount}, bundleName: ${item.bundleName}`);
      const numAmount = parseFloat(dataAmount);
      const capacity = numAmount;
      console.log(`[Fulfill] Calculated capacity: ${capacity} GB`);
      const apiNetwork = networkMappings[network] || network.toUpperCase();
      const idempotencyKey = `${transaction.reference}-${phone}`;
      const body = JSON.stringify({
        network: apiNetwork,
        recipient: phone,
        capacity: Math.round(capacity),
        idempotency_key: idempotencyKey
      });
      console.log(`[Fulfill] API request body:`, body);
      const ts = Math.floor(Date.now() / 1e3).toString();
      const method = "POST";
      const path5 = "/api/v1/orders";
      const message = `${ts}
${method}
${path5}
${body}`;
      const crypto2 = await import("crypto");
      const signature = crypto2.createHmac("sha256", apiSecret).update(message).digest("hex");
      console.log(`[Fulfill] Making API call for phone: ${phone}`);
      console.log(`[Fulfill] Signature message: ${message}`);
      console.log(`[Fulfill] Generated signature: ${signature}`);
      try {
        const resp = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "X-Timestamp": ts,
            "X-Signature": signature,
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://resellershubprogh.com"
          },
          body
        });
        console.log(`[Fulfill] API response status for ${phone}: ${resp.status}`);
        const data = await resp.json().catch(() => ({ status: resp.ok ? "success" : "failed" }));
        if (resp.ok && (data.status === "success" || data.status === "queued") && data.ref) {
          results.push({
            phone,
            status: "pending",
            ref: data.ref,
            price: data.price,
            providerResponse: data
          });
          console.log(`[Fulfill] Success for ${phone}: ${data.ref}`);
        } else {
          results.push({
            phone,
            status: "failed",
            error: data.error || data.message || "Provider rejected request",
            providerResponse: data
          });
          console.log(`[Fulfill] Failed for ${phone}:`, data);
        }
      } catch (e) {
        console.error(`[Fulfill] Exception for ${phone}:`, e.message);
        results.push({ phone, status: "failed", error: e.message });
      }
    }
    console.log("[Fulfill] Final results length:", results.length);
    console.log("[Fulfill] Final results:", results);
    return { success: true, provider: "skytechgh", results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function getExternalBalance(providerId) {
  try {
    console.log("[getExternalBalance] Called with providerId:", providerId);
    let provider;
    if (providerId) {
      console.log("[getExternalBalance] Looking up provider by ID:", providerId);
      provider = await storage.getExternalApiProvider(providerId);
      console.log("[getExternalBalance] Found provider:", provider ? "YES" : "NO");
    } else {
      console.log("[getExternalBalance] Looking up default provider");
      provider = await storage.getDefaultExternalApiProvider();
      console.log("[getExternalBalance] Found default provider:", provider ? "YES" : "NO");
    }
    let apiKey, apiSecret, baseUrl;
    if (!provider) {
      console.log("[getExternalBalance] No database provider found, checking environment variables...");
      apiKey = process.env.SKYTECH_API_KEY;
      apiSecret = process.env.SKYTECH_API_SECRET;
      baseUrl = process.env.SKYTECH_API_ENDPOINT?.replace("/api/v1/orders", "") || "https://skytechgh.com";
      if (!apiKey || !apiSecret) {
        console.log("[getExternalBalance] Missing environment variables SKYTECH_API_KEY/SKYTECH_API_SECRET");
        return { success: false, error: "No external API provider configured. Please set SKYTECH_API_KEY and SKYTECH_API_SECRET environment variables or configure a provider in the database." };
      }
    } else {
      if (!provider.isActive) {
        console.log("[getExternalBalance] Provider is not active");
        return { success: false, error: "External API provider is not active" };
      }
      apiKey = provider.apiKey;
      apiSecret = provider.apiSecret;
      baseUrl = provider.endpoint.replace("/api/v1/orders", "");
    }
    console.log("[getExternalBalance] Using baseUrl:", baseUrl);
    const ts = Math.floor(Date.now() / 1e3).toString();
    const method = "GET";
    const path5 = "/api/v1/balance";
    const body = "";
    const message = `${ts}
${method}
${path5}
${body}`;
    const crypto2 = await import("crypto");
    const signature = crypto2.createHmac("sha256", apiSecret).update(message).digest("hex");
    const resp = await fetch(`${baseUrl}${path5}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Timestamp": ts,
        "X-Signature": signature,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://resellershubprogh.com"
      }
    });
    const rawText = await resp.text();
    let data;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseErr) {
      const snippet = rawText?.slice(0, 500) || "";
      console.error(`[getExternalBalance] Invalid JSON response (status ${resp.status}):`, snippet);
      return { success: false, error: `Invalid JSON response (status ${resp.status}): ${snippet}` };
    }
    if (resp.ok) {
      return { success: true, balance: data.balance, celebrate: data.celebrate };
    } else {
      return { success: false, error: data.error || data.message || `Failed to fetch balance (status ${resp.status})` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function getExternalPrices(network, minCapacity, maxCapacity, effective, providerId) {
  try {
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
    } else {
      provider = await storage.getDefaultExternalApiProvider();
    }
    if (!provider || !provider.isActive) {
      return { success: false, error: "No active external API provider configured" };
    }
    const apiKey = provider.apiKey;
    const apiSecret = provider.apiSecret;
    const baseUrl = provider.endpoint.replace("/api/v1/orders", "");
    const ts = Math.floor(Date.now() / 1e3).toString();
    const method = "GET";
    const path5 = "/api/v1/prices";
    let query = "";
    const params = new URLSearchParams();
    if (network) params.append("network", network);
    if (minCapacity !== void 0) params.append("min_capacity", minCapacity.toString());
    if (maxCapacity !== void 0) params.append("max_capacity", maxCapacity.toString());
    if (effective !== void 0) params.append("effective", effective ? "1" : "0");
    if (params.toString()) query = `?${params.toString()}`;
    const body = "";
    const message = `${ts}
${method}
${path5}
${body}`;
    const crypto2 = await import("crypto");
    const signature = crypto2.createHmac("sha256", apiSecret).update(message).digest("hex");
    const resp = await fetch(`${baseUrl}${path5}${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Timestamp": ts,
        "X-Signature": signature,
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://resellershubprogh.com"
      }
    });
    const data = await resp.json().catch(() => ({ error: "Invalid JSON response" }));
    if (resp.ok) {
      return { success: true, data: data.data, effective: data.effective };
    } else {
      return { success: false, error: data.error || "Failed to fetch prices" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function getExternalOrderStatus(ref, providerId) {
  try {
    let provider;
    if (providerId) {
      provider = await storage.getExternalApiProvider(providerId);
    } else {
      provider = await storage.getDefaultExternalApiProvider();
    }
    if (!provider || !provider.isActive) {
      return { success: false, error: "No active external API provider configured" };
    }
    const apiKey = provider.apiKey;
    const apiSecret = provider.apiSecret;
    const baseUrl = provider.endpoint.replace("/api/v1/orders", "");
    const ts = Math.floor(Date.now() / 1e3).toString();
    const method = "GET";
    const path5 = `/api/v1/orders/${ref}`;
    const body = "";
    const message = `${ts}
${method}
${path5}
${body}`;
    const crypto2 = await import("crypto");
    const signature = crypto2.createHmac("sha256", apiSecret).update(message).digest("hex");
    const resp = await fetch(`${baseUrl}${path5}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "X-Timestamp": ts,
        "X-Signature": signature,
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://resellershubprogh.com"
      }
    });
    const data = await resp.json().catch(() => ({ error: "Invalid JSON response" }));
    if (resp.ok) {
      return { success: true, order: data };
    } else {
      return { success: false, error: data.error || "Failed to fetch order status" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// src/server/utils/api-keys.ts
import { randomBytes, createHash, timingSafeEqual } from "crypto";
function generateSecureApiKey(prefix = "sk") {
  const randomPart = randomBytes(32).toString("hex");
  const timestamp2 = Date.now().toString(36);
  return `${prefix}_${timestamp2}_${randomPart}`;
}
function hasPermissions(keyPermissions, requiredPermissions) {
  try {
    const permissions = JSON.parse(keyPermissions);
    return requiredPermissions.every((perm) => permissions[perm] === true);
  } catch {
    return false;
  }
}
var keyGenerationAttempts = /* @__PURE__ */ new Map();
function cleanupRateLimitRecords() {
  const now = Date.now();
  for (const [userId, record] of keyGenerationAttempts.entries()) {
    if (now > record.resetAt) {
      keyGenerationAttempts.delete(userId);
    }
  }
}
setInterval(cleanupRateLimitRecords, 60 * 60 * 1e3);

// src/server/routes.ts
init_network_validator();
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const supabase = getSupabaseServer();
    if (!supabase) {
      return res.status(500).json({ error: "Authentication service unavailable" });
    }
    let user;
    let { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    if (error || !supabaseUser) {
      try {
        const decoded = jwt.decode(token);
        if (decoded?.sub) {
          const { data: adminData, error: adminError } = await supabase.auth.admin.getUserById(decoded.sub);
          if (adminError || !adminData?.user) {
            return res.status(401).json({ error: "Invalid token" });
          }
          user = adminData.user;
        } else {
          return res.status(401).json({ error: "Invalid token" });
        }
      } catch (jwtError) {
        return res.status(401).json({ error: "Invalid token" });
      }
    } else {
      user = supabaseUser;
    }
    let dbUser = await storage.getUser(user.id);
    if (!dbUser && user.email) {
      const existingByEmail = await storage.getUserByEmail(user.email);
      if (existingByEmail) {
        dbUser = existingByEmail;
      }
    }
    if (!dbUser && user.email) {
      try {
        const fallbackRole = user.email === "eleblununana@gmail.com" ? "admin" : user.user_metadata?.role || user.app_metadata?.role || "user";
        dbUser = await storage.createUser({
          id: user.id,
          email: user.email,
          password: "",
          name: user.user_metadata?.name || user.email.split("@")[0],
          phone: user.phone || null,
          role: fallbackRole,
          isActive: true
        });
      } catch (creationError) {
      }
    }
    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = dbUser;
    next();
  } catch (error) {
    res.status(500).json({ error: "Authentication failed" });
  }
}
async function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
var getSupabase = () => getSupabaseServer();
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidPhone(phone) {
  return isValidPhoneLength(phone);
}
var requireAuthJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.substring(7);
    const supabaseServer2 = getSupabase();
    if (!supabaseServer2) {
      return res.status(500).json({ error: "Supabase not configured" });
    }
    let user;
    const { data: { user: supabaseUser }, error } = await supabaseServer2.auth.getUser(token);
    if (error || !supabaseUser || !supabaseUser.email) {
      try {
        const decoded = jwt.decode(token);
        if (decoded?.sub) {
          const { data: adminData, error: adminError } = await supabaseServer2.auth.admin.getUserById(decoded.sub);
          if (adminError || !adminData?.user) {
            return res.status(401).json({ error: "Unauthorized" });
          }
          user = adminData.user;
        } else {
          return res.status(401).json({ error: "Unauthorized" });
        }
      } catch (jwtError) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    } else {
      user = supabaseUser;
    }
    let dbUser = await storage.getUser(user.id);
    if (!dbUser && user.email) {
      const existingByEmail = await storage.getUserByEmail(user.email);
      if (existingByEmail) {
        dbUser = existingByEmail;
      }
    }
    if (!dbUser && user.email) {
      try {
        const fallbackRole = user.email === "eleblununana@gmail.com" ? "admin" : user.user_metadata?.role || user.app_metadata?.role || "user";
        dbUser = await storage.createUser({
          id: user.id,
          email: user.email,
          password: "",
          name: user.user_metadata?.name || user.email.split("@")[0],
          phone: user.phone || null,
          role: fallbackRole,
          isActive: true
        });
      } catch (creationError) {
      }
    }
    if (!dbUser) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = dbUser;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
var requireAdminJWT = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Admin access required" });
    }
    if (req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Admin access required" });
  }
};
var requireAgent = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Agent access required" });
    }
    const agentRoles = [UserRole.AGENT, UserRole.DEALER, UserRole.SUPER_DEALER, UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !agentRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Agent access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Agent access required" });
  }
};
var requireSupport = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Support access required" });
    }
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.AGENT) {
      return res.status(403).json({ error: "Support access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Support access required" });
  }
};
var requireApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "API key required" });
    }
    const key = authHeader.substring(7);
    const apiKey = await storage.getApiKeyByKey(key);
    if (!apiKey || !apiKey.isActive) {
      return res.status(401).json({ error: "Invalid API key" });
    }
    await storage.updateApiKey(apiKey.id, { lastUsed: /* @__PURE__ */ new Date() });
    req.apiKey = apiKey;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid API key" });
  }
};
var requireDealer = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Dealer access required" });
    }
    const dealerRoles = [UserRole.DEALER, UserRole.SUPER_DEALER, UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !dealerRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Dealer access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Dealer access required" });
  }
};
var requireSuperDealer = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Super Dealer access required" });
    }
    const superDealerRoles = [UserRole.SUPER_DEALER, UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !superDealerRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Super Dealer access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Super Dealer access required" });
  }
};
var requireMaster = async (req, res, next) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(403).json({ error: "Master access required" });
    }
    const masterRoles = [UserRole.MASTER, UserRole.ADMIN];
    if (!req.user.role || !masterRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Master access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Master access required" });
  }
};
function generateReference() {
  const timestamp2 = Date.now().toString(36).toUpperCase();
  const random = randomUUID3().split("-")[0].toUpperCase();
  return `TXN-${timestamp2}-${random}`;
}
var ROLE_LABELS = {
  admin: "Admin",
  agent: "Agent",
  dealer: "Dealer",
  super_dealer: "Super Dealer",
  master: "Master",
  user: "User",
  guest: "Guest"
};
async function registerRoutes(httpServer2, app2) {
  app2.get("/api/health", async (req, res) => {
    try {
      let dbStatus = "unknown";
      try {
        await db.execute(sql2`SELECT 1 as test`);
        dbStatus = "connected";
      } catch (e) {
        dbStatus = "error";
      }
      res.json({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        database: dbStatus
      });
    } catch (error) {
      res.status(500).json({ status: "error" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const data = registerSchema.parse(req.body);
      console.log("[REGISTER] Received registration data:", { email: data.email, name: data.name, phone: data.phone });
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      if (!isValidEmail(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      try {
        const existing = await storage.getUserByEmail(data.email);
        if (existing) {
          return res.status(400).json({ error: "Email already registered" });
        }
      } catch (dbError) {
        console.error("Database error checking existing user:", dbError);
        return res.status(500).json({ error: "Database connection failed" });
      }
      const { data: supabaseData, error } = await supabaseServer2.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: UserRole.USER,
            phone: data.phone || null
          }
        }
      });
      if (error || !supabaseData.user) {
        return res.status(400).json({ error: error?.message || "Registration failed" });
      }
      try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        console.log("[REGISTER] Creating user in database:", { email: data.email, phone: data.phone });
        const user = await storage.createUser({
          id: supabaseData.user.id,
          // Use Supabase user ID
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: UserRole.USER
        });
        console.log("[REGISTER] User created successfully:", { id: user.id, email: user.email, phone: user.phone });
        res.status(201).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          access_token: supabaseData.session?.access_token,
          refresh_token: supabaseData.session?.refresh_token
        });
      } catch (dbError) {
        try {
          await supabaseServer2.auth.admin.deleteUser(supabaseData.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Supabase user:", cleanupError);
        }
        return res.status(500).json({ error: "Failed to create user in database" });
      }
    } catch (error) {
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { email, password } = req.body;
      if (!email || !password || typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Email and password are required" });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      const { data, error } = await supabaseServer2.auth.signInWithPassword({
        email,
        password
      });
      if (error || !data.user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (email === "eleblununana@gmail.com") {
        try {
          await supabaseServer2.auth.admin.updateUserById(data.user.id, {
            user_metadata: { ...data.user.user_metadata, role: "admin" },
            app_metadata: { ...data.user.app_metadata, role: "admin" }
          });
        } catch (updateError) {
        }
      }
      let role = email === "eleblununana@gmail.com" ? "admin" : "user";
      let agent = null;
      try {
        const dbUser = await storage.getUserByEmail(email);
        if (dbUser) {
          role = dbUser.role;
          if (dbUser.role === UserRole.AGENT) {
            agent = await storage.getAgentByUserId(dbUser.id);
          }
        } else {
          console.warn("User authenticated but not found in database:", email);
          role = "user";
        }
      } catch (dbError) {
        return res.status(500).json({ error: "Database connection failed" });
      }
      res.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || data.user.email.split("@")[0],
          role,
          phone: data.user.phone || null
        },
        agent: agent ? {
          id: agent.id,
          businessName: agent.businessName,
          storefrontSlug: agent.storefrontSlug,
          balance: agent.balance,
          totalSales: agent.totalSales
        } : null,
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const supabaseServer2 = getSupabase();
        if (supabaseServer2) {
          await supabaseServer2.auth.admin.signOut(token);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Logout failed" });
    }
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.json({ user: null });
      }
      const token = authHeader.substring(7);
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      const { data: userData, error } = await supabaseServer2.auth.getUser(token);
      if (error || !userData?.user || !userData.user.email) {
        try {
          const decoded = jwt.decode(token);
          if (decoded?.sub) {
            const { data: adminData, error: adminError } = await supabaseServer2.auth.admin.getUserById(decoded.sub);
            if (adminError || !adminData?.user) {
              return res.json({ user: null });
            }
            var user = adminData.user;
          } else {
            return res.json({ user: null });
          }
        } catch (jwtError) {
          return res.json({ user: null });
        }
      } else {
        var user = userData.user;
      }
      let role = user.email === "eleblununana@gmail.com" ? "admin" : user.user_metadata?.role || user.app_metadata?.role || "user";
      let agent = null;
      let dbUser = null;
      try {
        dbUser = await storage.getUserByEmail(user.email);
        if (dbUser) {
          role = dbUser.role;
          if (dbUser.role === UserRole.AGENT) {
            agent = await storage.getAgentByUserId(dbUser.id);
          }
        } else {
          try {
            const newUser = await storage.createUser({
              id: user.id,
              // Persist Supabase user ID to avoid FK mismatches
              email: user.email,
              password: "",
              // Password not needed since auth is handled by Supabase
              name: user.user_metadata?.name || user.email.split("@")[0],
              phone: user.user_metadata?.phone || user.phone || null,
              role,
              // Preserve the role determined above (including admin for specific email)
              isActive: true
            });
            dbUser = newUser;
            role = newUser.role;
          } catch (createError) {
          }
        }
      } catch (dbError) {
      }
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split("@")[0],
          role,
          phone: dbUser?.phone || user.user_metadata?.phone || null,
          walletBalance: dbUser?.walletBalance || "0.00"
        },
        agent: agent ? {
          id: agent.id,
          businessName: agent.businessName,
          storefrontSlug: agent.storefrontSlug,
          balance: agent.balance,
          totalSales: agent.totalSales,
          totalProfit: agent.totalProfit,
          isApproved: agent.isApproved
        } : null
      });
    } catch (error) {
      res.json({ user: null });
    }
  });
  app2.post("/api/agent/register", async (req, res) => {
    try {
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const data = agentRegisterSchema.parse(req.body);
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      if (!isValidEmail(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (!isValidPhone(data.phone)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }
      const existingSlug = await storage.getAgentBySlug(data.storefrontSlug);
      if (existingSlug) {
        return res.status(400).json({ error: "Storefront URL already taken" });
      }
      const { data: existingUsers } = await supabaseServer2.auth.admin.listUsers();
      const existingAuthUser = existingUsers?.users?.find((u) => u.email === data.email);
      if (existingAuthUser) {
        const existingAgent = await storage.getAgentByUserId(existingAuthUser.id);
        if (existingAgent) {
          if (existingAgent.isApproved) {
            return res.status(400).json({ error: "This email is already registered and activated as an agent. Please login instead." });
          } else {
            return res.status(400).json({ error: "This email has a pending agent registration. Please complete the activation process or contact support." });
          }
        }
      }
      const activationFee = 60;
      const tempReference = `agent_pending_${Date.now()}_${data.email.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://resellershubprogh.com";
      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: data.email,
          amount: Math.round(activationFee * 100),
          // Convert to pesewas
          currency: "GHS",
          reference: tempReference,
          callback_url: `${frontendUrl}/agent/activation-complete`,
          metadata: {
            purpose: "agent_activation",
            pending_registration: true,
            // Store all registration data in metadata for account creation after payment
            registration_data: {
              email: data.email,
              password: data.password,
              name: data.name,
              phone: data.phone,
              storefrontSlug: data.storefrontSlug,
              businessName: data.businessName,
              businessDescription: data.businessDescription
            }
          }
        })
      });
      const paystackData = await paystackResponse.json();
      if (!paystackData.status) {
        return res.status(500).json({ error: "Payment initialization failed" });
      }
      res.json({
        message: "Please complete payment to activate your agent account",
        paymentUrl: paystackData.data.authorization_url,
        paymentReference: paystackData.data.reference,
        amount: activationFee
      });
    } catch (error) {
      console.error("Error during agent registration:", error.message);
      console.error("Full error:", error);
      console.error("Error stack:", error.stack);
      if (error.code === "23505") {
        return res.status(400).json({ error: "This email or phone number is already registered" });
      }
      if (error.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid registration data",
          details: error.errors
        });
      }
      res.status(500).json({
        error: error.message || "Registration failed",
        details: process.env.NODE_ENV === "development" ? error.stack : void 0
      });
    }
  });
  app2.post("/api/agent/upgrade", requireAuth, async (req, res) => {
    try {
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        console.error("Supabase server client not initialized.");
        return res.status(500).json({ error: "Server configuration error" });
      }
      const user = req.user;
      if (!user || !user.id) return res.status(401).json({ error: "Unauthorized" });
      console.log("Upgrade request for user:", user.id, "email:", user.email);
      let dbUser = await storage.getUserByEmail(user.email);
      if (!dbUser) {
        console.log("User not in database, creating...");
        dbUser = await storage.createUser({
          id: user.id,
          email: user.email,
          password: "",
          name: user.user_metadata?.name || user.email.split("@")[0],
          phone: user.phone || null,
          role: "user",
          isActive: true
        });
        console.log("User created in db:", dbUser.id);
      }
      const { businessName, businessDescription, storefrontSlug } = req.body || {};
      if (!businessName || !storefrontSlug) {
        return res.status(400).json({ error: "Business name and storefront slug are required" });
      }
      const existingAgent = await storage.getAgentByUserId(user.id);
      if (existingAgent) {
        return res.status(400).json({ error: "Your account is already an agent" });
      }
      const slugTaken = await storage.getAgentBySlug(storefrontSlug);
      if (slugTaken) {
        return res.status(400).json({ error: "Storefront URL already taken" });
      }
      console.log("Creating agent for user:", dbUser.id);
      const agent = await storage.createAgent({
        userId: dbUser.id,
        storefrontSlug,
        businessName,
        businessDescription,
        isApproved: false,
        paymentPending: true
      });
      if (!agent) {
        return res.status(500).json({ error: "Failed to create agent record" });
      }
      console.log("Agent created:", agent.id);
      const activationFee = 60;
      const tempReference = `agent_pending_${Date.now()}_${user.id}`;
      const transaction = await storage.createTransaction({
        reference: tempReference,
        type: ProductType.AGENT_ACTIVATION,
        productId: agent.id,
        productName: "Agent Account Activation",
        network: null,
        amount: activationFee.toString(),
        profit: activationFee.toString(),
        customerPhone: user.phone || "",
        customerEmail: user.email || null,
        paymentMethod: "paystack",
        status: TransactionStatus.PROCESSING,
        paymentReference: null,
        agentId: agent.id,
        agentProfit: "0.00"
      });
      console.log("Transaction created:", transaction.id);
      console.log("Initializing Paystack payment...");
      console.log("Making Paystack API call with email:", user.email, "amount:", Math.round(activationFee * 100));
      const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://resellershubprogh.com";
      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(activationFee * 100),
          currency: "GHS",
          reference: tempReference,
          callback_url: `${frontendUrl}/agent/activation-complete`,
          metadata: {
            purpose: "agent_activation",
            agent_id: agent.id,
            transaction_id: transaction.id
          }
        })
      });
      const paystackData = await paystackResponse.json();
      console.log("Paystack response status:", paystackData.status);
      if (!paystackData.status) {
        try {
          await storage.deleteAgent(agent.id);
        } catch (_) {
        }
        try {
          await storage.updateTransaction(transaction.id, { status: TransactionStatus.FAILED });
        } catch (_) {
        }
        return res.status(500).json({ error: "Payment initialization failed" });
      }
      res.json({ paymentUrl: paystackData.data.authorization_url, paymentReference: paystackData.data.reference, amount: activationFee });
      console.log("Payment URL generated successfully");
    } catch (error) {
      console.error("Error during agent upgrade:", error.message);
      console.error("Full error:", error);
      res.status(500).json({ error: error.message || "Upgrade failed" });
    }
  });
  function getDefaultBundlesForNetwork(network) {
    const bundleConfigs = {
      at_bigtime: [
        { name: "Daily Bundle", network: "at_bigtime", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", agentPrice: "1.80", dealerPrice: "1.70", superDealerPrice: "1.60", masterPrice: "1.50", adminPrice: "1.40", isActive: true },
        { name: "Weekly Bundle", network: "at_bigtime", dataAmount: "2GB", validity: "7 Days", basePrice: "8.00", agentPrice: "7.20", dealerPrice: "6.80", superDealerPrice: "6.40", masterPrice: "6.00", adminPrice: "5.60", isActive: true },
        { name: "Monthly Bundle", network: "at_bigtime", dataAmount: "5GB", validity: "30 Days", basePrice: "20.00", agentPrice: "18.00", dealerPrice: "17.00", superDealerPrice: "16.00", masterPrice: "15.00", adminPrice: "14.00", isActive: true }
      ],
      at_ishare: [
        { name: "Daily iShare", network: "at_ishare", dataAmount: "750MB", validity: "1 Day", basePrice: "2.50", agentPrice: "2.25", dealerPrice: "2.13", superDealerPrice: "2.00", masterPrice: "1.88", adminPrice: "1.75", isActive: true },
        { name: "Weekly iShare", network: "at_ishare", dataAmount: "3GB", validity: "7 Days", basePrice: "10.00", agentPrice: "9.00", dealerPrice: "8.50", superDealerPrice: "8.00", masterPrice: "7.50", adminPrice: "7.00", isActive: true },
        { name: "Monthly iShare", network: "at_ishare", dataAmount: "8GB", validity: "30 Days", basePrice: "25.00", agentPrice: "22.50", dealerPrice: "21.25", superDealerPrice: "20.00", masterPrice: "18.75", adminPrice: "17.50", isActive: true }
      ],
      mtn: [
        { name: "MTN 500MB", network: "mtn", dataAmount: "500MB", validity: "1 Day", basePrice: "1.50", agentPrice: "1.35", dealerPrice: "1.28", superDealerPrice: "1.20", masterPrice: "1.13", adminPrice: "1.05", isActive: true },
        { name: "MTN 1GB", network: "mtn", dataAmount: "1GB", validity: "1 Day", basePrice: "3.00", agentPrice: "2.70", dealerPrice: "2.55", superDealerPrice: "2.40", masterPrice: "2.25", adminPrice: "2.10", isActive: true },
        { name: "MTN 2GB", network: "mtn", dataAmount: "2GB", validity: "3 Days", basePrice: "6.00", agentPrice: "5.40", dealerPrice: "5.10", superDealerPrice: "4.80", masterPrice: "4.50", adminPrice: "4.20", isActive: true }
      ],
      telecel: [
        { name: "Telecel 500MB", network: "telecel", dataAmount: "500MB", validity: "1 Day", basePrice: "1.50", agentPrice: "1.35", dealerPrice: "1.28", superDealerPrice: "1.20", masterPrice: "1.13", adminPrice: "1.05", isActive: true },
        { name: "Telecel 1GB", network: "telecel", dataAmount: "1GB", validity: "1 Day", basePrice: "3.00", agentPrice: "2.70", dealerPrice: "2.55", superDealerPrice: "2.40", masterPrice: "2.25", adminPrice: "2.10", isActive: true },
        { name: "Telecel 2GB", network: "telecel", dataAmount: "2GB", validity: "3 Days", basePrice: "6.00", agentPrice: "5.40", dealerPrice: "5.10", superDealerPrice: "4.80", masterPrice: "4.50", adminPrice: "4.20", isActive: true }
      ]
    };
    return bundleConfigs[network] || [];
  }
  app2.get("/api/products/data-bundles", async (req, res) => {
    const network = req.query.network;
    const agentSlug = req.query.agent;
    console.log("[API] /api/products/data-bundles called with network:", network, "agent:", agentSlug);
    try {
      let bundles = await storage.getDataBundles({ network, isActive: true });
      console.log(`[API] Fetched ${bundles.length} bundles for network: ${network}`);
      let pricedBundles;
      if (agentSlug) {
        const agent = await storage.getAgentBySlug(agentSlug);
        if (agent && agent.isApproved) {
          pricedBundles = await Promise.all(bundles.map(async (bundle) => {
            const resolvedPrice = await storage.getResolvedPrice(bundle.id, agent.id, "agent");
            const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
            const basePrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(bundle.basePrice || "0");
            const sellingPrice = resolvedPrice ? parseFloat(resolvedPrice) : basePrice;
            const profit = Math.max(0, sellingPrice - basePrice);
            return {
              ...bundle,
              basePrice: basePrice.toFixed(2),
              effective_price: sellingPrice.toFixed(2),
              profit_margin: profit.toFixed(2)
            };
          }));
        } else {
          pricedBundles = bundles.map((bundle) => ({
            ...bundle,
            basePrice: parseFloat(bundle.adminPrice || bundle.basePrice || "0").toFixed(2),
            effective_price: parseFloat(bundle.adminPrice || bundle.basePrice || "0").toFixed(2),
            profit_margin: "0.00"
          }));
        }
      } else {
        let userRole = "guest";
        let userId;
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const supabaseServer2 = getSupabase();
            if (supabaseServer2) {
              const { data: { user }, error } = await supabaseServer2.auth.getUser(token);
              if (!error && user && user.email) {
                const dbUser = await storage.getUserByEmail(user.email);
                if (dbUser) {
                  userRole = dbUser.role;
                  userId = dbUser.id;
                }
              }
            }
          }
        } catch (authError) {
          console.log("Auth check failed, treating as guest");
        }
        pricedBundles = await Promise.all(bundles.map(async (bundle) => {
          let effectivePrice = parseFloat(bundle.basePrice || "0");
          let profitMargin = "0.00";
          let adminBasePriceValue = parseFloat(bundle.basePrice || "0");
          if (userRole !== "guest" && userId) {
            if (userRole === "agent") {
              console.log(`[Pricing] Agent pricing for bundle ${bundle.id} (${bundle.name})`);
              const agentRoleBasePrice = await storage.getRoleBasePrice(bundle.id, "agent");
              console.log(`[Pricing] Agent role base price from DB: ${agentRoleBasePrice}`);
              if (agentRoleBasePrice) {
                adminBasePriceValue = parseFloat(agentRoleBasePrice);
                console.log(`[Pricing] Using agent role base price: ${adminBasePriceValue}`);
              } else {
                const adminPrice = await storage.getAdminBasePrice(bundle.id);
                adminBasePriceValue = adminPrice ? parseFloat(adminPrice) : parseFloat(bundle.basePrice || "0");
                console.log(`[Pricing] No agent role price found, using admin base price: ${adminBasePriceValue}`);
              }
              const agent = await storage.getAgentByUserId(userId);
              if (agent) {
                console.log(`[Pricing] Found agent: ${agent.id}`);
                const customPrice = await storage.getResolvedPrice(bundle.id, agent.id, "agent");
                console.log(`[Pricing] Custom selling price: ${customPrice}`);
                if (customPrice) {
                  effectivePrice = parseFloat(customPrice);
                  console.log(`[Pricing] Using custom selling price: ${effectivePrice}`);
                } else {
                  effectivePrice = adminBasePriceValue;
                  console.log(`[Pricing] No custom price, using agent role base price as selling price: ${effectivePrice}`);
                }
              } else {
                effectivePrice = adminBasePriceValue;
                console.log(`[Pricing] No agent found, using base price: ${effectivePrice}`);
              }
              profitMargin = (effectivePrice - adminBasePriceValue).toFixed(2);
              console.log(`[Pricing] Final: basePrice=${adminBasePriceValue}, effectivePrice=${effectivePrice}, profit=${profitMargin}`);
            } else {
              const resolvedPrice = await storage.getResolvedPrice(bundle.id, userId, userRole);
              const roleBasePrice = await storage.getRoleBasePrice(bundle.id, userRole);
              if (resolvedPrice) {
                effectivePrice = parseFloat(resolvedPrice);
                if (roleBasePrice) {
                  adminBasePriceValue = parseFloat(roleBasePrice);
                  profitMargin = (effectivePrice - adminBasePriceValue).toFixed(2);
                }
              } else if (roleBasePrice) {
                effectivePrice = parseFloat(roleBasePrice);
                adminBasePriceValue = effectivePrice;
              }
            }
          } else {
            effectivePrice = parseFloat(bundle.basePrice || "0");
            adminBasePriceValue = effectivePrice;
          }
          return {
            ...bundle,
            basePrice: adminBasePriceValue.toFixed(2),
            effective_price: effectivePrice.toFixed(2),
            profit_margin: profitMargin
          };
        }));
      }
      console.log(`[API] Returning ${pricedBundles.length} priced bundles`);
      res.json(pricedBundles);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch data bundles" });
    }
  });
  app2.get("/api/products/networks", async (req, res) => {
    try {
      const networks = await storage.getNetworksWithBasePrices();
      res.json(networks);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch networks" });
    }
  });
  app2.get("/api/agent/check-slug", async (req, res) => {
    try {
      const slug = (req.query.slug || "").toString().toLowerCase();
      if (!slug) return res.status(400).json({ error: "slug is required" });
      if (!/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: "invalid slug format" });
      const existing = await storage.getAgentBySlug(slug);
      res.json({ available: !existing });
    } catch (err) {
      console.error("Error checking slug:", err);
      res.status(500).json({ error: "Failed to check slug" });
    }
  });
  app2.get("/api/products/data-bundles/:id", async (req, res) => {
    try {
      const bundle = await storage.getDataBundle(req.params.id);
      if (!bundle || !bundle.isActive) {
        return res.status(404).json({ error: "Data bundle not found" });
      }
      let userRole = "guest";
      let userId;
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const supabaseServer2 = getSupabase();
          if (supabaseServer2) {
            const { data: { user }, error } = await supabaseServer2.auth.getUser(token);
            if (!error && user && user.email) {
              const dbUser = await storage.getUserByEmail(user.email);
              if (dbUser) {
                userRole = dbUser.role;
                userId = dbUser.id;
              }
            }
          }
        }
      } catch (authError) {
        console.log("Auth check failed, treating as guest");
      }
      let effectivePrice = parseFloat(bundle.basePrice || "0");
      let profitMargin = "0.00";
      let adminBasePriceValue = parseFloat(bundle.basePrice || "0");
      if (userRole !== "guest" && userId) {
        const resolvedPrice = await storage.getResolvedPrice(bundle.id, userId, userRole);
        const roleBasePrice = await storage.getRoleBasePrice(bundle.id, userRole);
        if (resolvedPrice) {
          effectivePrice = parseFloat(resolvedPrice);
          if (roleBasePrice) {
            adminBasePriceValue = parseFloat(roleBasePrice);
            profitMargin = (effectivePrice - adminBasePriceValue).toFixed(2);
          }
        } else if (roleBasePrice) {
          effectivePrice = parseFloat(roleBasePrice);
          adminBasePriceValue = effectivePrice;
        }
      }
      res.json({
        ...bundle,
        basePrice: adminBasePriceValue.toFixed(2),
        effective_price: effectivePrice.toFixed(2),
        profit_margin: profitMargin
      });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch data bundle" });
    }
  });
  app2.get("/api/products/result-checkers/stock", async (req, res) => {
    try {
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2];
      const stock = [];
      for (const year of years) {
        for (const type of ["bece", "wassce"]) {
          const available = await storage.getResultCheckerStock(type, year);
          if (available > 0) {
            const checker = await storage.getAvailableResultChecker(type, year);
            stock.push({
              type,
              year,
              available,
              stock: available,
              price: parseFloat(checker?.basePrice || "0")
            });
          }
        }
      }
      res.json(stock);
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to fetch result checker stock" });
    }
  });
  app2.get("/api/products/result-checkers/info/:type/:year", async (req, res) => {
    try {
      const type = req.params.type;
      const year = parseInt(req.params.year);
      const available = await storage.getResultCheckerStock(type, year);
      if (available === 0) {
        return res.status(404).json({ error: "No stock available" });
      }
      const checker = await storage.getAvailableResultChecker(type, year);
      res.json({
        type,
        year,
        price: parseFloat(checker?.basePrice || "0"),
        stock: available
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch result checker info" });
    }
  });
  app2.get("/api/store/:role/:slug", async (req, res) => {
    try {
      const { role, slug } = req.params;
      const validRoles = ["agent", "dealer", "super_dealer", "master"];
      if (!validRoles.includes(role)) {
        return res.status(404).json({ error: "Invalid store type" });
      }
      let storeData = null;
      let roleOwnerId;
      if (role === "agent") {
        try {
          const agent = await storage.getAgentBySlug(slug);
          if (!agent || !agent.isApproved) {
            console.log(`Storefront not found: slug=${slug}, agent=${!!agent}, approved=${agent?.isApproved}`);
            return res.status(404).json({ error: "Store not found" });
          }
          const user = await storage.getUser(agent.userId);
          storeData = {
            businessName: agent.businessName,
            businessDescription: agent.businessDescription,
            slug: agent.storefrontSlug,
            whatsappSupportLink: agent.whatsappSupportLink,
            whatsappChannelLink: agent.whatsappChannelLink,
            role: "agent"
          };
          roleOwnerId = agent.id;
        } catch (dbError) {
          console.error("Database error in storefront lookup:", dbError);
          return res.status(500).json({ error: "Database error" });
        }
      } else {
        const user = await storage.getUserBySlug(slug, role);
        if (!user) {
          return res.status(404).json({ error: "Store not found" });
        }
        storeData = {
          businessName: `${user.name} (${ROLE_LABELS[role]})`,
          businessDescription: `${ROLE_LABELS[role]} storefront`,
          slug,
          role
        };
        roleOwnerId = user.id;
      }
      const allBundles = await storage.getDataBundles({ isActive: true });
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const resultCheckerStock = [];
      for (const year of [currentYear, currentYear - 1]) {
        for (const type of ["bece", "wassce"]) {
          const available = await storage.getResultCheckerStock(type, year);
          if (available > 0) {
            const checker = await storage.getAvailableResultChecker(type, year);
            const basePrice = parseFloat(checker?.basePrice || "0");
            resultCheckerStock.push({
              type,
              year,
              available,
              price: basePrice.toFixed(2)
            });
          }
        }
      }
      res.json({
        store: storeData,
        // Only expose role-scoped products with resolved pricing
        dataBundles: await Promise.all(allBundles.map(async (b) => {
          const resolvedPrice = await storage.getResolvedPrice(b.id, roleOwnerId, role);
          if (!resolvedPrice) {
            return null;
          }
          return {
            id: b.id,
            name: b.name,
            network: b.network,
            dataAmount: b.dataAmount,
            validity: b.validity,
            apiCode: b.apiCode,
            isActive: b.isActive,
            price: resolvedPrice
          };
        })).then((arr) => arr.filter(Boolean))
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load store" });
    }
  });
  app2.post("/api/store/:slug/register", async (req, res) => {
    try {
      const { slug } = req.params;
      const agent = await storage.getAgentBySlug(slug);
      if (!agent || !agent.isApproved) {
        return res.status(404).json({ error: "Store not found" });
      }
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const data = registerSchema.parse(req.body);
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      if (!isValidEmail(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Supabase not configured" });
      }
      try {
        const existing = await storage.getUserByEmail(data.email);
        if (existing) {
          return res.status(400).json({ error: "Email already registered" });
        }
      } catch (dbError) {
        console.error("Database error checking existing user:", dbError);
        return res.status(500).json({ error: "Database connection failed" });
      }
      const { data: supabaseData, error } = await supabaseServer2.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: UserRole.GUEST,
            phone: data.phone || null,
            referredByAgent: agent.id
            // Track which agent referred this user
          }
        }
      });
      if (error || !supabaseData.user) {
        return res.status(400).json({ error: error?.message || "Registration failed" });
      }
      try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await storage.createUser({
          id: supabaseData.user.id,
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          role: UserRole.GUEST
          // Store users start as GUEST
        });
        res.status(201).json({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          access_token: supabaseData.session?.access_token,
          refresh_token: supabaseData.session?.refresh_token,
          agentStore: slug
          // Return the store slug for frontend to track
        });
      } catch (dbError) {
        console.error("Database error creating user:", dbError);
        try {
          await supabaseServer2.auth.admin.deleteUser(supabaseData.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Supabase user:", cleanupError);
        }
        return res.status(500).json({ error: "Failed to create user in database" });
      }
    } catch (error) {
      console.error("Store registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });
  app2.get("/api/paystack/config", async (req, res) => {
    try {
      const publicKey = await storage.getSetting("paystack.public_key") || process.env.PAYSTACK_PUBLIC_KEY || "";
      const secretKey = await storage.getSetting("paystack.secret_key") || process.env.PAYSTACK_SECRET_KEY || "";
      const isConfigured = !!secretKey;
      const isTestMode = secretKey.startsWith("sk_test_");
      res.json({ publicKey, isConfigured, isTestMode });
    } catch (error) {
      res.status(500).json({ error: "Failed to load paystack config" });
    }
  });
  app2.post("/api/checkout/bulk-upload", requireAuth, multer({ storage: multer.memoryStorage() }).single("excelFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Excel file is required" });
      }
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (!jsonData || jsonData.length === 0) {
        return res.status(400).json({ error: "Excel file is empty or invalid" });
      }
      const requiredColumns = ["phone", "bundleName", "bundleId"];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
      if (missingColumns.length > 0) {
        return res.status(400).json({
          error: `Missing required columns: ${missingColumns.join(", ")}. Expected: phone, bundleName, bundleId`
        });
      }
      const orderItems = [];
      const errors = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNum = i + 2;
        try {
          const phone = row.phone?.toString().trim();
          const bundleName = row.bundleName?.toString().trim();
          const bundleId = row.bundleId?.toString().trim();
          if (!phone || !bundleName || !bundleId) {
            errors.push(`Row ${rowNum}: Missing phone, bundleName, or bundleId`);
            continue;
          }
          const normalizedPhone = normalizePhoneNumber(phone);
          if (!isValidPhoneLength(normalizedPhone)) {
            errors.push(`Row ${rowNum}: Invalid phone number format: ${phone}`);
            continue;
          }
          const bundle = await storage.getDataBundle(bundleId);
          if (!bundle || !bundle.isActive) {
            errors.push(`Row ${rowNum}: Bundle not found or inactive: ${bundleId}`);
            continue;
          }
          const networkFromPhone = detectNetwork(normalizedPhone);
          if (networkFromPhone !== bundle.network) {
            errors.push(`Row ${rowNum}: Phone network (${networkFromPhone}) doesn't match bundle network (${bundle.network})`);
            continue;
          }
          orderItems.push({
            phone: normalizedPhone,
            bundleName,
            bundleId,
            dataAmount: bundleName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i)?.[1] || ""
          });
        } catch (error) {
          errors.push(`Row ${rowNum}: ${error.message}`);
        }
      }
      if (orderItems.length === 0) {
        return res.status(400).json({ error: "No valid order items found in Excel file" });
      }
      const phoneNumbers = orderItems.map((item) => item.phone);
      const duplicatePhones = phoneNumbers.filter((phone, index2) => phoneNumbers.indexOf(phone) !== index2);
      const uniqueDuplicates = [...new Set(duplicatePhones)];
      if (uniqueDuplicates.length > 0) {
        console.error(`[BulkUpload] Duplicate phone numbers found: ${uniqueDuplicates.join(", ")}`);
        return res.status(400).json({
          error: `Duplicate phone numbers detected in bulk upload: ${uniqueDuplicates.join(", ")}. Each phone number can only appear once per bulk purchase.`,
          duplicatePhones: uniqueDuplicates
        });
      }
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const hasAtIshareBundle = orderItems.some((item) => {
        return false;
      });
      let totalAmount = 0;
      const processedOrderItems = [];
      let computedAgentProfit = 0;
      for (const item of orderItems) {
        const bundle = await storage.getDataBundle(item.bundleId);
        if (!bundle) continue;
        if (bundle.network === "at_ishare") {
          return res.status(400).json({ error: "Bulk purchases are not available for AT iShare network" });
        }
        let itemPrice = parseFloat(bundle.basePrice);
        let adminPrice = parseFloat(bundle.adminPrice || bundle.basePrice || "0");
        if (user.role === "agent") {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, "agent");
          if (!resolvedPrice) {
            return res.status(400).json({ error: `No pricing available for bundle ${bundle.name} (${bundle.id}).` });
          }
          itemPrice = parseFloat(resolvedPrice);
          const agent = await storage.getAgentByUserId(user.id);
          if (agent) {
            const storedProfit = await storage.getStoredProfit(bundle.id, agent.id, "agent");
            if (storedProfit) {
              const profitValue = parseFloat(storedProfit);
              computedAgentProfit += Math.max(0, profitValue);
            } else {
              const agentRoleBasePrice = await storage.getRoleBasePrice(bundle.id, "agent");
              let basePrice;
              if (agentRoleBasePrice) {
                basePrice = parseFloat(agentRoleBasePrice);
              } else {
                const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
                basePrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(bundle.basePrice || "0");
              }
              const profit = itemPrice - basePrice;
              computedAgentProfit += Math.max(0, profit);
            }
          }
        } else if (user.role === "dealer") {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, "dealer");
          itemPrice = resolvedPrice ? parseFloat(resolvedPrice) : parseFloat(bundle.basePrice || "0");
        } else if (user.role === "super_dealer") {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, "super_dealer");
          itemPrice = resolvedPrice ? parseFloat(resolvedPrice) : parseFloat(bundle.basePrice || "0");
        } else if (user.role === "master") {
          const resolvedPrice = await storage.getResolvedPrice(bundle.id, user.id, "master");
          itemPrice = resolvedPrice ? parseFloat(resolvedPrice) : parseFloat(bundle.basePrice || "0");
        }
        processedOrderItems.push({
          ...item,
          price: itemPrice
        });
        totalAmount += itemPrice;
      }
      if (user.role !== "guest") {
        const userData = await storage.getUser(user.id);
        if (!userData) {
          return res.status(404).json({ error: "User not found" });
        }
        const walletBalanceCents = Math.round(parseFloat(userData.walletBalance) * 100);
        const totalAmountCents = Math.round(totalAmount * 100);
        if (walletBalanceCents < totalAmountCents) {
          return res.status(400).json({
            error: `Insufficient wallet balance. Required: GHS ${(totalAmountCents / 100).toFixed(2)}, Available: GHS ${(walletBalanceCents / 100).toFixed(2)}`
          });
        }
      }
      const reference = generateReference();
      let bulkNetwork;
      if (processedOrderItems.length > 0) {
        const firstBundle = await storage.getDataBundle(processedOrderItems[0].bundleId);
        if (firstBundle) {
          bulkNetwork = firstBundle.network?.toLowerCase();
        }
      }
      let providerId;
      if (bulkNetwork) {
        const provider = await storage.getProviderForNetwork(bulkNetwork);
        if (provider) {
          providerId = provider.id;
          console.log(`[BulkUpload] Selected provider ${provider.name} (${provider.id}) for network ${bulkNetwork}`);
        }
      }
      const transaction = await storage.createTransaction({
        reference,
        type: "data_bundle",
        productId: null,
        // Bulk order
        productName: `Bulk Data Bundle Purchase (${orderItems.length} items)`,
        network: bulkNetwork || null,
        amount: totalAmount.toFixed(2),
        profit: "0.00",
        // Will be calculated per item
        customerPhone: user.phone || "",
        customerEmail: user.email,
        phoneNumbers: JSON.stringify(processedOrderItems),
        isBulkOrder: true,
        status: "processing",
        agentId: user.role === "agent" ? user.id : void 0,
        agentProfit: user.role === "agent" ? computedAgentProfit.toFixed(2) : "0.00",
        providerId
      });
      if (user.role !== "guest") {
        const userData = await storage.getUser(user.id);
        if (userData) {
          const currentBalanceCents = Math.round(parseFloat(userData.walletBalance) * 100);
          const totalAmountCents = Math.round(totalAmount * 100);
          const newBalanceCents = currentBalanceCents - totalAmountCents;
          const newBalance = newBalanceCents / 100;
          await storage.updateUser(user.id, { walletBalance: newBalance.toFixed(2) });
        }
      }
      await storage.updateTransaction(transaction.id, {
        status: "processing",
        // Set to processing until SkyTech confirms delivery
        completedAt: /* @__PURE__ */ new Date(),
        paymentReference: "wallet",
        paymentStatus: "paid"
      });
      if (user.role === "agent" && parseFloat(transaction.agentProfit || "0") > 0) {
        const agentProfitValue = parseFloat(transaction.agentProfit || "0");
        const adminRevenue = parseFloat((parseFloat(transaction.amount) - agentProfitValue).toFixed(2));
        if (Math.abs(agentProfitValue + adminRevenue - parseFloat(transaction.amount)) > 0.01) {
          console.error("AGENT_PROFIT_MISMATCH detected for transaction", transaction.id);
          throw new Error("AGENT_PROFIT_MISMATCH");
        }
        await storage.updateAgentBalance(user.id, agentProfitValue, true);
        const adminRef = `ADMINREV-${transaction.reference}`;
        await storage.createTransaction({
          reference: adminRef,
          type: "admin_revenue",
          productId: null,
          productName: `Admin revenue for bulk transaction ${transaction.reference}`,
          network: null,
          amount: adminRevenue.toFixed(2),
          profit: "0.00",
          customerPhone: "",
          customerEmail: null,
          isBulkOrder: false,
          status: "completed",
          paymentStatus: "paid"
        });
      }
      const autoProcessingEnabled = await storage.getSetting("data_bundle_auto_processing") === "true";
      if (autoProcessingEnabled) {
        console.log("[BulkUpload] Processing data bundle transaction via API:", transaction.reference);
        const fulfillmentResult = await fulfillDataBundleTransaction(transaction, transaction.providerId ?? void 0);
        await storage.updateTransaction(transaction.id, { apiResponse: JSON.stringify(fulfillmentResult) });
        if (fulfillmentResult && fulfillmentResult.success && fulfillmentResult.results && fulfillmentResult.results.length > 0) {
          const allSuccess = fulfillmentResult.results.every((r) => r.status === "pending" || r.status === "success");
          if (allSuccess) {
            await storage.updateTransaction(transaction.id, {
              status: TransactionStatus.PENDING,
              deliveryStatus: "processing"
            });
          } else {
            const failedItems = fulfillmentResult.results.filter((r) => r.status === "failed");
            await storage.updateTransaction(transaction.id, {
              status: TransactionStatus.FAILED,
              deliveryStatus: "failed",
              failureReason: `API fulfillment failed: ${failedItems.length} items failed`
            });
          }
        } else {
          console.error("[BulkUpload] Data bundle API fulfillment failed:", fulfillmentResult.error);
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.FAILED,
            deliveryStatus: "failed",
            failureReason: `API fulfillment failed: ${fulfillmentResult.error}`
          });
        }
      } else {
        await storage.updateTransactionDeliveryStatus(transaction.id, "pending");
      }
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          amount: transaction.amount,
          productName: transaction.productName,
          status: "pending",
          // Changed from "completed" to "pending"
          deliveryStatus: autoProcessingEnabled ? "processing" : "pending"
          // Changed from "delivered"
        },
        totalRows: jsonData.length,
        processedItems: orderItems.length,
        errors,
        message: `Bulk purchase completed successfully. ${orderItems.length} items processed${errors.length > 0 ? `. ${errors.length} validation errors found.` : ""}`
      });
    } catch (error) {
      console.error("Excel bulk purchase error:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });
  app2.post("/api/checkout/initialize", async (req, res) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      if (req.body.agentSlug) {
        console.log("[Checkout] Storefront purchase detected - enforcing Paystack-only payment");
      }
      console.log("[Checkout] ========== REQUEST PARSING ==========");
      const data = purchaseSchema.parse(req.body);
      console.log("[Checkout] data.phoneNumbers type:", typeof data.phoneNumbers);
      console.log("[Checkout] data.phoneNumbers is array:", Array.isArray(data.phoneNumbers));
      console.log("[Checkout] data.phoneNumbers:", data.phoneNumbers);
      console.log("[Checkout] data.isBulkOrder:", data.isBulkOrder);
      console.log("[Checkout] ================================================");
      let normalizedPhone;
      if (data.customerPhone) {
        normalizedPhone = normalizePhoneNumber(data.customerPhone);
        if (!isValidPhoneLength(normalizedPhone)) {
          return res.status(400).json({
            error: "Invalid phone number length. Phone number must be exactly 10 digits including the prefix (e.g., 0241234567)"
          });
        }
      }
      const ENFORCE_COOLDOWN_MINUTES = 20;
      const enforcePhoneCooldown = async (phone) => {
        const lastTx = await storage.getLatestDataBundleTransactionByPhone(phone);
        if (lastTx && lastTx.createdAt) {
          const lastTime = new Date(lastTx.createdAt).getTime();
          const cooldownMs = ENFORCE_COOLDOWN_MINUTES * 60 * 1e3;
          const elapsed = Date.now() - lastTime;
          console.log(`[Cooldown] Phone: ${phone}, Last TX: ${lastTx.reference} (${lastTx.paymentStatus}), Elapsed: ${Math.round(elapsed / 1e3)}s, Cooldown: ${ENFORCE_COOLDOWN_MINUTES * 60}s`);
          if (elapsed < cooldownMs) {
            const remainingMinutes = Math.ceil((cooldownMs - elapsed) / 6e4);
            console.log(`[Cooldown] BLOCKED: ${phone} must wait ${remainingMinutes} minute(s)`);
            return { blocked: true, remainingMinutes, lastReference: lastTx.reference };
          }
        }
        console.log(`[Cooldown] ALLOWED: ${phone} (no recent transactions or cooldown expired)`);
        return { blocked: false, remainingMinutes: 0 };
      };
      let authenticatedUserEmail;
      let authenticatedUserId;
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const supabaseServer2 = getSupabase();
          if (supabaseServer2) {
            const { data: { user }, error } = await supabaseServer2.auth.getUser(token);
            if (!error && user && user.email) {
              authenticatedUserEmail = user.email;
              console.log("[Checkout] Authenticated user email:", authenticatedUserEmail);
              const dbUser = await storage.getUserByEmail(user.email);
              if (dbUser) {
                authenticatedUserId = dbUser.id;
                if (normalizedPhone && !dbUser.phone) {
                  await storage.updateUser(dbUser.id, { phone: normalizedPhone });
                  console.log("[Checkout] Updated user phone:", normalizedPhone);
                }
              }
            }
          }
        }
      } catch (authError) {
      }
      const customerEmail = data.customerEmail || authenticatedUserEmail;
      console.log("[Checkout] Email resolution:", {
        "data.customerEmail": data.customerEmail,
        "authenticatedUserEmail": authenticatedUserEmail,
        "resolved customerEmail": customerEmail,
        "normalized phone": normalizedPhone
      });
      if (customerEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
          return res.status(400).json({ error: "Invalid email format" });
        }
      }
      let product;
      let productName;
      let amount;
      let costPrice;
      let agentProfit = 0;
      let agentId;
      let network = null;
      let authenticatedAgentId;
      if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
        console.log("[Checkout] ========== NEW BULK FORMAT DETECTED ==========");
        console.log("[Checkout] orderItems:", data.orderItems);
        console.log("[Checkout] ================================================");
        const firstItem = data.orderItems[0];
        product = await storage.getDataBundle(firstItem.bundleId);
        if (!product || !product.isActive) {
          return res.status(404).json({ error: "Bundle not found" });
        }
        network = data.network || product.network;
        network = network?.toLowerCase() || null;
        for (const item of data.orderItems) {
          const normalizedItemPhone = normalizePhoneNumber(item.phone);
          if (!normalizedItemPhone || !isValidPhoneLength(normalizedItemPhone)) {
            console.error(`[BulkOrder] Invalid phone number: ${item.phone}`);
            return res.status(400).json({ error: `Invalid phone number: ${item.phone}` });
          }
          if (!validatePhoneNetwork(normalizedItemPhone, network)) {
            const errorMsg = getNetworkMismatchError(normalizedItemPhone, network);
            console.error(`[BulkOrder] Network mismatch for phone: ${item.phone} | Error: ${errorMsg}`);
            return res.status(400).json({ error: errorMsg });
          }
        }
        const phoneNumbers = data.orderItems.map((item) => normalizePhoneNumber(item.phone));
        const duplicatePhones = phoneNumbers.filter((phone, index2) => phoneNumbers.indexOf(phone) !== index2);
        const uniqueDuplicates = [...new Set(duplicatePhones)];
        if (uniqueDuplicates.length > 0) {
          console.error(`[BulkOrder] Duplicate phone numbers found: ${uniqueDuplicates.join(", ")}`);
          return res.status(400).json({
            error: `Duplicate phone numbers detected in bulk order: ${uniqueDuplicates.join(", ")}. Each phone number can only appear once per bulk purchase.`,
            duplicatePhones: uniqueDuplicates
          });
        }
        const uniquePhones = [...new Set(phoneNumbers)];
        console.log(`[Checkout] Checking cooldown for ${uniquePhones.length} unique phones in bulk order`);
        for (const phone of uniquePhones) {
          const cooldown = await enforcePhoneCooldown(phone);
          if (cooldown.blocked) {
            console.log(`[Checkout] COOLDOWN BLOCKED for ${phone}: ${cooldown.remainingMinutes} minutes remaining`);
            return res.status(429).json({
              error: `Please wait ${cooldown.remainingMinutes} minute(s) before purchasing another bundle for ${phone}.`,
              cooldownMinutes: cooldown.remainingMinutes,
              phone
            });
          }
        }
        costPrice = 0;
        amount = 0;
        let computedAgentProfit = 0;
        let storefrontAgent = null;
        if (data.agentSlug) {
          storefrontAgent = await storage.getAgentBySlug(data.agentSlug);
          if (!storefrontAgent || !storefrontAgent.isApproved) {
            return res.status(400).json({ error: "Invalid agent storefront" });
          }
        }
        if (!storefrontAgent && authenticatedUserId) {
          const authAgent = await storage.getAgentByUserId(authenticatedUserId);
          if (authAgent) {
            authenticatedAgentId = authAgent.id;
          }
        }
        for (const item of data.orderItems) {
          const bundle = await storage.getDataBundle(item.bundleId);
          if (!bundle) {
            console.error(`[BulkOrder] Bundle not found for bundleId: ${item.bundleId}`);
            return res.status(400).json({ error: `Bundle not found for bundleId: ${item.bundleId}` });
          }
          let itemPrice;
          if (storefrontAgent) {
            const resolvedPrice = await storage.getResolvedPrice(bundle.id, storefrontAgent.id, "agent");
            if (!resolvedPrice) {
              return res.status(400).json({ error: `No pricing available for bundle ${bundle.name}` });
            }
            itemPrice = parseFloat(resolvedPrice);
          } else if (authenticatedAgentId) {
            const customPrice = await storage.getCustomPrice(bundle.id, authenticatedAgentId, "agent");
            if (customPrice) {
              itemPrice = parseFloat(customPrice);
            } else {
              const roleBasePrice = await storage.getRoleBasePrice(bundle.id, "agent");
              itemPrice = roleBasePrice ? parseFloat(roleBasePrice) : parseFloat(bundle.basePrice || "0");
            }
          } else {
            const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
            itemPrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(bundle.basePrice || "0");
          }
          amount += itemPrice;
          if (storefrontAgent || authenticatedAgentId) {
            const profitOwnerId = storefrontAgent ? storefrontAgent.id : authenticatedAgentId;
            const storedProfit = await storage.getStoredProfit(bundle.id, profitOwnerId, "agent");
            if (storedProfit) {
              const profitValue = parseFloat(storedProfit);
              computedAgentProfit += Math.max(0, profitValue);
            } else {
              const agentRoleBasePrice = await storage.getRoleBasePrice(bundle.id, "agent");
              let basePrice;
              if (agentRoleBasePrice) {
                basePrice = parseFloat(agentRoleBasePrice);
              } else {
                const basePriceValue = await storage.getAdminBasePrice(bundle.id);
                basePrice = basePriceValue ? parseFloat(basePriceValue) : parseFloat(bundle.basePrice || "0");
              }
              const profit = itemPrice - basePrice;
              computedAgentProfit += Math.max(0, profit);
            }
          }
        }
        agentProfit = computedAgentProfit;
        console.log("[Checkout] Bulk order total amount (from orderItems):", amount);
        console.log("[Checkout] Bulk order total cost price:", costPrice);
        productName = `Bulk Order - ${data.orderItems.length} items`;
      } else if (data.productId && data.productType === ProductType.DATA_BUNDLE) {
        product = await storage.getDataBundle(data.productId);
        if (!product || !product.isActive) {
          return res.status(404).json({ error: "Product not found" });
        }
        if (normalizedPhone && !validatePhoneNetwork(normalizedPhone, product.network)) {
          const errorMsg = getNetworkMismatchError(normalizedPhone, product.network);
          return res.status(400).json({ error: errorMsg });
        }
        if (normalizedPhone) {
          console.log(`[Checkout] Checking cooldown for single purchase: ${normalizedPhone}`);
          const cooldown = await enforcePhoneCooldown(normalizedPhone);
          if (cooldown.blocked) {
            console.log(`[Checkout] COOLDOWN BLOCKED for ${normalizedPhone}: ${cooldown.remainingMinutes} minutes remaining`);
            return res.status(429).json({
              error: `Please wait ${cooldown.remainingMinutes} minute(s) before purchasing another bundle for ${normalizedPhone}.`,
              cooldownMinutes: cooldown.remainingMinutes,
              phone: normalizedPhone
            });
          }
        }
        let userRole = "guest";
        let authenticatedAgentId2;
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const supabaseServer2 = getSupabase();
            if (supabaseServer2) {
              const { data: { user }, error } = await supabaseServer2.auth.getUser(token);
              if (!error && user && user.email) {
                const dbUser = await storage.getUserByEmail(user.email);
                console.log(`[Checkout] Authenticated user: ${user.email}, dbUser found: ${!!dbUser}`);
                if (dbUser) {
                  const agent = await storage.getAgentByUserId(dbUser.id);
                  if (agent) {
                    authenticatedAgentId2 = agent.id;
                    console.log(`[Checkout] Authenticated agent detected: ${agent.id}`);
                  }
                }
              }
            }
          }
        } catch (authError) {
          console.log(`[Checkout] Auth check error: ${authError}`);
        }
        console.log(`[Checkout] SINGLE PURCHASE: Starting pricing logic...`);
        console.log(`[Checkout] Single purchase - agentSlug provided: ${data.agentSlug}`);
        console.log(`[Checkout] Single purchase - authenticatedAgentId: ${authenticatedAgentId2}`);
        let agentIdForPricing;
        if (data.agentSlug) {
          const agent = await storage.getAgentBySlug(data.agentSlug);
          if (agent && agent.isApproved) {
            agentIdForPricing = agent.id;
          }
        } else if (authenticatedAgentId2) {
          agentIdForPricing = authenticatedAgentId2;
        }
        if (agentIdForPricing) {
          userRole = "agent";
          agentId = agentIdForPricing;
          const resolvedPrice = await storage.getResolvedPrice(data.productId, agentIdForPricing, "agent");
          console.log(`[Checkout] Agent detected: agentId: ${agentIdForPricing}, Resolved price: ${resolvedPrice}`);
          if (!resolvedPrice) {
            return res.status(400).json({ error: "No pricing available for this product" });
          }
          amount = parseFloat(resolvedPrice);
          console.log(`[Checkout] Agent pricing - resolved amount: GHS ${amount}`);
          const storedProfit = await storage.getStoredProfit(data.productId, agentIdForPricing, "agent");
          if (storedProfit) {
            agentProfit = Math.max(0, parseFloat(storedProfit));
            console.log(`[Checkout] Stored profit: GHS ${agentProfit}`);
          } else {
            const agentRoleBasePrice = await storage.getRoleBasePrice(data.productId, "agent");
            let basePrice;
            if (agentRoleBasePrice) {
              basePrice = parseFloat(agentRoleBasePrice);
            } else {
              const adminBasePrice = await storage.getAdminBasePrice(data.productId);
              basePrice = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(product.basePrice || "0");
            }
            agentProfit = Math.max(0, amount - basePrice);
          }
        } else {
          console.log(`[Checkout] Non-agent customer, using admin base price`);
          amount = parseFloat(product.adminPrice || product.basePrice || "0");
        }
        productName = `${product.network.toUpperCase()} ${product.dataAmount} - ${product.validity}`;
        costPrice = 0;
        network = product.network?.toLowerCase();
        const expectedAmount = amount;
        if (data.amount) {
          const frontendAmount = parseFloat(data.amount);
          console.log("[Checkout] Frontend amount:", frontendAmount);
          console.log("[Checkout] Backend expected amount:", expectedAmount);
          if (Math.abs(frontendAmount - expectedAmount) > 0.01) {
            return res.status(400).json({ error: "Price mismatch. Please refresh and try again." });
          }
          amount = frontendAmount;
        }
        console.log("[Checkout] Single purchase pricing:");
        console.log("[Checkout] admin_price:", product.adminPrice);
        console.log("[Checkout] agent_price:", product.agentPrice);
        console.log("[Checkout] user_role:", userRole);
        console.log("[Checkout] final_amount:", amount);
      } else if (data.productId) {
        const [type, yearStr] = data.productId.split("-");
        const year = parseInt(yearStr);
        product = await storage.getAvailableResultChecker(type, year);
        if (!product) {
          return res.status(404).json({ error: "No stock available" });
        }
        productName = `${type.toUpperCase()} ${year} Result Checker`;
        if (data.amount) {
          amount = parseFloat(data.amount);
          console.log("[Checkout] Result checker - using frontend amount:", amount);
        } else {
          amount = parseFloat(product.basePrice);
        }
        costPrice = 0;
      } else {
        return res.status(400).json({ error: "Product ID or order items required" });
      }
      if (data.agentSlug) {
        const agent = await storage.getAgentBySlug(data.agentSlug);
        if (agent && agent.isApproved) {
          agentId = agent.id;
          if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
            console.log("[Checkout] Bulk order computed agent profit:", agentProfit);
          }
          if (data.productType === ProductType.DATA_BUNDLE && data.productId) {
          } else {
          }
        }
      }
      const reference = generateReference();
      const phoneNumbersData = data.orderItems ? data.orderItems.map((item) => ({
        phone: item.phone,
        bundleName: item.bundleName,
        dataAmount: item.bundleName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i)?.[1] || ""
      })) : data.phoneNumbers;
      const isBulkOrder = !!(data.isBulkOrder || data.orderItems && data.orderItems.length > 0);
      if (isBulkOrder && network === "at_ishare") {
        return res.status(400).json({ error: "Bulk purchases are not available for AT iShare network" });
      }
      console.log("[Checkout] ========== RAW DATA EXTRACTION ==========");
      console.log("[Checkout] data object keys:", Object.keys(data));
      console.log("[Checkout] data.phoneNumbers value:", data.phoneNumbers);
      console.log("[Checkout] data.orderItems:", data.orderItems);
      console.log("[Checkout] phoneNumbersData value:", phoneNumbersData);
      console.log("[Checkout] phoneNumbersData type:", typeof phoneNumbersData);
      console.log("[Checkout] phoneNumbersData is array:", Array.isArray(phoneNumbersData));
      console.log("[Checkout] data.isBulkOrder value:", isBulkOrder);
      console.log("[Checkout] ================================================");
      let numberOfRecipients = 1;
      if (Array.isArray(phoneNumbersData) && phoneNumbersData.length > 0) {
        numberOfRecipients = phoneNumbersData.length;
        console.log("[Checkout] \u2713 Using phoneNumbersData array length:", numberOfRecipients);
      } else if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
        numberOfRecipients = data.orderItems.length;
        console.log("[Checkout] \u2713 Using orderItems array length:", numberOfRecipients);
      } else if (isBulkOrder === true && phoneNumbersData) {
        if (Array.isArray(phoneNumbersData)) {
          numberOfRecipients = phoneNumbersData.length || 1;
          console.log("[Checkout] \u2713 Using isBulkOrder flag with array, length:", numberOfRecipients);
        } else if (typeof phoneNumbersData === "object") {
          try {
            const phoneArray = Array.from(phoneNumbersData);
            numberOfRecipients = phoneArray.length || 1;
            console.log("[Checkout] \u2713 Converted phoneNumbersData to array, length:", numberOfRecipients);
          } catch (e) {
            console.log("[Checkout] \u26A0 Failed to convert phoneNumbersData to array, defaulting to 1");
            numberOfRecipients = 1;
          }
        } else {
          console.log("[Checkout] \u26A0 isBulkOrder is true but phoneNumbersData is not an array:", typeof phoneNumbersData);
          numberOfRecipients = 1;
        }
      } else if (isBulkOrder === true) {
        console.log("[Checkout] \u26A0 WARNING: isBulkOrder is true but phoneNumbersData is missing or invalid!");
        console.log("[Checkout] \u26A0 phoneNumbersData:", phoneNumbersData);
        console.log("[Checkout] \u26A0 Defaulting to 1 recipient - THIS MAY BE A BUG!");
      }
      console.log("[Checkout] ========== BULK ORDER CALCULATION ==========");
      console.log("[Checkout] phoneNumbersData is array:", Array.isArray(phoneNumbersData));
      console.log("[Checkout] phoneNumbersData length:", phoneNumbersData?.length);
      console.log("[Checkout] isBulkOrder flag:", isBulkOrder);
      console.log("[Checkout] FINAL numberOfRecipients:", numberOfRecipients);
      console.log("[Checkout] Unit price (amount):", amount);
      console.log("[Checkout] Unit cost price:", costPrice);
      console.log("[Checkout] ================================================");
      const isResultChecker = data.productType === ProductType.RESULT_CHECKER || data.productType === "result_checker";
      const totalAmount = data.orderItems || isResultChecker ? amount : amount * numberOfRecipients;
      const totalCostPrice = 0;
      const totalProfit = data.orderItems ? agentProfit : agentProfit * numberOfRecipients;
      const totalAgentProfit = data.orderItems ? agentProfit : agentProfit * numberOfRecipients;
      console.log("[Checkout] ========== CALCULATED TOTALS ==========");
      console.log("[Checkout] isResultChecker:", isResultChecker);
      console.log("[Checkout] Total amount (", amount, " * ", numberOfRecipients, "):", totalAmount);
      console.log("[Checkout] Total cost price:", totalCostPrice);
      console.log("[Checkout] Total profit:", totalProfit);
      console.log("[Checkout] Total agent profit:", totalAgentProfit);
      console.log("[Checkout] ================================================");
      if (data.paymentMethod === "wallet" && data.productType === ProductType.DATA_BUNDLE && normalizedPhone) {
        if (data.orderItems && Array.isArray(data.orderItems) && data.orderItems.length > 0) {
          const uniquePhones = [...new Set(data.orderItems.map((item) => normalizePhoneNumber(item.phone)))];
          console.log(`[Checkout-Wallet-PreCheck] Checking cooldown for ${uniquePhones.length} unique phones in bulk order`);
          for (const phone of uniquePhones) {
            const cooldown = await enforcePhoneCooldown(phone);
            if (cooldown.blocked) {
              console.log(`[Checkout-Wallet-PreCheck] COOLDOWN BLOCKED for ${phone}: ${cooldown.remainingMinutes} minutes remaining`);
              return res.status(429).json({
                error: `Please wait ${cooldown.remainingMinutes} minute(s) before purchasing another bundle for ${phone}.`,
                cooldownMinutes: cooldown.remainingMinutes,
                phone
              });
            }
          }
        } else {
          console.log(`[Checkout-Wallet-PreCheck] Checking cooldown for single purchase: ${normalizedPhone}`);
          const cooldown = await enforcePhoneCooldown(normalizedPhone);
          if (cooldown.blocked) {
            console.log(`[Checkout-Wallet-PreCheck] COOLDOWN BLOCKED for ${normalizedPhone}: ${cooldown.remainingMinutes} minutes remaining`);
            return res.status(429).json({
              error: `Please wait ${cooldown.remainingMinutes} minute(s) before purchasing another bundle for ${normalizedPhone}.`,
              cooldownMinutes: cooldown.remainingMinutes,
              phone: normalizedPhone
            });
          }
        }
      }
      let providerId;
      if (data.productType === ProductType.DATA_BUNDLE && network) {
        const provider = await storage.getProviderForNetwork(network);
        if (provider) {
          providerId = provider.id;
          console.log(`[Checkout] Selected provider ${provider.name} (${provider.id}) for network ${network}`);
        }
      }
      let metadataField = isBulkOrder && phoneNumbersData ? JSON.stringify(phoneNumbersData) : void 0;
      if (isResultChecker && data.quantity && data.quantity > 1) {
        metadataField = JSON.stringify({ quantity: data.quantity });
        console.log("[Checkout] Storing result checker quantity:", data.quantity);
      }
      const transaction = await storage.createTransaction({
        reference,
        type: data.productType,
        productId: product.id,
        productName,
        network,
        amount: totalAmount.toFixed(2),
        profit: totalProfit.toFixed(2),
        customerPhone: normalizedPhone || null,
        customerEmail,
        phoneNumbers: metadataField,
        isBulkOrder: isBulkOrder || false,
        status: TransactionStatus.PENDING,
        paymentStatus: "pending",
        agentId,
        agentProfit: totalAgentProfit.toFixed(2),
        providerId
      });
      console.log(`[Checkout] Created transaction ${transaction.id} with customerEmail: ${customerEmail}, customerPhone: ${normalizedPhone}, agentId: ${agentId}, agentProfit: ${totalAgentProfit.toFixed(2)}, providerId: ${providerId}`);
      if (data.paymentMethod === "wallet") {
        console.log("[Checkout] Processing wallet payment for reference:", reference);
        let dbUser = null;
        try {
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            const supabaseServer2 = getSupabase();
            if (supabaseServer2) {
              const { data: { user }, error } = await supabaseServer2.auth.getUser(token);
              if (!error && user && user.email) {
                dbUser = await storage.getUserByEmail(user.email);
              }
            }
          }
        } catch (authError) {
          console.error("[Checkout] Auth error for wallet payment:", authError);
          return res.status(401).json({ error: "Authentication required for wallet payments" });
        }
        if (!dbUser) {
          return res.status(401).json({ error: "User not found" });
        }
        const walletBalanceCents = Math.round(parseFloat(dbUser.walletBalance || "0") * 100);
        const totalAmountCents = Math.round(totalAmount * 100);
        if (walletBalanceCents < totalAmountCents) {
          return res.status(400).json({
            error: "Insufficient wallet balance",
            balance: (walletBalanceCents / 100).toFixed(2),
            required: (totalAmountCents / 100).toFixed(2)
          });
        }
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.CONFIRMED,
          paymentStatus: "paid",
          paymentMethod: "wallet"
        });
        const newBalanceCents = walletBalanceCents - totalAmountCents;
        const newBalance = newBalanceCents / 100;
        await storage.updateUser(dbUser.id, { walletBalance: newBalance.toFixed(2) });
        let deliveredPins = [];
        if (transaction.type === ProductType.RESULT_CHECKER && transaction.productId) {
          const [type, yearStr] = transaction.productId.split("-");
          const year = parseInt(yearStr);
          const requestedQuantity = data.quantity || 1;
          const availableCheckers = await storage.getAvailableResultCheckersByQuantity(type, year, requestedQuantity);
          if (availableCheckers.length < requestedQuantity) {
            return res.status(400).json({
              error: `Insufficient stock. Only ${availableCheckers.length} checkers available.`
            });
          }
          for (const checker of availableCheckers) {
            await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
            deliveredPins.push({
              pin: checker.pin,
              serialNumber: checker.serialNumber
            });
          }
          console.log(`[Checkout] Delivered ${deliveredPins.length} result checker PINs for transaction ${transaction.id}`);
        } else if (transaction.type === ProductType.DATA_BUNDLE) {
          if (transaction.apiResponse) {
            console.log("[Checkout] Data bundle transaction already fulfilled, skipping:", transaction.reference);
          } else {
            console.log("[Checkout] Processing data bundle transaction via API:", transaction.reference);
            const fulfillmentResult = await fulfillDataBundleTransaction(transaction, transaction.providerId ?? void 0);
            await storage.updateTransaction(transaction.id, { apiResponse: JSON.stringify(fulfillmentResult) });
            if (fulfillmentResult.success) {
              await storage.updateTransaction(transaction.id, {
                status: TransactionStatus.PENDING,
                // Changed from COMPLETED to PENDING
                deliveryStatus: "processing"
                // Changed from "pending" to "processing"
              });
            } else {
              console.error("[Checkout] Data bundle API fulfillment failed:", fulfillmentResult.error);
              await storage.updateTransaction(transaction.id, {
                status: TransactionStatus.FAILED,
                deliveryStatus: "failed",
                failureReason: `API fulfillment failed: ${fulfillmentResult.error}`
              });
            }
          }
        }
        if (transaction.type === ProductType.RESULT_CHECKER) {
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.COMPLETED,
            completedAt: /* @__PURE__ */ new Date(),
            paymentStatus: "paid",
            deliveredPin: deliveredPins.length > 0 ? deliveredPins[0].pin : void 0,
            deliveredSerial: deliveredPins.length > 0 ? deliveredPins[0].serialNumber : void 0
          });
        }
        if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
          const agentProfitValue = parseFloat(transaction.agentProfit || "0");
          await storage.updateAgentBalance(transaction.agentId, agentProfitValue, true);
          const agent = await storage.getAgent(transaction.agentId);
          if (agent) {
            let profitWallet = await storage.getProfitWallet(agent.userId);
            if (!profitWallet) {
              profitWallet = await storage.createProfitWallet({
                userId: agent.userId,
                availableBalance: "0.00",
                pendingBalance: "0.00",
                totalEarned: "0.00"
              });
            }
            const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
            const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
            await storage.updateProfitWallet(agent.userId, {
              availableBalance: newAvailableBalance,
              totalEarned: newTotalEarned
            });
          }
        }
        return res.json({
          success: true,
          transaction: {
            id: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            productName: transaction.productName,
            status: TransactionStatus.COMPLETED,
            deliveredPin: deliveredPins.length > 0 ? deliveredPins[0].pin : void 0,
            deliveredSerial: deliveredPins.length > 0 ? deliveredPins[0].serialNumber : void 0,
            pinsData: deliveredPins
          },
          newBalance: newBalance.toFixed(2)
        });
      }
      const paystackEmail = customerEmail || (normalizedPhone ? `${normalizedPhone}@example.com` : `result-checker-${reference}@example.com`);
      const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://resellershubprogh.com";
      const callbackUrl = `${frontendUrl}/checkout/success?reference=${reference}`;
      console.log("[Checkout] Paystack initialization:", {
        totalAmount,
        amountInPesewas: Math.round(totalAmount * 100),
        reference
      });
      try {
        const paystackResponse = await initializePayment({
          email: paystackEmail,
          amount: Math.round(totalAmount * 100),
          // Convert GHS to pesewas
          reference,
          callbackUrl,
          metadata: {
            transactionId: transaction.id,
            productName,
            customerPhone: normalizedPhone || null,
            isBulkOrder: isBulkOrder || false,
            numberOfRecipients
          }
        });
        console.log("[Checkout] Paystack response received:", {
          authorization_url: paystackResponse.data.authorization_url,
          access_code: paystackResponse.data.access_code
        });
        res.json({
          transaction: {
            id: transaction.id,
            reference: transaction.reference,
            amount: transaction.amount,
            productName: transaction.productName
          },
          paymentUrl: paystackResponse.data.authorization_url,
          accessCode: paystackResponse.data.access_code,
          debug: {
            phoneNumbers: phoneNumbersData,
            isBulkOrder,
            numberOfRecipients,
            unitPrice: amount,
            totalAmount,
            amountSentToPaystack: Math.round(totalAmount * 100)
          }
        });
      } catch (paystackError) {
        console.error("[Checkout] Paystack initialization failed:", paystackError);
        console.error("[Checkout] Error details:", {
          message: paystackError.message,
          phoneNumbers: phoneNumbersData,
          numberOfRecipients,
          totalAmount
        });
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.FAILED
        });
        return res.status(500).json({
          error: paystackError.message || "Payment initialization failed",
          debug: {
            phoneNumbers: phoneNumbersData,
            numberOfRecipients,
            totalAmount
          }
        });
      }
    } catch (error) {
      console.error("[Checkout] General error:", error);
      res.status(400).json({
        error: error.message || "Checkout failed",
        debug: {
          error: error.toString()
        }
      });
    }
  });
  app2.get("/api/transactions/verify/:reference", async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        console.error("[Verify] Request timeout for reference:", req.params.reference);
        res.status(503).json({
          error: "Verification service temporarily unavailable. Please refresh the page.",
          success: false
        });
      }
    }, 3e4);
    try {
      console.log("[Verify] Starting verification for reference:", req.params.reference);
      const transaction = await storage.getTransactionByReference(req.params.reference);
      if (!transaction) {
        console.log("[Verify] Transaction not found:", req.params.reference);
        return res.status(404).json({ error: "Transaction not found" });
      }
      console.log("[Verify] Transaction status:", transaction.status);
      if (transaction.paymentMethod === "wallet" || transaction.reference?.startsWith("WALLET-")) {
        console.log("[Verify] Wallet payment detected, skipping Paystack verification");
        clearTimeout(timeoutId);
        return res.json({
          success: true,
          transaction
        });
      }
      if (transaction.status === TransactionStatus.COMPLETED || transaction.apiResponse) {
        console.log("[Verify] Transaction already completed or fulfilled");
        return res.json({
          success: true,
          transaction
        });
      }
      console.log("[Verify] Calling Paystack API for verification");
      let paystackVerification;
      let retryCount = 0;
      const maxRetries = 2;
      while (retryCount < maxRetries) {
        try {
          paystackVerification = await verifyPayment(req.params.reference);
          console.log(`[Verify] Paystack response (attempt ${retryCount + 1}):`, paystackVerification.data.status);
          if (paystackVerification.data.status === "success") {
            break;
          }
          if (retryCount < maxRetries - 1) {
            console.log(`[Verify] Payment status is ${paystackVerification.data.status}, waiting 1s before retry...`);
            await new Promise((resolve) => setTimeout(resolve, 1e3));
          }
          retryCount++;
        } catch (error) {
          console.error(`[Verify] Paystack API error (attempt ${retryCount + 1}):`, error.message);
          if (retryCount < maxRetries - 1) {
            console.log("[Verify] Retrying after error...");
            await new Promise((resolve) => setTimeout(resolve, 1e3));
            retryCount++;
          } else {
            throw error;
          }
        }
      }
      if (!paystackVerification || paystackVerification.data.status !== "success") {
        const status = paystackVerification?.data.status || "unknown";
        console.log("[Verify] Payment not successful after retries, final status:", status);
        await storage.updateTransaction(transaction.id, {
          paymentStatus: status === "abandoned" ? "cancelled" : "failed"
        });
        return res.json({
          success: false,
          status,
          message: paystackVerification?.data.gateway_response || "Payment verification in progress",
          transaction: {
            reference: transaction.reference,
            status: transaction.status
          }
        });
      }
      console.log("[Verify] Payment successful, fulfilling order");
      let deliveredPin;
      let deliveredSerial;
      let pinsData = [];
      if (transaction.type === ProductType.RESULT_CHECKER && transaction.productId) {
        let requestedQuantity = 1;
        if (transaction.phoneNumbers) {
          try {
            const metadata = JSON.parse(transaction.phoneNumbers);
            if (metadata && typeof metadata === "object" && metadata.quantity) {
              requestedQuantity = metadata.quantity;
            }
          } catch (e) {
          }
        }
        if (requestedQuantity > 1) {
          console.log(`[Verify] Processing ${requestedQuantity} result checkers`);
          const sampleChecker = await storage.getResultChecker(transaction.productId);
          if (!sampleChecker) {
            console.error(`[Verify] Result checker not found: ${transaction.productId}`);
            return res.status(400).json({ error: "Result checker not found" });
          }
          const type = sampleChecker.type;
          const year = sampleChecker.year;
          console.log(`[Verify] Extracted type: ${type}, year: ${year}`);
          const checkers = await storage.getAvailableResultCheckersByQuantity(type, year, requestedQuantity);
          if (checkers.length < requestedQuantity) {
            console.error(`[Verify] Not enough result checkers available. Requested: ${requestedQuantity}, Available: ${checkers.length}`);
            return res.status(400).json({ error: "Insufficient result checkers available" });
          }
          for (const checker of checkers) {
            await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
            pinsData.push({
              pin: checker.pin,
              serialNumber: checker.serialNumber
            });
          }
          deliveredPin = checkers[0].pin;
          deliveredSerial = checkers[0].serialNumber;
          console.log(`[Verify] ${checkers.length} result checkers delivered`);
        } else {
          const checker = await storage.getResultChecker(transaction.productId);
          if (checker && !checker.isSold) {
            await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
            deliveredPin = checker.pin;
            deliveredSerial = checker.serialNumber;
            pinsData.push({
              pin: checker.pin,
              serialNumber: checker.serialNumber
            });
            console.log("[Verify] Result checker delivered");
          }
        }
      }
      if (transaction.type === ProductType.RESULT_CHECKER) {
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.COMPLETED,
          paymentStatus: "paid",
          completedAt: /* @__PURE__ */ new Date(),
          deliveredPin,
          deliveredSerial,
          paymentReference: paystackVerification.data.reference
        });
        console.log("[Verify] Result checker transaction completed");
      } else {
        await storage.updateTransaction(transaction.id, {
          paymentStatus: "paid",
          paymentReference: paystackVerification.data.reference
        });
        console.log("[Verify] Payment marked as paid, awaiting fulfillment");
      }
      if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
        const agentProfitValue = parseFloat(transaction.agentProfit || "0");
        const totalPaid = parseFloat(transaction.amount || "0");
        const adminRevenue = parseFloat((totalPaid - agentProfitValue).toFixed(2));
        if (Math.abs(agentProfitValue + adminRevenue - totalPaid) > 0.01) {
          console.error("INVALID_BULK_PAYOUT detected for webhook transaction", transaction.reference);
          throw new Error("INVALID_BULK_PAYOUT");
        }
        await storage.updateAgentBalance(transaction.agentId, agentProfitValue, true);
        console.log("[Verify] Agent credited");
        const agent = await storage.getAgent(transaction.agentId);
        if (agent) {
          let profitWallet = await storage.getProfitWallet(agent.userId);
          if (!profitWallet) {
            profitWallet = await storage.createProfitWallet({
              userId: agent.userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00"
            });
          }
          const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
          const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
          await storage.updateProfitWallet(agent.userId, {
            availableBalance: newAvailableBalance,
            totalEarned: newTotalEarned
          });
        }
        const adminRef = `ADMINREV-${transaction.reference}`;
        await storage.createTransaction({
          reference: adminRef,
          type: "admin_revenue",
          productId: null,
          productName: `Admin revenue for transaction ${transaction.reference}`,
          network: null,
          amount: adminRevenue.toFixed(2),
          profit: "0.00",
          customerPhone: "",
          customerEmail: null,
          isBulkOrder: false,
          status: TransactionStatus.COMPLETED,
          paymentStatus: "paid"
        });
      }
      if (transaction.type === ProductType.DATA_BUNDLE && !transaction.apiResponse) {
        console.log("[Verify] Queuing data bundle fulfillment for background processing:", transaction.reference);
        (async () => {
          try {
            const fulfillmentResult = await fulfillDataBundleTransaction(transaction, transaction.providerId ?? void 0);
            await storage.updateTransaction(transaction.id, { apiResponse: JSON.stringify(fulfillmentResult) });
            if (fulfillmentResult && fulfillmentResult.success && fulfillmentResult.results && fulfillmentResult.results.length > 0) {
              const allSuccess = fulfillmentResult.results.every((r) => r.status === "pending" || r.status === "success");
              if (allSuccess) {
                console.log("[Verify] Data bundle API fulfillment successful:", fulfillmentResult);
                await storage.updateTransaction(transaction.id, {
                  status: TransactionStatus.PENDING,
                  deliveryStatus: "processing"
                });
              } else {
                const failedItems = fulfillmentResult.results.filter((r) => r.status === "failed");
                console.error("[Verify] Data bundle API fulfillment had failures:", failedItems);
                await storage.updateTransaction(transaction.id, {
                  status: TransactionStatus.FAILED,
                  deliveryStatus: "failed",
                  completedAt: /* @__PURE__ */ new Date(),
                  failureReason: `Provider rejected ${failedItems.length}/${fulfillmentResult.results.length} items: ${failedItems.map((r) => r.error || "Unknown error").join(", ")}`
                });
              }
            } else {
              console.error("[Verify] Data bundle API fulfillment failed:", fulfillmentResult?.error);
              await storage.updateTransaction(transaction.id, {
                status: TransactionStatus.FAILED,
                deliveryStatus: "failed",
                completedAt: /* @__PURE__ */ new Date(),
                failureReason: `API fulfillment failed: ${fulfillmentResult?.error || "Unknown error"}`
              });
            }
          } catch (error) {
            console.error("[Verify] Background fulfillment error:", error);
            await storage.updateTransaction(transaction.id, {
              status: TransactionStatus.FAILED,
              deliveryStatus: "failed",
              completedAt: /* @__PURE__ */ new Date(),
              failureReason: `Background fulfillment error: ${error.message || "Unknown error"}`
            });
          }
        })().catch((err) => {
          console.error("[Verify] Uncaught background fulfillment error:", err);
        });
      }
      console.log("[Verify] Verification complete, sending success response");
      const freshTransaction = await storage.getTransactionByReference(transaction.reference);
      clearTimeout(timeoutId);
      return res.json({
        success: true,
        transaction: freshTransaction ?? transaction
      });
    } catch (error) {
      console.error("[Verify] Payment verification error:", error.message || error);
      clearTimeout(timeoutId);
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });
  app2.get("/api/paystack/verify", async (req, res) => {
    try {
      const reference = req.query.reference;
      if (!reference) {
        return res.status(400).json({ error: "Payment reference is required" });
      }
      console.log("Verifying payment reference:", reference);
      try {
        const verificationResult = await verifyPayment(reference);
        if (!verificationResult.status) {
          console.log("Payment verification failed for reference:", reference);
          return res.json({ status: "failed", message: "Payment verification failed" });
        }
        const paymentData = verificationResult.data;
        console.log("Payment data received:", { status: paymentData.status, reference: paymentData.reference });
        if (paymentData.status === "abandoned") {
          console.log("Payment was cancelled or abandoned:", reference);
          return res.json({
            status: "cancelled",
            message: "Payment was cancelled. Please try again if you wish to complete your registration."
          });
        }
        if (paymentData.status === "success") {
          const metadata = paymentData.metadata;
          if (metadata && metadata.pending_registration && metadata.registration_data) {
            console.log("Processing pending agent registration after payment success");
            console.log("Registration data:", metadata.registration_data);
            const supabaseServer2 = getSupabase();
            if (!supabaseServer2) {
              console.error("Supabase not configured");
              return res.json({ status: "failed", message: "Server configuration error" });
            }
            const regData = metadata.registration_data;
            const existingUser = await storage.getUserByEmail(regData.email);
            if (existingUser && existingUser.role === "agent") {
              console.log("User already exists as agent, returning existing account details");
              const existingAgent = await storage.getAgentByUserId(existingUser.id);
              if (existingAgent) {
                if (!existingAgent.isApproved) {
                  await storage.updateAgent(existingAgent.id, { isApproved: true });
                  console.log("Updated existing agent to approved");
                }
                return res.json({
                  status: "success",
                  message: "Agent account already created successfully. Please login with your credentials.",
                  data: {
                    reference: paymentData.reference,
                    amount: paymentData.amount,
                    paidAt: paymentData.paid_at,
                    agent: {
                      id: existingAgent.id,
                      businessName: existingAgent.businessName,
                      storefrontSlug: existingAgent.storefrontSlug
                    },
                    user: {
                      id: existingUser.id,
                      email: existingUser.email,
                      name: existingUser.name,
                      role: existingUser.role
                    }
                  }
                });
              }
            } else if (existingUser && existingUser.role !== "agent") {
              console.log("User exists but not agent, upgrading to agent");
              await storage.updateUser(existingUser.id, { role: UserRole.AGENT });
              const agent = await storage.createAgent({
                userId: existingUser.id,
                storefrontSlug: regData.storefrontSlug,
                businessName: regData.businessName,
                isApproved: true,
                paymentPending: false
              });
              console.log("Agent created for existing user:", agent.id);
              const activationFee = 60;
              const transaction = await storage.createTransaction({
                reference: paymentData.reference,
                type: ProductType.AGENT_ACTIVATION,
                productId: agent.id,
                productName: "Agent Account Activation",
                network: null,
                amount: activationFee.toString(),
                profit: activationFee.toString(),
                customerPhone: regData.phone,
                customerEmail: regData.email,
                paymentMethod: "paystack",
                status: TransactionStatus.COMPLETED,
                paymentStatus: "paid",
                paymentReference: paymentData.reference,
                agentId: null,
                agentProfit: "0.00"
              });
              return res.json({
                status: "success",
                message: "Payment verified and agent account upgraded successfully. Please login with your credentials.",
                data: {
                  reference: paymentData.reference,
                  amount: paymentData.amount,
                  paidAt: paymentData.paid_at,
                  agent: {
                    id: agent.id,
                    businessName: agent.businessName,
                    storefrontSlug: agent.storefrontSlug
                  },
                  user: {
                    id: existingUser.id,
                    email: existingUser.email,
                    name: existingUser.name,
                    role: "agent"
                  }
                }
              });
            }
            try {
              console.log("Step 1: Checking if user already exists in Supabase");
              const { data: existingUsers } = await supabaseServer2.auth.admin.listUsers();
              const existingAuthUser = existingUsers?.users?.find((u) => u.email === regData.email);
              let userId;
              if (existingAuthUser) {
                console.log("User already exists in Supabase:", existingAuthUser.id);
                userId = existingAuthUser.id;
              } else {
                console.log("Step 1: Creating user in Supabase Auth:", regData.email);
                const { data: authData, error: authError } = await supabaseServer2.auth.admin.createUser({
                  email: regData.email,
                  password: regData.password,
                  user_metadata: {
                    name: regData.name,
                    phone: regData.phone,
                    role: "agent"
                  },
                  email_confirm: true
                });
                if (authError) {
                  console.error("Step 1 FAILED: Auth user creation error:", authError);
                  console.error("Auth error details:", JSON.stringify(authError, null, 2));
                  return res.json({
                    status: "failed",
                    message: "Payment successful but account creation failed. Please contact support.",
                    error: authError.message
                  });
                }
                userId = authData.user.id;
                console.log("Step 1 SUCCESS: Supabase user created:", userId);
              }
              const existingLocalUser = await storage.getUserByEmail(regData.email);
              if (existingLocalUser) {
                console.log("User already exists in local database:", existingLocalUser.id);
                if (existingLocalUser.role !== UserRole.AGENT) {
                  await storage.updateUser(existingLocalUser.id, { role: UserRole.AGENT });
                  console.log("Updated user role to agent");
                }
              } else {
                console.log("Step 2: Creating user in local database");
                const localUser = await storage.createUser({
                  id: userId,
                  email: regData.email,
                  password: "",
                  // Empty password since auth is handled by Supabase
                  name: regData.name,
                  phone: regData.phone,
                  role: UserRole.AGENT
                });
                console.log("Step 2 SUCCESS: User created in local database:", localUser.id);
              }
              const existingAgent = await storage.getAgentByUserId(userId);
              let agent;
              if (existingAgent) {
                console.log("Agent already exists:", existingAgent.id);
                if (!existingAgent.isApproved) {
                  agent = await storage.updateAgent(existingAgent.id, {
                    isApproved: true,
                    paymentPending: false
                  });
                  console.log("Updated agent to approved");
                } else {
                  agent = existingAgent;
                }
              } else {
                console.log("Step 3: Creating agent record");
                agent = await storage.createAgent({
                  userId,
                  storefrontSlug: regData.storefrontSlug,
                  businessName: regData.businessName,
                  isApproved: true,
                  // Approved since payment is successful
                  paymentPending: false
                });
                console.log("Step 3 SUCCESS: Agent created and approved:", agent.id);
              }
              if (!agent) {
                throw new Error("Failed to create or update agent");
              }
              const existingTransaction = await storage.getTransactionByReference(paymentData.reference);
              if (!existingTransaction) {
                console.log("Step 4: Recording activation transaction");
                const activationFee = 60;
                const transaction = await storage.createTransaction({
                  reference: paymentData.reference,
                  type: ProductType.AGENT_ACTIVATION,
                  productId: agent.id,
                  productName: "Agent Account Activation",
                  network: null,
                  amount: activationFee.toString(),
                  profit: activationFee.toString(),
                  customerPhone: regData.phone,
                  customerEmail: regData.email,
                  paymentMethod: "paystack",
                  status: TransactionStatus.COMPLETED,
                  paymentStatus: "paid",
                  paymentReference: paymentData.reference,
                  agentId: null,
                  agentProfit: "0.00"
                });
                console.log("Step 4 SUCCESS: Activation transaction recorded:", transaction.id);
              } else {
                console.log("Transaction already exists for reference:", paymentData.reference);
              }
              console.log("Step 5: Preparing success response");
              const response = {
                status: "success",
                message: "Payment verified and agent account created successfully. Please login with your credentials.",
                data: {
                  reference: paymentData.reference,
                  amount: paymentData.amount,
                  paidAt: paymentData.paid_at,
                  agent: {
                    id: agent.id,
                    businessName: agent.businessName,
                    storefrontSlug: agent.storefrontSlug
                  },
                  user: {
                    id: userId,
                    email: regData.email,
                    name: regData.name,
                    role: "agent"
                  }
                }
              };
              console.log("Step 5 SUCCESS: Sending success response");
              return res.json(response);
            } catch (createError) {
              console.error("ERROR in account creation process:", createError);
              console.error("Error message:", createError.message);
              console.error("Error stack:", createError.stack);
              console.error("Error code:", createError.code);
              return res.json({
                status: "failed",
                message: "Payment successful but account creation failed. Please contact support with this reference: " + paymentData.reference,
                error: createError.message,
                reference: paymentData.reference
              });
            }
          }
          if (metadata && metadata.purpose === "agent_activation" && metadata.agent_id) {
            console.log("Agent activation payment verified (old flow):", metadata.agent_id);
            if (metadata.transaction_id) {
              await storage.updateTransaction(metadata.transaction_id, {
                status: TransactionStatus.COMPLETED,
                completedAt: /* @__PURE__ */ new Date(),
                paymentReference: paymentData.reference
              });
              console.log("Activation transaction marked as completed:", metadata.transaction_id);
            }
            const agent = await storage.updateAgent(metadata.agent_id, {
              isApproved: true,
              paymentPending: false
            });
            if (agent) {
              console.log("Agent auto-approved after payment verification:", agent.id);
              const updatedUser = await storage.updateUser(agent.userId, { role: UserRole.AGENT });
              if (updatedUser) {
                console.log("User role updated to agent:", updatedUser.id);
              } else {
                console.error("Failed to update user role to agent for user:", agent.userId);
              }
            }
          }
          return res.json({
            status: "success",
            message: "Payment verified successfully",
            data: {
              reference: paymentData.reference,
              amount: paymentData.amount,
              paidAt: paymentData.paid_at
            }
          });
        } else {
          return res.json({
            status: "failed",
            message: `Payment status: ${paymentData.status}`
          });
        }
      } catch (verifyError) {
        console.error("Error in payment verification process:", verifyError);
        console.error("Error stack:", verifyError.stack);
        return res.json({
          status: "failed",
          message: "Payment verification failed. Please try again.",
          error: verifyError.message
        });
      }
    } catch (error) {
      console.error("Payment verification error (outer catch):", error);
      console.error("Error stack:", error.stack);
      return res.json({
        status: "failed",
        message: error.message || "Verification failed"
      });
    }
  });
  async function processWebhookEvent(event) {
    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata;
      if (metadata && metadata.purpose === "agent_activation") {
        if (metadata.pending_registration && metadata.registration_data) {
          console.log("Processing pending agent registration via webhook:", reference);
          const supabaseServer2 = getSupabase();
          if (!supabaseServer2) {
            console.error("Supabase not initialized for webhook");
            return;
          }
          const regData = metadata.registration_data;
          try {
            const existingAgent = await storage.getAgentBySlug(regData.storefrontSlug);
            if (existingAgent) {
              console.log("Agent already exists for slug:", regData.storefrontSlug);
              return;
            }
            const { data: authData, error: authError } = await supabaseServer2.auth.admin.createUser({
              email: regData.email,
              password: regData.password,
              user_metadata: {
                name: regData.name,
                phone: regData.phone,
                role: "agent"
              },
              email_confirm: true
            });
            if (authError) {
              console.error("Failed to create auth user in webhook:", authError);
              return;
            }
            const userId = authData.user.id;
            console.log("User created via webhook:", userId);
            const existingUser = await storage.getUser(userId);
            if (!existingUser) {
              await storage.createUser({
                id: userId,
                email: regData.email,
                password: "",
                name: regData.name,
                phone: regData.phone,
                role: UserRole.AGENT
              });
            }
            const agent = await storage.createAgent({
              userId,
              storefrontSlug: regData.storefrontSlug,
              businessName: regData.businessName,
              businessDescription: regData.businessDescription,
              isApproved: true,
              paymentPending: false
            });
            console.log("Agent created via webhook:", agent.id);
            if (!agent) {
              console.error("Failed to create agent in webhook");
              return;
            }
            const existingTransaction = await storage.getTransactionByReference(reference);
            if (!existingTransaction) {
              const activationFee = 60;
              await storage.createTransaction({
                reference,
                type: ProductType.AGENT_ACTIVATION,
                productId: agent.id,
                productName: "Agent Account Activation",
                network: null,
                amount: activationFee.toString(),
                profit: activationFee.toString(),
                customerPhone: regData.phone,
                customerEmail: regData.email,
                paymentMethod: "paystack",
                status: TransactionStatus.COMPLETED,
                paymentReference: reference,
                agentId: null,
                agentProfit: "0.00"
              });
            }
            console.log("Agent registration completed via webhook");
          } catch (createError) {
            console.error("Error creating account in webhook:", createError);
          }
          return;
        }
        if (metadata.agent_id) {
          console.log("Processing agent activation payment (old flow):", reference);
          if (metadata.transaction_id) {
            await storage.updateTransaction(metadata.transaction_id, {
              status: TransactionStatus.COMPLETED,
              completedAt: /* @__PURE__ */ new Date(),
              paymentReference: reference
            });
            console.log("Activation transaction marked as completed:", metadata.transaction_id);
          }
          const agent = await storage.updateAgent(metadata.agent_id, {
            isApproved: true,
            paymentPending: false
          });
          if (agent) {
            console.log("Agent auto-approved after payment:", agent.id);
            const updatedUser = await storage.updateUser(agent.userId, { role: UserRole.AGENT });
            if (updatedUser) {
              console.log("User role updated to agent:", updatedUser.id);
            } else {
              console.error("Failed to update user role to agent for user:", agent.userId);
            }
          }
          return;
        }
      }
      const transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        console.error("Transaction not found for webhook:", reference);
        return;
      }
      if (transaction.status === TransactionStatus.COMPLETED) {
        return;
      }
      let deliveredPin;
      let deliveredSerial;
      if (transaction.type === ProductType.RESULT_CHECKER && transaction.productId) {
        const [type, yearStr] = transaction.productId.split("-");
        const year = parseInt(yearStr);
        let checker = await storage.getAvailableResultChecker(type, year);
        if (checker) {
          await storage.markResultCheckerSold(checker.id, transaction.id, transaction.customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
        } else {
          deliveredSerial = `RC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          deliveredPin = Math.random().toString(36).substring(2, 10).toUpperCase();
          const newChecker = await storage.createResultChecker({
            type,
            year,
            serialNumber: deliveredSerial,
            pin: deliveredPin,
            basePrice: transaction.amount
          });
          console.log("Auto-generated result checker via Paystack:", newChecker.id);
        }
      }
      await storage.updateTransaction(transaction.id, {
        status: TransactionStatus.COMPLETED,
        completedAt: /* @__PURE__ */ new Date(),
        deliveredPin,
        deliveredSerial,
        paymentReference: data.reference
      });
      if (transaction.agentId && parseFloat(transaction.agentProfit || "0") > 0) {
        await storage.updateAgentBalance(transaction.agentId, parseFloat(transaction.agentProfit || "0"), true);
        const agent = await storage.getAgent(transaction.agentId);
        if (agent) {
          let profitWallet = await storage.getProfitWallet(agent.userId);
          if (!profitWallet) {
            profitWallet = await storage.createProfitWallet({
              userId: agent.userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00"
            });
          }
          const agentProfitValue = parseFloat(transaction.agentProfit || "0");
          const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
          const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
          await storage.updateProfitWallet(agent.userId, {
            availableBalance: newAvailableBalance,
            totalEarned: newTotalEarned
          });
        }
      }
      console.log("Payment processed via webhook:", reference);
    }
  }
  app2.post("/api/admin/wallet/topup", requireAuthJWT, requireAdminJWT, async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ error: "User ID and amount are required" });
      }
      const topupAmount = parseFloat(amount);
      if (isNaN(topupAmount) || topupAmount <= 0 || topupAmount > 1e4) {
        return res.status(400).json({ error: "Invalid amount (must be between 0.01 and 10,000)" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      const adminId = req.user.id;
      const newBalance = (parseFloat(user.walletBalance || "0") + topupAmount).toFixed(2);
      await storage.updateUser(userId, { walletBalance: newBalance });
      await storage.createWalletTopupTransaction({
        userId,
        adminId,
        amount: topupAmount.toFixed(2),
        reason: reason || null
      });
      await storage.createAuditLog({
        userId: adminId,
        action: "wallet_topup",
        entityType: "user",
        entityId: userId,
        oldValue: JSON.stringify({ walletBalance: user.walletBalance }),
        newValue: JSON.stringify({ walletBalance: newBalance, amount: topupAmount, reason }),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent")
      });
      res.json({
        success: true,
        message: `Successfully topped up ${user.name}'s wallet with GHS ${topupAmount.toFixed(2)}`,
        newBalance: (parseFloat(user.walletBalance || "0") + topupAmount).toFixed(2)
      });
    } catch (error) {
      console.error("Wallet topup error:", error);
      res.status(500).json({ error: "Failed to top up wallet" });
    }
  });
  app2.get("/api/admin/wallet/topup-transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions2 = await storage.getWalletTopupTransactions();
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load wallet topup transactions" });
    }
  });
  app2.post("/api/paystack/webhook", async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"];
      const rawBody = req.rawBody;
      if (!rawBody || !await validateWebhookSignature(rawBody, signature)) {
        console.error("Invalid Paystack webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
      }
      const event = req.body;
      setImmediate(async () => {
        try {
          await processWebhookEvent(event);
        } catch (webhookError) {
          console.error("Webhook processing error:", webhookError);
        }
      });
      res.sendStatus(200);
    } catch (error) {
      console.error("Webhook handler error:", error);
      res.sendStatus(200);
    }
  });
  app2.get("/api/profile", requireAuth, async (req, res) => {
    try {
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      console.log("Profile request for:", req.user.email);
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const role = dbUser.role;
      const userDetails = await storage.getUser(dbUser.id);
      if (role === UserRole.AGENT || role === UserRole.DEALER || role === UserRole.SUPER_DEALER || role === UserRole.MASTER) {
        const agent = await storage.getAgentByUserId(dbUser.id);
        if (agent) {
          const stats = await storage.getTransactionStats(agent.id);
          const withdrawals2 = await storage.getWithdrawals({
            userId: dbUser.id
          });
          const withdrawnTotal = withdrawals2.filter((w) => w?.status === "paid").reduce((sum2, w) => sum2 + Number(w?.amount || 0), 0);
          const totalProfitResult = await db.select({
            total: sql2`coalesce(sum(cast(agent_profit as numeric)), 0)`
          }).from(transactions).where(and2(
            eq2(transactions.agentId, agent.id),
            or2(
              eq2(transactions.status, "completed"),
              eq2(transactions.paymentStatus, "paid")
            )
          ));
          const totalProfit = Number(totalProfitResult[0]?.total || 0);
          const profitBalance = Math.max(0, totalProfit - withdrawnTotal);
          return res.json({
            profile: {
              ...agent,
              walletBalance: Number(dbUser.walletBalance || 0),
              profitBalance,
              totalWithdrawals: withdrawnTotal,
              role,
              user: {
                name: userDetails?.name ?? null,
                email: userDetails?.email ?? null,
                phone: userDetails?.phone ?? null
              }
            },
            stats
          });
        }
        return res.json({
          profile: {
            id: dbUser.id,
            userId: dbUser.id,
            walletBalance: Number(dbUser.walletBalance || 0),
            profitBalance: 0,
            totalProfit: "0",
            totalSales: "0",
            balance: "0",
            totalWithdrawals: 0,
            role,
            storefrontSlug: null,
            businessName: null,
            businessDescription: null,
            isApproved: false,
            paymentPending: false,
            user: {
              name: userDetails?.name ?? null,
              email: userDetails?.email ?? null,
              phone: userDetails?.phone ?? null
            }
          },
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            revenue: 0,
            profit: 0
          }
        });
      }
      return res.json({
        profile: {
          id: dbUser.id,
          userId: dbUser.id,
          walletBalance: Number(dbUser.walletBalance || 0),
          profitBalance: 0,
          role,
          user: {
            name: userDetails?.name ?? null,
            email: userDetails?.email ?? null,
            phone: userDetails?.phone ?? null
          }
        },
        stats: {
          total: 0,
          completed: 0,
          pending: 0,
          revenue: 0,
          profit: 0
        }
      });
    } catch (err) {
      console.error("PROFILE API FATAL ERROR:", err);
      return res.status(500).json({ error: "Failed to load profile" });
    }
  });
  app2.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { name, email, phone, whatsappSupportLink, whatsappChannelLink } = req.body;
      if (name !== void 0 || email !== void 0 || phone !== void 0) {
        await storage.updateUser(dbUser.id, {
          ...name !== void 0 && { name },
          ...email !== void 0 && { email },
          ...phone !== void 0 && { phone }
        });
      }
      const role = dbUser.role;
      if (role === UserRole.AGENT || role === UserRole.DEALER || role === UserRole.SUPER_DEALER || role === UserRole.MASTER) {
        const agent = await storage.getAgentByUserId(dbUser.id);
        if (agent && (whatsappSupportLink !== void 0 || whatsappChannelLink !== void 0)) {
          await storage.updateAgent(agent.id, {
            ...whatsappSupportLink !== void 0 && { whatsappSupportLink },
            ...whatsappChannelLink !== void 0 && { whatsappChannelLink }
          });
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.get("/api/agent/transactions", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const agentTransactions = await storage.getTransactions({
        agentId: agent.id,
        limit: 100
      });
      const walletTopups = await storage.getTransactions({
        customerEmail: dbUser.email,
        type: "wallet_topup",
        limit: 50
      });
      const allTransactions = [...agentTransactions, ...walletTopups].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
      res.json(allTransactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  app2.get("/api/agent/stats", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const role = dbUser.role;
      let stats;
      if (role === UserRole.AGENT || role === UserRole.DEALER || role === UserRole.SUPER_DEALER || role === UserRole.MASTER) {
        const agent = await storage.getAgentByUserId(dbUser.id);
        if (agent) {
          console.log(`[Agent Stats] Calculating stats for agent ${agent.id}, user ${dbUser.id}`);
          const agentTransactions = await storage.getTransactions({ agentId: agent.id });
          console.log(`[Agent Stats] Found ${agentTransactions.length} total transactions for agent ${agent.id}`);
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          const todayTransactions = agentTransactions.filter(
            (t) => new Date(t.createdAt) >= today && (t.status === "completed" || t.paymentStatus === "paid")
          );
          const todayProfit = todayTransactions.reduce((sum2, t) => sum2 + parseFloat(t.agentProfit || "0"), 0);
          const totalProfitResult = await db.select({
            total: sql2`coalesce(sum(cast(agent_profit as decimal(10,2))), 0)`
          }).from(transactions).where(and2(
            eq2(transactions.agentId, agent.id),
            or2(
              eq2(transactions.status, "completed"),
              eq2(transactions.paymentStatus, "paid")
            )
          ));
          const totalProfit = Number(totalProfitResult[0]?.total || 0);
          console.log(`[Agent Stats] totalProfitResult:`, totalProfitResult);
          console.log(`[Agent Stats] totalProfit calculated:`, totalProfit);
          const completedTransactions = await db.select().from(transactions).where(and2(
            eq2(transactions.agentId, agent.id),
            or2(
              eq2(transactions.status, "completed"),
              eq2(transactions.paymentStatus, "paid")
            )
          ));
          console.log(`[Agent Stats] Agent ${agent.id}: found ${completedTransactions.length} completed/paid transactions`);
          completedTransactions.forEach((t) => {
            console.log(`[Agent Stats] Transaction ${t.id}: agentProfit=${t.agentProfit}, status=${t.status}, paymentStatus=${t.paymentStatus}`);
          });
          console.log(`[Agent Stats] Agent ${agent.id}: totalProfit from transactions: ${totalProfit}, agent.totalProfit: ${agent.totalProfit}`);
          const withdrawals2 = await storage.getWithdrawals({ userId: dbUser.id });
          const withdrawnTotal = withdrawals2.filter((w) => w?.status === "paid").reduce((sum2, w) => sum2 + Number(w?.amount || 0), 0);
          const availableBalance = Math.max(0, totalProfit - withdrawnTotal);
          stats = {
            balance: availableBalance,
            // Available profit balance (after withdrawals)
            totalProfit,
            // Total profit from all transactions (not affected by withdrawals)
            totalSales: Number(agent.totalSales) || 0,
            totalTransactions: completedTransactions.length,
            todayProfit: Number(todayProfit.toFixed(2)),
            // Today's profit only (not affected by withdrawals)
            todayTransactions: todayTransactions.length
          };
        } else {
          stats = {
            balance: Number(dbUser.walletBalance) || 0,
            totalProfit: 0,
            totalSales: 0,
            totalTransactions: 0,
            todayProfit: 0,
            todayTransactions: 0
          };
        }
      } else {
        stats = {
          balance: Number(dbUser.walletBalance) || 0,
          totalProfit: 0,
          totalSales: 0,
          totalTransactions: 0,
          todayProfit: 0,
          todayTransactions: 0
        };
      }
      console.log("Stats for role", role, ":", JSON.stringify(stats, null, 2));
      res.json(stats);
    } catch (error) {
      console.error("Error loading stats:", error);
      res.status(500).json({ error: "Failed to load stats" });
    }
  });
  app2.get("/api/agent/performance-history", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const performanceData = [];
      const today = /* @__PURE__ */ new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const dayTransactions = await db.select().from(transactions).where(and2(
          eq2(transactions.agentId, agent.id),
          or2(
            eq2(transactions.status, "completed"),
            eq2(transactions.paymentStatus, "paid")
          ),
          gte2(transactions.createdAt, startOfDay),
          lte2(transactions.createdAt, endOfDay)
        ));
        const dayProfit = dayTransactions.reduce((sum2, t) => sum2 + parseFloat(t.agentProfit || "0"), 0);
        const dayTransactionCount = dayTransactions.length;
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
        performanceData.push({
          day: dayName,
          date: date.toISOString().split("T")[0],
          profit: Number(dayProfit.toFixed(2)),
          transactions: dayTransactionCount
        });
      }
      res.json(performanceData);
    } catch (error) {
      console.error("Error loading performance history:", error);
      res.status(500).json({ error: "Failed to load performance history" });
    }
  });
  app2.get("/api/agent/transactions/stats", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const agentTransactions = await storage.getTransactions({ agentId: agent.id });
      const walletTopups = await storage.getTransactions({
        customerEmail: dbUser.email,
        type: "wallet_topup"
      });
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const todayAgentTransactions = agentTransactions.filter((t) => new Date(t.createdAt) >= today);
      const totalRevenue = agentTransactions.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
      const totalProfit = agentTransactions.reduce((sum2, t) => sum2 + parseFloat(t.agentProfit || "0"), 0);
      const totalTransactions = agentTransactions.length + walletTopups.length;
      const todayTransactions = todayAgentTransactions.length + walletTopups.filter((t) => new Date(t.createdAt) >= today).length;
      const stats = {
        totalTransactions,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        todayTransactions
      };
      res.json(stats);
    } catch (error) {
      console.error("Error loading agent transaction stats:", error);
      res.status(500).json({ error: "Failed to load transaction stats" });
    }
  });
  app2.get("/api/agent/transactions/recent", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const role = dbUser.role;
      let transactions2 = [];
      if (role === UserRole.AGENT || role === UserRole.DEALER || role === UserRole.SUPER_DEALER || role === UserRole.MASTER) {
        const agent = await storage.getAgentByUserId(dbUser.id);
        if (agent) {
          transactions2 = await storage.getTransactions({
            agentId: agent.id,
            limit: 10
          });
        }
      }
      res.json(transactions2);
    } catch (error) {
      console.error("Error loading recent transactions:", error);
      res.status(500).json({ error: "Failed to load recent transactions" });
    }
  });
  app2.get("/api/agent/withdrawals", requireAuth, requireAgent, async (req, res) => {
    try {
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const withdrawals2 = await storage.getWithdrawals({ userId: dbUser.id }) || [];
      res.json(withdrawals2);
    } catch (err) {
      console.error("GET /withdrawals error:", err);
      res.status(500).json({ error: "Failed to load withdrawals" });
    }
  });
  app2.post("/api/agent/withdrawals", requireAuth, requireAgent, async (req, res) => {
    try {
      if (!req.user || !req.user.email) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const data = withdrawalRequestSchema.parse(req.body);
      if (data.amount < 10) {
        return res.status(400).json({ error: "Minimum withdrawal amount is GH\u20B510" });
      }
      if (data.amount > 1e5) {
        return res.status(400).json({ error: "Maximum withdrawal amount is GH\u20B5100,000" });
      }
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      if (!agent.isApproved) {
        return res.status(403).json({ error: "Agent not approved" });
      }
      const totalProfitResult = await db.select({
        total: sql2`coalesce(sum(cast(agent_profit as numeric)), 0)`
      }).from(transactions).where(and2(
        eq2(transactions.agentId, agent.id),
        or2(
          eq2(transactions.status, "completed"),
          eq2(transactions.paymentStatus, "paid")
        )
      ));
      const totalProfit = Number(totalProfitResult[0]?.total || 0);
      const withdrawals2 = await storage.getWithdrawals({ userId: dbUser.id });
      const withdrawnTotal = withdrawals2.filter((w) => w?.status === "paid").reduce((sum2, w) => sum2 + Number(w?.amount || 0), 0);
      const availableBalance = Math.max(0, totalProfit - withdrawnTotal);
      if (availableBalance < data.amount) {
        return res.status(400).json({
          error: "Insufficient profit balance",
          balance: availableBalance.toFixed(2),
          requested: data.amount.toFixed(2)
        });
      }
      const withdrawal = await storage.createWithdrawal({
        userId: dbUser.id,
        amount: data.amount.toFixed(2),
        status: WithdrawalStatus.PENDING,
        paymentMethod: data.paymentMethod,
        bankName: "",
        bankCode: "",
        accountNumber: data.accountNumber,
        accountName: data.accountName
      });
      res.json({
        ...withdrawal,
        message: "Withdrawal request submitted successfully. It will be processed after admin approval."
      });
    } catch (err) {
      console.error("POST /withdrawals error:", err);
      res.status(400).json({ error: err.message || "Withdrawal failed" });
    }
  });
  app2.patch("/api/agent/storefront", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const { businessName, businessDescription, whatsappSupportLink, whatsappChannelLink } = req.body;
      const updatedAgent = await storage.updateAgent(agent.id, {
        businessName,
        businessDescription,
        whatsappSupportLink,
        whatsappChannelLink
      });
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update storefront" });
    }
  });
  app2.get("/api/agent/pricing", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const pricing = await storage.getCustomPricing(agent.id, "agent");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find((p) => p.productId === bundle.id);
        const agentRoleBasePrice = await storage.getRoleBasePrice(bundle.id, "agent");
        let basePrice = agentRoleBasePrice;
        if (!basePrice) {
          const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
          basePrice = adminBasePrice || bundle.basePrice;
        }
        const profit = customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(basePrice || "0")).toFixed(2) : "0";
        return {
          bundleId: bundle.id,
          agentPrice: customPrice?.sellingPrice || "",
          adminBasePrice: basePrice,
          agentProfit: profit
        };
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  app2.post("/api/agent/pricing", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== "object") {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData;
        if (!priceObj.agentPrice || priceObj.agentPrice.trim() === "") {
          await storage.deleteCustomPricing(bundleId, agent.id, "agent");
        } else {
          const bundle = await storage.getDataBundle(bundleId);
          const agentRoleBasePrice = await storage.getRoleBasePrice(bundleId, "agent");
          const basePrice = agentRoleBasePrice || await storage.getAdminBasePrice(bundleId) || bundle?.basePrice || "0";
          const sellingPrice = parseFloat(priceObj.agentPrice);
          const basePriceNum = parseFloat(basePrice);
          const calculatedProfit = Math.max(0, sellingPrice - basePriceNum).toFixed(2);
          await storage.setCustomPricing(bundleId, agent.id, "agent", priceObj.agentPrice, calculatedProfit);
        }
      }
      const updatedPricing = await storage.getCustomPricing(agent.id, "agent");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find((p) => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          agentPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          agentProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  app2.get("/api/agent/wallet", requireAuth, requireAgent, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const agent = await storage.getAgentByUserId(dbUser.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const transactions2 = await storage.getTransactions({
        agentId: agent.id
      });
      const walletTopups = transactions2.filter((t) => t.type === "wallet_topup" && t.status === "completed");
      const totalTopups = walletTopups.length;
      const totalTopupAmount = walletTopups.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
      const walletPayments = transactions2.filter((t) => t.paymentMethod === "wallet");
      const totalSpent = walletPayments.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
      const lastTopup = walletTopups.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      const withdrawals2 = await storage.getWithdrawals({ userId: dbUser.id });
      const withdrawnTotal = withdrawals2.filter((w) => w.status === "paid").reduce((s, w) => s + parseFloat(w.amount || 0), 0);
      const totalProfit = parseFloat(agent.totalProfit || "0");
      const profitBalance = Math.max(0, totalProfit - withdrawnTotal);
      res.json({
        balance: profitBalance.toFixed(2),
        // Agent's withdrawable profit balance
        totalTopups,
        totalTopupAmount: totalTopupAmount.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        lastTopupDate: lastTopup?.createdAt || null,
        lastTopupAmount: lastTopup?.amount || null
      });
    } catch (error) {
      console.error("Error loading agent wallet stats:", error);
      res.status(500).json({ error: "Failed to load wallet stats" });
    }
  });
  app2.get("/api/dealer/pricing", requireAuth, requireDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const pricing = await storage.getCustomPricing(dbUser.id, "dealer");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find((p) => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          dealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          dealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  app2.post("/api/dealer/pricing", requireAuth, requireDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== "object") {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData;
        if (!priceObj.dealerPrice || priceObj.dealerPrice.trim() === "") {
          await storage.deleteCustomPricing(bundleId, dbUser.id, "dealer");
        } else {
          await storage.setCustomPricing(bundleId, dbUser.id, "dealer", priceObj.dealerPrice);
        }
      }
      const updatedPricing = await storage.getCustomPricing(dbUser.id, "dealer");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find((p) => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          dealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          dealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  app2.get("/api/super-dealer/pricing", requireAuth, requireSuperDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const pricing = await storage.getCustomPricing(dbUser.id, "super_dealer");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find((p) => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          superDealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          superDealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  app2.post("/api/super-dealer/pricing", requireAuth, requireSuperDealer, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== "object") {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData;
        if (!priceObj.superDealerPrice || priceObj.superDealerPrice.trim() === "") {
          await storage.deleteCustomPricing(bundleId, dbUser.id, "super_dealer");
        } else {
          await storage.setCustomPricing(bundleId, dbUser.id, "super_dealer", priceObj.superDealerPrice);
        }
      }
      const updatedPricing = await storage.getCustomPricing(dbUser.id, "super_dealer");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find((p) => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          superDealerPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          superDealerProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  app2.get("/api/master/pricing", requireAuth, requireMaster, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const pricing = await storage.getCustomPricing(dbUser.id, "master");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = pricing.find((p) => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          masterPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          masterProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to load pricing" });
    }
  });
  app2.post("/api/master/pricing", requireAuth, requireMaster, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { prices } = req.body;
      if (!prices || typeof prices !== "object") {
        return res.status(400).json({ error: "Invalid pricing data" });
      }
      for (const [bundleId, priceData] of Object.entries(prices)) {
        const priceObj = priceData;
        if (!priceObj.masterPrice || priceObj.masterPrice.trim() === "") {
          await storage.deleteCustomPricing(bundleId, dbUser.id, "master");
        } else {
          await storage.setCustomPricing(bundleId, dbUser.id, "master", priceObj.masterPrice);
        }
      }
      const updatedPricing = await storage.getCustomPricing(dbUser.id, "master");
      const bundles = await storage.getDataBundles({ isActive: true });
      const result = await Promise.all(bundles.map(async (bundle) => {
        const customPrice = updatedPricing.find((p) => p.productId === bundle.id);
        const adminBasePrice = await storage.getAdminBasePrice(bundle.id);
        return {
          bundleId: bundle.id,
          masterPrice: customPrice?.sellingPrice || "",
          adminBasePrice: adminBasePrice || bundle.basePrice,
          masterProfit: customPrice ? (parseFloat(customPrice.sellingPrice) - parseFloat(adminBasePrice || bundle.basePrice)).toFixed(2) : "0"
        };
      }));
      res.json(result);
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });
  app2.get("/api/admin/stats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      let paystackBalance = 0;
      const paystackSecretKey = await storage.getSetting("paystack.secret_key") || process.env.PAYSTACK_SECRET_KEY || "";
      const paystackMode = paystackSecretKey.startsWith("sk_test_") ? "test" : "live";
      if (paystackSecretKey) {
        try {
          const balanceResponse = await fetch("https://api.paystack.co/balance", {
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`
            }
          });
          const balanceData = await balanceResponse.json();
          if (balanceData.status && Array.isArray(balanceData.data)) {
            paystackBalance = balanceData.data.filter((balance) => balance.currency === "GHS").reduce((sum2, balance) => {
              return sum2 + (balance.balance || 0);
            }, 0) / 100;
          }
        } catch (err) {
        }
      }
      res.json({ ...stats, paystackBalance, paystackMode });
    } catch (error) {
      res.status(500).json({ error: "Failed to load stats" });
    }
  });
  app2.get("/api/admin/analytics/revenue", requireAuth, requireAdmin, async (req, res) => {
    try {
      const rawDays = parseInt(req.query.days, 10);
      const analytics = await storage.getRevenueAnalytics(Number.isFinite(rawDays) ? rawDays : 7);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ error: "Failed to load analytics" });
    }
  });
  app2.get("/api/admin/rankings/customers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const topCustomers = await storage.getTopCustomers(limit);
      res.json(topCustomers);
    } catch (error) {
      console.error("Error fetching top customers:", error);
      res.status(500).json({ error: "Failed to load rankings" });
    }
  });
  app2.get("/api/rankings/customers", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const topCustomers = await storage.getTopCustomers(limit);
      if (!Array.isArray(topCustomers)) {
        return res.status(500).json({ error: "Invalid data format" });
      }
      const publicRankings = topCustomers.map((customer) => {
        let displayName = customer.customerName || "";
        if (!displayName && customer.customerEmail) {
          const [localPart] = customer.customerEmail.split("@");
          displayName = localPart.length > 3 ? localPart.substring(0, 3) + "***" : localPart + "***";
        }
        let displayPhone = "";
        if (customer.customerPhone && customer.customerPhone.length > 6) {
          displayPhone = customer.customerPhone.substring(0, 3) + "***" + customer.customerPhone.slice(-3);
        }
        return {
          rank: customer.rank,
          displayName,
          displayPhone,
          totalPurchases: customer.totalPurchases,
          totalSpent: customer.totalSpent,
          lastPurchase: customer.lastPurchase
        };
      });
      res.json(publicRankings);
    } catch (error) {
      console.error("Error fetching public rankings:", error);
      res.status(500).json({ error: "Failed to load rankings" });
    }
  });
  app2.get("/api/admin/transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = req.query.status;
      const transactions2 = await storage.getTransactions({ status, limit: 200 });
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  app2.patch("/api/admin/transactions/:id/delivery-status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { deliveryStatus } = req.body;
      if (!["pending", "processing", "delivered", "failed"].includes(deliveryStatus)) {
        return res.status(400).json({ error: "Invalid delivery status" });
      }
      const transaction = await storage.updateTransactionDeliveryStatus(req.params.id, deliveryStatus);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to update delivery status" });
    }
  });
  app2.get("/api/admin/transactions/export", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { paymentStatus = "all" } = req.query;
      let paymentStatusFilter;
      if (paymentStatus === "paid") {
        paymentStatusFilter = ["paid"];
      } else if (paymentStatus === "pending") {
        paymentStatusFilter = ["pending"];
      } else if (paymentStatus === "all") {
        paymentStatusFilter = void 0;
      } else {
        return res.status(400).json({ error: "Invalid payment status filter. Use 'paid', 'pending', or 'all'" });
      }
      const transactions2 = await storage.getTransactionsForExport(paymentStatusFilter);
      const csvData = transactions2.map((tx) => ({
        reference: tx.reference,
        productName: tx.productName,
        network: tx.network,
        amount: tx.amount,
        profit: tx.profit,
        customerPhone: tx.customerPhone,
        customerEmail: tx.customerEmail,
        paymentStatus: tx.paymentStatus,
        deliveryStatus: tx.deliveryStatus || "pending",
        createdAt: tx.createdAt,
        completedAt: tx.completedAt || "",
        phoneNumbers: tx.phoneNumbers && Array.isArray(tx.phoneNumbers) ? tx.phoneNumbers.map((p) => p.phone).join("; ") : "",
        isBulkOrder: tx.isBulkOrder ? "Yes" : "No"
      }));
      res.json(csvData);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to export transactions" });
    }
  });
  app2.get("/api/admin/agents", requireAuth, requireAdmin, async (req, res) => {
    try {
      const agents2 = await storage.getAgents();
      const agentsWithUsers = await Promise.all(agents2.map(async (agent) => {
        const user = await storage.getUser(agent.userId);
        return {
          ...agent,
          user: user ? { name: user.name, email: user.email, phone: user.phone } : null
        };
      }));
      res.json(agentsWithUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to load agents" });
    }
  });
  app2.patch("/api/admin/agents/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { isApproved } = req.body;
      const agent = await storage.updateAgent(req.params.id, { isApproved });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update agent" });
    }
  });
  app2.patch("/api/admin/agents/:id/whatsapp", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { whatsappSupportLink, whatsappChannelLink } = req.body;
      const agent = await storage.updateAgent(req.params.id, {
        whatsappSupportLink: whatsappSupportLink || null,
        whatsappChannelLink: whatsappChannelLink || null
      });
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update WhatsApp links" });
    }
  });
  app2.delete("/api/admin/agents/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      const user = await storage.getUser(agent.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const userId = agent.userId;
      console.log(`Starting permanent deletion of agent ${req.params.id} and user ${userId}`);
      console.log("Deleting agent from database...");
      await storage.deleteAgent(req.params.id);
      console.log("Agent deleted from database");
      console.log("Deleting user from database...");
      await storage.deleteUser(userId);
      console.log("User deleted from database");
      console.log("Deleting user from Supabase Auth...");
      const { error: authError } = await supabaseServer2.auth.admin.deleteUser(userId);
      if (authError) {
        console.error("Failed to delete user from Supabase Auth:", authError);
        return res.status(500).json({
          error: "User deleted from database but failed to delete from authentication. Please try again.",
          details: authError.message
        });
      }
      console.log(`User ${userId} permanently deleted from Supabase Auth`);
      res.json({
        message: "Agent and user permanently deleted from database and authentication",
        deletedAgentId: req.params.id,
        deletedUserId: userId
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      res.status(500).json({
        error: "Failed to delete agent",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const usersWithPurchaseData = await Promise.all(allUsers.map(async (user) => {
        const transactions2 = await storage.getTransactions({
          customerEmail: user.email,
          status: TransactionStatus.COMPLETED
        });
        const sortedTransactions = transactions2.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastPurchase = sortedTransactions.length > 0 ? {
          date: sortedTransactions[0].createdAt,
          amount: parseFloat(sortedTransactions[0].amount),
          productType: sortedTransactions[0].type
        } : null;
        const totalSpent = sortedTransactions.reduce(
          (sum2, t) => sum2 + parseFloat(t.amount),
          0
        );
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
          lastPurchase,
          totalPurchases: sortedTransactions.length,
          totalSpent
        };
      }));
      res.json(usersWithPurchaseData);
    } catch (error) {
      res.status(500).json({ error: "Failed to load users" });
    }
  });
  app2.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role === UserRole.ADMIN) {
        return res.status(403).json({ error: "Cannot delete admin users" });
      }
      const userId = req.params.id;
      console.log(`Starting permanent deletion of user ${userId}`);
      if (user.role === UserRole.AGENT) {
        const agent = await storage.getAgentByUserId(userId);
        if (agent) {
          console.log("Deleting agent record:", agent.id);
          await storage.deleteAgent(agent.id);
          console.log("Agent record deleted:", agent.id);
        }
      }
      console.log("Deleting user from database...");
      await storage.deleteUser(userId);
      console.log("User deleted from database");
      console.log("Deleting user from Supabase Auth...");
      const { error: authError } = await supabaseServer2.auth.admin.deleteUser(userId);
      if (authError) {
        console.error("Failed to delete user from Supabase Auth:", authError);
        return res.status(500).json({
          error: "User deleted from database but failed to delete from authentication. Please try again.",
          details: authError.message
        });
      }
      console.log(`User ${userId} permanently deleted from Supabase Auth`);
      res.json({
        message: "User permanently deleted from database and authentication",
        deletedUserId: userId
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        error: "Failed to delete user",
        details: error.message
      });
    }
  });
  app2.patch("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;
      const validRoles = ["admin", "agent", "dealer", "super_dealer", "master", "user", "guest"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const oldRole = currentUser.role;
      const user = await storage.updateUser(userId, { role });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (oldRole === "agent" && role !== "agent") {
        const agent = await storage.getAgentByUserId(userId);
        if (agent) {
          await storage.updateAgent(agent.id, { isApproved: false });
          console.log(`Deactivated agent record for user ${userId} due to role change from ${oldRole} to ${role}`);
        }
      } else if (oldRole !== "agent" && oldRole !== "dealer" && oldRole !== "super_dealer" && oldRole !== "master" && (role === "agent" || role === "dealer" || role === "super_dealer" || role === "master")) {
        const existingAgent = await storage.getAgentByUserId(userId);
        if (!existingAgent) {
          await storage.createAgent({
            userId,
            storefrontSlug: `${user.name?.toLowerCase().replace(/\s+/g, "") || "user"}${userId.slice(-4)}`,
            businessName: `${user.name || "User"}'s Store`,
            isApproved: true,
            // Auto approve since admin changed role
            paymentPending: false
            // No payment needed
          });
          console.log(`Created and auto-approved agent record for user ${userId} due to role change to ${role}`);
        } else if (!existingAgent.isApproved) {
          await storage.updateAgent(existingAgent.id, { isApproved: true, paymentPending: false });
          console.log(`Reactivated agent record for user ${userId}`);
        }
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  });
  app2.delete("/api/admin/users/delete-inactive", requireAuth, requireAdmin, async (req, res) => {
    try {
      const days = parseInt(req.query.days);
      if (!days || days <= 0) {
        return res.status(400).json({ error: "Invalid days parameter. Must be a positive integer." });
      }
      const thresholdDate = /* @__PURE__ */ new Date();
      thresholdDate.setDate(thresholdDate.getDate() - days);
      const allUsers = await storage.getUsers();
      const supabaseServer2 = getSupabase();
      if (!supabaseServer2) {
        return res.status(500).json({ error: "Server configuration error" });
      }
      const inactiveUsers = [];
      for (const user of allUsers) {
        if (user.role === UserRole.ADMIN) continue;
        const transactions2 = await storage.getTransactions({
          customerEmail: user.email,
          status: TransactionStatus.COMPLETED
        });
        if (transactions2.length === 0) {
          inactiveUsers.push(user);
        } else {
          const lastTransaction = transactions2.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          if (new Date(lastTransaction.createdAt) < thresholdDate) {
            inactiveUsers.push(user);
          }
        }
      }
      let deletedCount = 0;
      const errors = [];
      for (const user of inactiveUsers) {
        try {
          console.log(`Deleting inactive user ${user.id}`);
          if (user.role === UserRole.AGENT) {
            const agent = await storage.getAgentByUserId(user.id);
            if (agent) {
              await storage.deleteAgent(agent.id);
            }
          }
          await storage.deleteUser(user.id);
          const { error: authError } = await supabaseServer2.auth.admin.deleteUser(user.id);
          if (authError) {
            console.error(`Failed to delete user ${user.id} from Supabase Auth:`, authError);
            errors.push(`Failed to delete ${user.email} from auth: ${authError.message}`);
          } else {
            deletedCount++;
          }
        } catch (error) {
          console.error(`Error deleting user ${user.id}:`, error);
          errors.push(`Failed to delete ${user.email}: ${error.message}`);
        }
      }
      res.json({
        message: `Deleted ${deletedCount} inactive users`,
        deletedCount,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      console.error("Error deleting inactive users:", error);
      res.status(500).json({
        error: "Failed to delete inactive users",
        details: error.message
      });
    }
  });
  app2.get("/api/admin/users-agents", requireAuthJWT, requireAdminJWT, async (req, res) => {
    try {
      const allUsers = await storage.getUsers().then((users3) => users3.map((user) => ({
        ...user,
        walletBalance: parseFloat(user.walletBalance || "0")
      })));
      const agents2 = await storage.getAgents();
      const agentsWithUsers = await Promise.all(agents2.map(async (agent) => {
        const user = await storage.getUser(agent.userId);
        return user ? {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          walletBalance: parseFloat(user.walletBalance || "0"),
          createdAt: user.createdAt
        } : null;
      })).then((results) => results.filter(Boolean));
      const userMap = /* @__PURE__ */ new Map();
      [...allUsers, ...agentsWithUsers].forEach((user) => {
        if (user) {
          userMap.set(user.id, user);
        }
      });
      const combinedUsers = Array.from(userMap.values());
      res.json(combinedUsers);
    } catch (error) {
      console.error("Error fetching users and agents:", error);
      res.status(500).json({ error: "Failed to load users and agents" });
    }
  });
  app2.post("/api/admin/manual-topup", requireAuthJWT, requireAdminJWT, async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount || !reason) {
        return res.status(400).json({ error: "User ID, amount, and reason are required" });
      }
      const topupAmount = parseFloat(amount);
      if (isNaN(topupAmount) || topupAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const currentBalance = parseFloat(user.walletBalance || "0");
      const newBalance = currentBalance + topupAmount;
      try {
        await storage.updateUser(userId, { walletBalance: newBalance.toFixed(2) });
      } catch (updateError) {
        console.error("Error updating user wallet:", updateError);
        return res.status(500).json({ error: "Failed to update user wallet" });
      }
      let walletTopupRecord;
      try {
        walletTopupRecord = await storage.createWalletTopupTransaction({
          userId,
          adminId: req.user.id,
          amount: topupAmount.toFixed(2),
          reason: reason || null
        });
      } catch (topupError) {
        console.error("Error creating wallet topup transaction:", topupError);
        return res.status(500).json({ error: "Failed to create topup record" });
      }
      try {
        const transactionRef = `MANUAL_TOPUP_${walletTopupRecord.id.substring(0, 8)}`;
        await storage.createTransaction({
          reference: transactionRef,
          type: "wallet_topup",
          productId: walletTopupRecord.id,
          productName: "Manual Wallet Top-up",
          network: null,
          amount: topupAmount.toFixed(2),
          profit: "0.00",
          customerPhone: user.phone || null,
          customerEmail: user.email,
          paymentMethod: "admin",
          status: TransactionStatus.COMPLETED,
          paymentReference: transactionRef,
          agentId: null,
          agentProfit: "0.00"
        });
      } catch (transactionError) {
        console.error("Error creating transaction record:", transactionError);
      }
      try {
        await storage.createAuditLog({
          userId: req.user.id,
          action: "MANUAL_WALLET_TOPUP",
          entityType: "user",
          entityId: userId,
          oldValue: currentBalance.toFixed(2),
          newValue: newBalance.toFixed(2),
          ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
          userAgent: req.get("User-Agent") || "unknown"
        });
      } catch (auditError) {
        console.error("Error creating audit log:", auditError);
      }
      res.json({
        success: true,
        userName: user.name,
        amount: topupAmount,
        newBalance,
        walletTopupRecord
      });
    } catch (error) {
      console.error("Error processing manual top-up:", error);
      res.status(500).json({ error: "Failed to process manual top-up" });
    }
  });
  app2.post("/api/admin/manual-deduct", requireAuthJWT, requireAdminJWT, async (req, res) => {
    try {
      const { userId, amount, reason } = req.body;
      if (!userId || !amount || !reason) {
        return res.status(400).json({ error: "User ID, amount, and reason are required" });
      }
      const deductAmount = parseFloat(amount);
      if (isNaN(deductAmount) || deductAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const currentBalance = parseFloat(user.walletBalance || "0");
      if (currentBalance < deductAmount) {
        return res.status(400).json({
          error: "Insufficient balance",
          currentBalance: currentBalance.toFixed(2),
          requestedAmount: deductAmount.toFixed(2)
        });
      }
      const newBalance = currentBalance - deductAmount;
      try {
        await storage.updateUser(userId, { walletBalance: newBalance.toFixed(2) });
      } catch (updateError) {
        console.error("Error updating user wallet:", updateError);
        return res.status(500).json({ error: "Failed to update user wallet" });
      }
      let walletDeductionRecord;
      try {
        walletDeductionRecord = await storage.createWalletDeductionTransaction({
          userId,
          adminId: req.user.id,
          amount: deductAmount.toFixed(2),
          reason: reason || null
        });
      } catch (deductError) {
        console.error("Error creating wallet deduction transaction:", deductError);
        await storage.updateUser(userId, { walletBalance: currentBalance.toFixed(2) });
        return res.status(500).json({ error: "Failed to create deduction record" });
      }
      try {
        const transactionRef = `MANUAL_DEDUCT_${walletDeductionRecord.id.substring(0, 8)}`;
        await storage.createTransaction({
          reference: transactionRef,
          type: "wallet_deduction",
          productId: walletDeductionRecord.id,
          productName: "Manual Wallet Deduction",
          network: null,
          amount: `-${deductAmount.toFixed(2)}`,
          profit: "0.00",
          customerPhone: user.phone || null,
          customerEmail: user.email,
          paymentMethod: "admin",
          status: TransactionStatus.COMPLETED,
          paymentReference: transactionRef,
          agentId: null,
          agentProfit: "0.00"
        });
      } catch (transactionError) {
        console.error("Error creating transaction record:", transactionError);
      }
      try {
        await storage.createAuditLog({
          userId: req.user.id,
          action: "MANUAL_WALLET_DEDUCTION",
          entityType: "user",
          entityId: userId,
          oldValue: currentBalance.toFixed(2),
          newValue: newBalance.toFixed(2),
          ipAddress: req.ip || req.connection?.remoteAddress || "unknown",
          userAgent: req.get("User-Agent") || "unknown"
        });
      } catch (auditError) {
        console.error("Error creating audit log:", auditError);
      }
      res.json({
        success: true,
        userName: user.name,
        amount: deductAmount,
        newBalance,
        walletDeductionRecord
      });
    } catch (error) {
      console.error("Error processing manual deduction:", error);
      res.status(500).json({ error: "Failed to process manual deduction" });
    }
  });
  app2.get("/api/admin/announcements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const announcements2 = await storage.getAnnouncements();
      res.json(announcements2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load announcements" });
    }
  });
  app2.post("/api/admin/announcements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, message, audiences } = req.body;
      console.log("Received announcement request:", { title, message, audiences });
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const audienceArray = Array.isArray(audiences) && audiences.length > 0 ? audiences : ["all"];
      console.log("Saving audiences as:", audienceArray, "JSON:", JSON.stringify(audienceArray));
      const announcement = await storage.createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        audiences: JSON.stringify(audienceArray),
        isActive: true,
        createdBy: dbUser.name || dbUser.email
      });
      console.log("Created announcement:", announcement);
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });
  app2.patch("/api/admin/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { isActive } = req.body;
      const announcement = await storage.updateAnnouncement(req.params.id, { isActive });
      if (!announcement) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });
  app2.delete("/api/admin/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteAnnouncement(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Announcement not found" });
      }
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });
  app2.get("/api/announcements/active", async (req, res) => {
    try {
      const announcements2 = await storage.getActiveAnnouncements();
      res.json(announcements2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load announcements" });
    }
  });
  app2.get("/api/guides", async (req, res) => {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : void 0;
      const guides = await storage.getVideoGuides({ category, publishedOnly: true });
      res.json(guides);
    } catch (error) {
      res.status(500).json({ error: "Failed to load guides" });
    }
  });
  app2.get("/api/admin/guides", requireAuth, requireAdmin, async (req, res) => {
    try {
      const category = typeof req.query.category === "string" ? req.query.category : void 0;
      const publishedOnly = req.query.publishedOnly === "true";
      const guides = await storage.getVideoGuides({ category, publishedOnly });
      res.json(guides);
    } catch (error) {
      res.status(500).json({ error: "Failed to load guides" });
    }
  });
  app2.post("/api/admin/guides", requireAuth, requireAdmin, async (req, res) => {
    try {
      console.log("Creating guide with body:", req.body);
      const parsed = insertVideoGuideSchema.safeParse(req.body);
      if (!parsed.success) {
        console.error("Video guide validation error:", parsed.error.errors);
        return res.status(400).json({ error: parsed.error.errors.map((e) => e.message).join(", ") });
      }
      const { url } = parsed.data;
      let provider = parsed.data.provider;
      if (!provider) {
        if (url.includes("youtube.com") || url.includes("youtu.be")) provider = "youtube";
        else if (url.includes("vimeo.com")) provider = "vimeo";
        else if (url.endsWith(".mp4")) provider = "mp4";
        else provider = "other";
      }
      const created = await storage.createVideoGuide({ ...parsed.data, provider });
      res.json(created);
    } catch (error) {
      console.error("Create video guide error:", error);
      res.status(500).json({ error: error?.message || "Failed to create guide" });
    }
  });
  app2.patch("/api/admin/guides/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const updated = await storage.updateVideoGuide(id, req.body || {});
      if (!updated) return res.status(404).json({ error: "Guide not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update guide" });
    }
  });
  app2.delete("/api/admin/guides/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      const success = await storage.deleteVideoGuide(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete guide" });
    }
  });
  app2.get("/api/admin/withdrawals", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const filters = {};
      if (status && typeof status === "string") {
        filters.status = status;
      }
      const withdrawals2 = await storage.getWithdrawals(filters);
      const withdrawalsWithUsers = await Promise.all(
        withdrawals2.map(async (withdrawal) => {
          try {
            const user = await storage.getUser(withdrawal.userId);
            let agentInfo = null;
            try {
              const agent = await storage.getAgentByUserId(withdrawal.userId);
              if (agent) {
                agentInfo = { businessName: agent.businessName, storefrontSlug: agent.storefrontSlug };
              }
            } catch (agentError) {
              console.log(`No agent record found for user ${withdrawal.userId}:`, agentError);
            }
            return {
              ...withdrawal,
              user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
              agent: agentInfo
            };
          } catch (error) {
            console.error(`Error processing withdrawal ${withdrawal.id}:`, error);
            return {
              ...withdrawal,
              user: null,
              agent: null
            };
          }
        })
      );
      res.json(withdrawalsWithUsers);
    } catch (error) {
      console.error("Admin withdrawals error:", error);
      res.status(500).json({ error: "Failed to load withdrawals" });
    }
  });
  app2.patch("/api/admin/withdrawals/:id/status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["pending", "paid", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be 'pending', 'paid', or 'cancelled'" });
      }
      const withdrawal = await storage.getWithdrawal(req.params.id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      const oldStatus = withdrawal.status;
      const updatedWithdrawal = await storage.updateWithdrawal(req.params.id, { status });
      if (status === "paid" && oldStatus !== "paid") {
        const profitWallet = await storage.getProfitWallet(withdrawal.userId);
        if (profitWallet) {
          const amount = parseFloat(withdrawal.amount);
          const currentAvailable = parseFloat(profitWallet.availableBalance);
          const newAvailableBalance = Math.max(0, currentAvailable - amount).toFixed(2);
          await storage.updateProfitWallet(withdrawal.userId, {
            availableBalance: newAvailableBalance
          });
          console.log(`Deducted ${amount} from profit wallet for user ${withdrawal.userId}, new balance: ${newAvailableBalance}`);
        }
      }
      if (oldStatus === "paid" && status !== "paid") {
        const profitWallet = await storage.getProfitWallet(withdrawal.userId);
        if (profitWallet) {
          const amount = parseFloat(withdrawal.amount);
          const currentAvailable = parseFloat(profitWallet.availableBalance);
          const newAvailableBalance = (currentAvailable + amount).toFixed(2);
          await storage.updateProfitWallet(withdrawal.userId, {
            availableBalance: newAvailableBalance
          });
          console.log(`Added back ${amount} to profit wallet for user ${withdrawal.userId}, new balance: ${newAvailableBalance}`);
        }
      }
      res.json(updatedWithdrawal);
    } catch (error) {
      console.error("Admin update withdrawal status error:", error);
      res.status(500).json({ error: "Failed to update withdrawal status" });
    }
  });
  app2.get("/api/admin/data-bundles", requireAuth, requireAdmin, async (req, res) => {
    try {
      const bundles = await storage.getDataBundles();
      res.json(bundles);
    } catch (error) {
      res.status(500).json({ error: "Failed to load data bundles" });
    }
  });
  app2.post("/api/admin/data-bundles", requireAuth, requireAdmin, async (req, res) => {
    try {
      const bundle = await storage.createDataBundle(req.body);
      res.json(bundle);
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to create data bundle" });
    }
  });
  app2.patch("/api/admin/data-bundles/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const bundle = await storage.updateDataBundle(req.params.id, req.body);
      if (!bundle) {
        return res.status(404).json({ error: "Data bundle not found" });
      }
      res.json(bundle);
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to update data bundle" });
    }
  });
  app2.delete("/api/admin/data-bundles/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteDataBundle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete data bundle" });
    }
  });
  app2.get("/api/admin/role-base-prices", requireAuth, requireAdmin, async (req, res) => {
    try {
      const roleBasePrices2 = await storage.getRoleBasePrices();
      res.json(roleBasePrices2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load role base prices" });
    }
  });
  app2.post("/api/admin/role-base-prices", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { bundleId, role, basePrice } = req.body;
      if (!bundleId || !role || !basePrice) {
        return res.status(400).json({ error: "Bundle ID, role, and base price are required" });
      }
      const price = parseFloat(basePrice);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "Invalid base price" });
      }
      const validRoles = ["agent", "dealer", "super_dealer", "master"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      await storage.setRoleBasePrice(bundleId, role, price.toFixed(2), req.user.role);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to set role base price" });
    }
  });
  app2.delete("/api/admin/role-base-prices/:bundleId/:role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { bundleId, role } = req.params;
      await storage.setRoleBasePrice(bundleId, role, "0.00", req.user.role);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role base price" });
    }
  });
  app2.get("/api/admin/result-checkers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const type = req.query.type;
      const year = req.query.year ? parseInt(req.query.year) : void 0;
      const isSold = req.query.isSold === "true" ? true : req.query.isSold === "false" ? false : void 0;
      const checkers = await storage.getResultCheckers({ type, year, isSold });
      res.json(checkers);
    } catch (error) {
      res.status(500).json({ error: "Failed to load result checkers" });
    }
  });
  app2.post("/api/admin/result-checkers/bulk", requireAuth, requireAdmin, async (req, res) => {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const { type, year, basePrice, costPrice, checkers: checkersStr } = req.body;
      if (!type || !year || !basePrice || !costPrice || !checkersStr) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (typeof type !== "string" || typeof checkersStr !== "string") {
        return res.status(400).json({ error: "Invalid field types" });
      }
      const yearNum = parseInt(year);
      const basePriceNum = parseFloat(basePrice);
      if (isNaN(yearNum) || yearNum < 2e3 || yearNum > 2100) {
        return res.status(400).json({ error: "Invalid year" });
      }
      if (isNaN(basePriceNum) || basePriceNum <= 0 || basePriceNum > 1e4) {
        return res.status(400).json({ error: "Invalid base price" });
      }
      const lines = checkersStr.split("\n").filter((line) => line.trim());
      const checkersData = lines.map((line) => {
        const [serialNumber, pin] = line.split(",").map((s) => s.trim());
        return {
          type,
          year: parseInt(year),
          serialNumber,
          pin,
          basePrice
        };
      }).filter((c) => c.serialNumber && c.pin);
      if (checkersData.length === 0) {
        return res.status(400).json({ error: "No valid checkers provided" });
      }
      const created = await storage.createResultCheckersBulk(checkersData);
      res.json({ added: created.length });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to create result checkers" });
    }
  });
  app2.post("/api/admin/result-checkers/bulk-upload", requireAuth, requireAdmin, multer({ storage: multer.memoryStorage() }).single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const { type, year, basePrice, costPrice } = req.body;
      if (!type || !year || !basePrice || !costPrice) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const csvContent = req.file.buffer.toString("utf-8");
      const lines = csvContent.split("\n").filter((line) => line.trim());
      const checkersData = lines.map((line) => {
        const [serialNumber, pin] = line.split(",").map((s) => s.trim());
        return {
          type,
          year: parseInt(year),
          serialNumber,
          pin,
          basePrice
        };
      }).filter((c) => c.serialNumber && c.pin);
      if (checkersData.length === 0) {
        return res.status(400).json({ error: "No valid checkers found in CSV" });
      }
      const created = await storage.createResultCheckersBulk(checkersData);
      res.json({ added: created.length });
    } catch (error) {
      console.error("CSV upload error:", error);
      res.status(400).json({ error: error.message || "Failed to upload CSV" });
    }
  });
  app2.delete("/api/admin/result-checkers/sold", requireAuth, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteSoldCheckers();
      res.json({ deleted });
    } catch (error) {
      console.error("Delete sold checkers error:", error);
      res.status(500).json({ error: error.message || "Failed to delete sold checkers" });
    }
  });
  app2.get("/api/admin/result-checkers/summary", requireAuth, requireAdmin, async (req, res) => {
    try {
      const summary = await storage.getResultCheckerSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to load summary" });
    }
  });
  app2.put("/api/admin/result-checkers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { type, year, serialNumber, pin, basePrice } = req.body;
      const updateData = {};
      if (type !== void 0) updateData.type = type;
      if (year !== void 0) updateData.year = year;
      if (serialNumber !== void 0) updateData.serialNumber = serialNumber;
      if (pin !== void 0) updateData.pin = pin;
      if (basePrice !== void 0) updateData.basePrice = basePrice;
      const checker = await storage.updateResultChecker(id, updateData);
      if (!checker) {
        return res.status(404).json({ error: "Result checker not found" });
      }
      res.json(checker);
    } catch (error) {
      res.status(500).json({ error: "Failed to update result checker" });
    }
  });
  app2.delete("/api/admin/result-checkers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteResultChecker(id);
      if (!deleted) {
        return res.status(404).json({ error: "Result checker not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete result checker" });
    }
  });
  app2.get("/api/admin/transactions/recent", requireAuth, requireAdmin, async (req, res) => {
    try {
      const transactions2 = await storage.getTransactions({ limit: 10 });
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load recent transactions" });
    }
  });
  app2.post("/api/seed/products", requireAuth, requireAdmin, async (req, res) => {
    try {
      const existingBundles = await storage.getDataBundles({});
      const existingCheckers = await storage.getResultCheckers({});
      let bundlesSeeded = 0;
      let checkersSeeded = 0;
      if (existingBundles.length === 0) {
        const sampleBundles = [
          { name: "Daily Lite", network: "mtn", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", agentPrice: "1.80", dealerPrice: "1.70", superDealerPrice: "1.60", masterPrice: "1.50", adminPrice: "1.40" },
          { name: "Daily Plus", network: "mtn", dataAmount: "1GB", validity: "1 Day", basePrice: "3.50", agentPrice: "3.15", dealerPrice: "2.98", superDealerPrice: "2.80", masterPrice: "2.63", adminPrice: "2.45" },
          { name: "Weekly Basic", network: "mtn", dataAmount: "2GB", validity: "7 Days", basePrice: "8.00", agentPrice: "7.20", dealerPrice: "6.80", superDealerPrice: "6.40", masterPrice: "6.00", adminPrice: "5.60" },
          { name: "Weekly Pro", network: "mtn", dataAmount: "5GB", validity: "7 Days", basePrice: "15.00", agentPrice: "13.50", dealerPrice: "12.75", superDealerPrice: "12.00", masterPrice: "11.25", adminPrice: "10.50" },
          { name: "Monthly Starter", network: "mtn", dataAmount: "10GB", validity: "30 Days", basePrice: "25.00", agentPrice: "22.50", dealerPrice: "21.25", superDealerPrice: "20.00", masterPrice: "18.75", adminPrice: "17.50" },
          { name: "Monthly Premium", network: "mtn", dataAmount: "20GB", validity: "30 Days", basePrice: "45.00", agentPrice: "40.50", dealerPrice: "38.25", superDealerPrice: "36.00", masterPrice: "33.75", adminPrice: "31.50" },
          { name: "Daily Lite", network: "telecel", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", agentPrice: "1.80", dealerPrice: "1.70", superDealerPrice: "1.60", masterPrice: "1.50", adminPrice: "1.40" },
          { name: "Daily Plus", network: "telecel", dataAmount: "1GB", validity: "1 Day", basePrice: "3.50", agentPrice: "3.15", dealerPrice: "2.98", superDealerPrice: "2.80", masterPrice: "2.63", adminPrice: "2.45" },
          { name: "Weekly Basic", network: "telecel", dataAmount: "3GB", validity: "7 Days", basePrice: "10.00", agentPrice: "9.00", dealerPrice: "8.50", superDealerPrice: "8.00", masterPrice: "7.50", adminPrice: "7.00" },
          { name: "Weekly Pro", network: "telecel", dataAmount: "6GB", validity: "7 Days", basePrice: "18.00", agentPrice: "16.20", dealerPrice: "15.30", superDealerPrice: "14.40", masterPrice: "13.50", adminPrice: "12.60" },
          { name: "Monthly Basic", network: "telecel", dataAmount: "8GB", validity: "30 Days", basePrice: "22.00", agentPrice: "19.80", dealerPrice: "18.70", superDealerPrice: "17.60", masterPrice: "16.50", adminPrice: "15.40" },
          { name: "Monthly Plus", network: "telecel", dataAmount: "15GB", validity: "30 Days", basePrice: "38.00", agentPrice: "34.20", dealerPrice: "32.30", superDealerPrice: "30.40", masterPrice: "28.50", adminPrice: "26.60" },
          { name: "Daily Bundle", network: "at_bigtime", dataAmount: "500MB", validity: "1 Day", basePrice: "2.00", agentPrice: "1.80", dealerPrice: "1.70", superDealerPrice: "1.60", masterPrice: "1.50", adminPrice: "1.40" },
          { name: "Weekly Bundle", network: "at_bigtime", dataAmount: "2GB", validity: "7 Days", basePrice: "8.00", agentPrice: "7.20", dealerPrice: "6.80", superDealerPrice: "6.40", masterPrice: "6.00", adminPrice: "5.60" },
          { name: "Monthly Bundle", network: "at_bigtime", dataAmount: "5GB", validity: "30 Days", basePrice: "20.00", agentPrice: "18.00", dealerPrice: "17.00", superDealerPrice: "16.00", masterPrice: "15.00", adminPrice: "14.00" },
          { name: "Daily iShare", network: "at_ishare", dataAmount: "750MB", validity: "1 Day", basePrice: "2.50", agentPrice: "2.25", dealerPrice: "2.13", superDealerPrice: "2.00", masterPrice: "1.88", adminPrice: "1.75" },
          { name: "Weekly iShare", network: "at_ishare", dataAmount: "3GB", validity: "7 Days", basePrice: "10.00", agentPrice: "9.00", dealerPrice: "8.50", superDealerPrice: "8.00", masterPrice: "7.50", adminPrice: "7.00" },
          { name: "Monthly iShare", network: "at_ishare", dataAmount: "8GB", validity: "30 Days", basePrice: "25.00", agentPrice: "22.50", dealerPrice: "21.25", superDealerPrice: "20.00", masterPrice: "18.75", adminPrice: "17.50" }
        ];
        for (const bundle of sampleBundles) {
          await storage.createDataBundle(bundle);
        }
        bundlesSeeded = sampleBundles.length;
      }
      if (existingCheckers.length === 0) {
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const years = [currentYear, currentYear - 1, currentYear - 2];
        const sampleResultCheckers = [];
        for (const year of years) {
          for (const type of ["bece", "wassce"]) {
            for (let i = 1; i <= 10; i++) {
              sampleResultCheckers.push({
                type,
                year,
                serialNumber: `${type.toUpperCase()}${year}${String(i).padStart(3, "0")}`,
                pin: `PIN${year}${String(i).padStart(3, "0")}`,
                basePrice: type === "bece" ? "15.00" : "25.00"
              });
            }
          }
        }
        for (const checker of sampleResultCheckers) {
          await storage.createResultChecker(checker);
        }
        checkersSeeded = sampleResultCheckers.length;
      }
      res.json({
        message: "Products seeded successfully",
        dataBundles: bundlesSeeded || existingBundles.length,
        resultCheckers: checkersSeeded || existingCheckers.length,
        bundlesSeeded,
        checkersSeeded
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to seed products" });
    }
  });
  app2.post("/api/admin/upload/logo", requireAuth, requireAdmin, global.upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/assets/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
    }
  });
  app2.post("/api/admin/upload/banner", requireAuth, requireAdmin, global.upload.single("banner"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/assets/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
    }
  });
  app2.post("/api/admin/upload/network-logo", requireAuth, requireAdmin, global.upload.single("networkLogo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/assets/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
    }
  });
  app2.get("/api/admin/break-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings2 = await storage.getBreakSettings();
      res.json(settings2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load break settings" });
    }
  });
  app2.post("/api/admin/break-settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { isEnabled, enabled, message } = req.body;
      const finalIsEnabled = isEnabled !== void 0 ? isEnabled : enabled;
      if (typeof finalIsEnabled !== "boolean") {
        return res.status(400).json({ error: "isEnabled or enabled must be a boolean" });
      }
      if (finalIsEnabled && (!message || typeof message !== "string" || message.trim().length === 0)) {
        return res.status(400).json({ error: "Message is required when break mode is enabled" });
      }
      const settings2 = await storage.updateBreakSettings({
        isEnabled: finalIsEnabled,
        message: message?.trim() || ""
      });
      res.json(settings2);
    } catch (error) {
      res.status(500).json({ error: "Failed to update break settings" });
    }
  });
  app2.get("/api/admin/transactions", requireAuth, requireAdmin, async (req, res) => {
    try {
      const status = req.query.status;
      const type = req.query.type;
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const transactions2 = await storage.getTransactions({
        status,
        type,
        limit
      });
      const transactionsWithDetails = transactions2.map((tx) => ({
        ...tx,
        deliveryStatus: tx.deliveryStatus || "pending",
        phoneNumbers: tx.phoneNumbers,
        isBulkOrder: tx.isBulkOrder
      }));
      res.json(transactionsWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  app2.patch("/api/admin/transactions/:transactionId/delivery-status", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { deliveryStatus } = req.body;
      if (!deliveryStatus || !["pending", "processing", "delivered", "failed"].includes(deliveryStatus)) {
        return res.status(400).json({ error: "Invalid delivery status" });
      }
      const transaction = await storage.updateTransaction(transactionId, { deliveryStatus });
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to update delivery status" });
    }
  });
  app2.get("/api/admin/api-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const keys = [
        "api.mtn.key",
        "api.mtn.endpoint",
        "api.telecel.key",
        "api.at_bigtime.key",
        "api.at_ishare.key",
        "paystack.secret_key",
        "paystack.public_key"
      ];
      const result = {};
      for (const k of keys) {
        const v = await storage.getSetting(k);
        if (v !== void 0) result[k] = v;
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to load API configuration" });
    }
  });
  app2.post("/api/admin/api-config", requireAuth, requireAdmin, async (req, res) => {
    try {
      const body = req.body || {};
      for (const [k, v] of Object.entries(body)) {
        if (typeof v === "string") {
          await storage.setSetting(k, v);
        }
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save API configuration" });
    }
  });
  app2.get("/api/break-settings", async (req, res) => {
    try {
      const settings2 = await storage.getBreakSettings();
      res.json(settings2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load break settings" });
    }
  });
  app2.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      let transactions2 = await storage.getTransactions({
        customerEmail: req.user.email,
        limit: 50
      });
      if (dbUser.phone) {
        const phoneTransactions = await storage.getTransactions({
          customerPhone: dbUser.phone,
          limit: 50
        });
        const combined = [...transactions2, ...phoneTransactions];
        const uniqueByReference = Array.from(
          new Map(combined.map((t) => [t.reference, t])).values()
        );
        transactions2 = uniqueByReference.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      res.json(transactions2);
    } catch (error) {
      res.status(500).json({ error: "Failed to load transactions" });
    }
  });
  app2.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      let transactions2 = await storage.getTransactions({
        customerEmail: req.user.email
      });
      if (dbUser.phone) {
        const phoneTransactions = await storage.getTransactions({
          customerPhone: dbUser.phone
        });
        const combined = [...transactions2, ...phoneTransactions];
        transactions2 = Array.from(
          new Map(combined.map((t) => [t.reference, t])).values()
        );
      }
      const totalOrders = transactions2.length;
      const totalSpent = transactions2.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
      res.json({
        totalOrders,
        totalSpent: totalSpent.toFixed(2),
        walletBalance: dbUser.walletBalance || "0.00"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load user stats" });
    }
  });
  app2.get("/api/user/profit-wallet", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      let wallet = await storage.getProfitWallet(dbUser.id);
      if (!wallet) {
        wallet = await storage.createProfitWallet({
          userId: dbUser.id,
          availableBalance: "0.00",
          pendingBalance: "0.00",
          totalEarned: "0.00"
        });
      }
      res.json({
        wallet,
        user: { name: dbUser.name, email: dbUser.email }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load profit wallet" });
    }
  });
  app2.get("/api/user/profit-transactions", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { status, limit } = req.query;
      const transactions2 = await storage.getProfitTransactions(dbUser.id, {
        status,
        limit: limit ? parseInt(limit) : void 0
      });
      res.json({ transactions: transactions2 });
    } catch (error) {
      res.status(500).json({ error: "Failed to load profit transactions" });
    }
  });
  app2.post("/api/user/verify-bank-account", requireAuth, async (req, res) => {
    try {
      const { accountNumber, bankCode } = req.body;
      if (!accountNumber || !bankCode) {
        return res.status(400).json({ error: "Account number and bank code are required" });
      }
      const { resolveBankAccount: resolveBankAccount2 } = await Promise.resolve().then(() => (init_paystack(), paystack_exports));
      const result = await resolveBankAccount2(accountNumber, bankCode);
      res.json({
        accountName: result.data.account_name,
        accountNumber: result.data.account_number,
        bankCode
      });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to verify bank account" });
    }
  });
  app2.post("/api/user/withdrawals", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { amount, accountNumber, accountName, bankCode, bankName } = req.body;
      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount < 10) {
        return res.status(400).json({ error: "Minimum withdrawal amount is GHS 10" });
      }
      const wallet = await storage.getProfitWallet(dbUser.id);
      if (!wallet) {
        return res.status(400).json({ error: "Profit wallet not found" });
      }
      const availableBalance = parseFloat(wallet.availableBalance);
      if (availableBalance < withdrawalAmount) {
        return res.status(400).json({
          error: "Insufficient available balance",
          available: availableBalance.toFixed(2),
          requested: withdrawalAmount.toFixed(2)
        });
      }
      const withdrawal = await storage.createWithdrawal({
        userId: dbUser.id,
        amount: withdrawalAmount.toFixed(2),
        status: WithdrawalStatus.PENDING,
        paymentMethod: "bank",
        bankName,
        bankCode,
        accountNumber,
        accountName
      });
      res.json({
        withdrawal,
        message: "Withdrawal request submitted successfully. It will be processed after admin approval."
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to create withdrawal request" });
    }
  });
  app2.get("/api/user/withdrawals", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const withdrawals2 = await storage.getWithdrawals({ userId: dbUser.id });
      res.json({ withdrawals: withdrawals2 });
    } catch (error) {
      res.status(500).json({ error: "Failed to load withdrawals" });
    }
  });
  app2.patch("/api/admin/withdrawals/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { action, adminNote } = req.body;
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (action === "approve") {
        if (withdrawal.status !== "pending") {
          return res.status(400).json({ error: "Withdrawal is not in pending status" });
        }
        await storage.updateWithdrawal(id, {
          status: WithdrawalStatus.APPROVED,
          approvedBy: req.user.id,
          approvedAt: /* @__PURE__ */ new Date(),
          adminNote
        });
        res.json({
          message: "Withdrawal approved. Admin will manually send the money and mark as paid.",
          withdrawal: await storage.getWithdrawal(id)
        });
      } else if (action === "reject") {
        if (withdrawal.status !== "pending") {
          return res.status(400).json({ error: "Withdrawal is not in pending status" });
        }
        await storage.updateWithdrawal(id, {
          status: WithdrawalStatus.REJECTED,
          rejectionReason: adminNote
        });
        res.json({
          message: "Withdrawal rejected",
          withdrawal: await storage.getWithdrawal(id)
        });
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to process withdrawal" });
    }
  });
  app2.post("/api/admin/withdrawals/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNote } = req.body;
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "pending") {
        return res.status(400).json({ error: "Withdrawal is not in pending status" });
      }
      await storage.updateWithdrawal(id, {
        status: WithdrawalStatus.APPROVED,
        approvedBy: req.user.id,
        approvedAt: /* @__PURE__ */ new Date(),
        adminNote
      });
      res.json({
        message: "Withdrawal approved. Admin will manually send the money and mark as paid.",
        withdrawal: await storage.getWithdrawal(id)
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to approve withdrawal" });
    }
  });
  app2.post("/api/admin/withdrawals/:id/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNote } = req.body;
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "pending") {
        return res.status(400).json({ error: "Withdrawal is not in pending status" });
      }
      await storage.updateWithdrawal(id, {
        status: WithdrawalStatus.REJECTED,
        rejectionReason: adminNote
      });
      res.json({
        message: "Withdrawal rejected",
        withdrawal: await storage.getWithdrawal(id)
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to reject withdrawal" });
    }
  });
  app2.post("/api/admin/withdrawals/:id/mark_paid", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const withdrawal = await storage.getWithdrawal(id);
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "approved") {
        return res.status(400).json({ error: "Withdrawal is not in approved status" });
      }
      const wallet = await storage.getProfitWallet(withdrawal.userId);
      if (!wallet) {
        return res.status(400).json({ error: "Profit wallet not found" });
      }
      const withdrawalAmount = parseFloat(withdrawal.amount);
      const currentBalance = parseFloat(wallet.availableBalance);
      if (currentBalance < withdrawalAmount) {
        return res.status(400).json({ error: "Insufficient balance in profit wallet" });
      }
      const newBalance = (currentBalance - withdrawalAmount).toFixed(2);
      await storage.updateProfitWallet(withdrawal.userId, {
        availableBalance: newBalance
      });
      await storage.updateWithdrawal(id, {
        status: WithdrawalStatus.PAID,
        paidAt: /* @__PURE__ */ new Date()
      });
      res.json({
        message: "Withdrawal marked as paid. Funds have been deducted from profit wallet.",
        withdrawal: await storage.getWithdrawal(id)
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to mark withdrawal as paid" });
    }
  });
  app2.post("/api/webhooks/paystack", async (req, res) => {
    try {
      const { validateWebhookSignature: validateWebhookSignature2 } = await Promise.resolve().then(() => (init_paystack(), paystack_exports));
      const isValid = validateWebhookSignature2(
        JSON.stringify(req.body),
        req.headers["x-paystack-signature"]
      );
      if (!isValid) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
      const event = req.body;
      if (event.event === "transfer.success" || event.event === "transfer.failed" || event.event === "transfer.reversed") {
        console.log(`Received transfer webhook event: ${event.event}`, event.data);
      }
      res.json({ status: "ok" });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.get("/api/user/rank", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const userTransactions = await storage.getTransactions({
        customerEmail: req.user.email,
        status: "completed"
      });
      const userTotalSpent = userTransactions.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
      const userTotalPurchases = userTransactions.length;
      const allRankings = await storage.getTopCustomers(1e3);
      const userRanking = allRankings.find((ranking) => ranking.customerEmail === req.user.email);
      let userRank = allRankings.length + 1;
      if (userRanking) {
        userRank = userRanking.rank;
      }
      if (userTotalPurchases === 0) {
        userRank = allRankings.length + 1;
      }
      res.json({
        rank: userRank,
        totalUsers: allRankings.length,
        totalSpent: userTotalSpent,
        totalPurchases: userTotalPurchases,
        customerName: dbUser.name
      });
    } catch (error) {
      console.error("Rank API error:", error);
      res.status(500).json({ error: "Failed to get rank" });
    }
  });
  app2.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const { name, phone } = req.body;
      if (name !== void 0 && (typeof name !== "string" || name.trim().length < 2)) {
        return res.status(400).json({ error: "Name must be at least 2 characters" });
      }
      if (phone !== void 0 && (typeof phone !== "string" || phone.trim().length < 10)) {
        return res.status(400).json({ error: "Phone number must be at least 10 digits" });
      }
      const updateData = {};
      if (name !== void 0) updateData.name = name.trim();
      if (phone !== void 0) updateData.phone = phone.trim();
      const updatedUser = await storage.updateUser(dbUser.id, updateData);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update profile" });
      }
      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          phone: updatedUser.phone,
          role: updatedUser.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters" });
      }
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required" });
      }
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      await storage.updateUser(dbUser.id, {
        name: name.trim(),
        email: email.trim().toLowerCase()
      });
      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.get("/api/track-order", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Search query is required" });
      }
      const trimmedQuery = q.trim();
      let transaction = await storage.getTransactionByReference(trimmedQuery);
      if (!transaction) {
        transaction = await storage.getTransactionByBeneficiaryPhone(trimmedQuery);
      }
      if (!transaction) {
        return res.status(404).json({ error: "Order not found. Please check your transaction ID or beneficiary phone number." });
      }
      let phoneNumbers = transaction.phoneNumbers;
      if (typeof phoneNumbers === "string") {
        try {
          phoneNumbers = JSON.parse(phoneNumbers);
        } catch (e) {
          phoneNumbers = null;
        }
      }
      res.json({
        id: transaction.id,
        reference: transaction.reference,
        productName: transaction.productName,
        customerPhone: transaction.customerPhone,
        amount: transaction.amount,
        status: transaction.status,
        deliveryStatus: transaction.deliveryStatus,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
        phoneNumbers,
        // For bulk orders
        isBulkOrder: transaction.isBulkOrder,
        apiResponse: transaction.apiResponse
        // Include SkyTech status
      });
    } catch (error) {
      console.error("Order tracking error:", error);
      res.status(500).json({ error: "Failed to track order" });
    }
  });
  app2.post("/api/user/bulk-upload", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      let network;
      let data;
      if (req.is("multipart/form-data")) {
        network = req.body.network;
        return res.status(400).json({ error: "File upload not implemented yet" });
      } else {
        network = req.body.network;
        data = req.body.data;
      }
      if (!network || !data) {
        return res.status(400).json({ error: "Network and data are required" });
      }
      if (network === "at_ishare") {
        return res.status(400).json({ error: "Bulk uploads are not available for AT iShare network" });
      }
      const lines = data.split("\n").map((line) => line.trim()).filter((line) => line);
      const orderItems = [];
      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length !== 2) {
          return res.status(400).json({ error: `Invalid format: ${line}. Expected: phone_number GB_amount` });
        }
        const phone = parts[0].trim();
        const gbAmount = parseInt(parts[1].trim());
        if (isNaN(gbAmount) || gbAmount < 1 || gbAmount > 100) {
          return res.status(400).json({ error: `Invalid GB amount: ${parts[1]}. Must be 1-100` });
        }
        const normalizedPhone = normalizePhoneNumber(phone);
        if (!normalizedPhone || !isValidPhoneLength(normalizedPhone)) {
          return res.status(400).json({ error: `Invalid phone number: ${phone}` });
        }
        if (!validatePhoneNetwork(normalizedPhone, network)) {
          const errorMsg = getNetworkMismatchError(normalizedPhone, network);
          return res.status(400).json({ error: errorMsg });
        }
        const bundles = await storage.getDataBundles({ network, isActive: true });
        const bundle = bundles.find((b) => {
          const bundleGB = parseInt(b.dataAmount.replace("GB", ""));
          return bundleGB === gbAmount;
        });
        if (!bundle) {
          return res.status(404).json({ error: `Bundle not found for ${gbAmount}GB on ${network} network` });
        }
        let price = parseFloat(bundle.basePrice);
        if (dbUser.role === "agent") {
          price = parseFloat(bundle.agentPrice || bundle.basePrice);
        } else if (dbUser.role === "dealer") {
          price = parseFloat(bundle.dealerPrice || bundle.basePrice);
        } else if (dbUser.role === "super_dealer") {
          price = parseFloat(bundle.superDealerPrice || bundle.basePrice);
        }
        orderItems.push({
          bundleId: bundle.id,
          phone: normalizedPhone,
          price
        });
      }
      if (orderItems.length === 0) {
        return res.status(400).json({ error: "No valid items found" });
      }
      const totalAmount = orderItems.reduce((sum2, item) => sum2 + item.price, 0);
      const paymentMethod = req.body.paymentMethod || "wallet";
      if (paymentMethod === "wallet") {
        const walletBalance = parseFloat(dbUser.walletBalance || "0");
        if (walletBalance < totalAmount) {
          return res.status(400).json({ error: `Insufficient wallet balance. Required: GH\u20B5${totalAmount.toFixed(2)}, Available: GH\u20B5${walletBalance.toFixed(2)}` });
        }
      }
      const checkoutData = {
        orderItems,
        network,
        customerPhone: orderItems[0].phone,
        // Use first phone as customer phone
        customerEmail: dbUser.email,
        paymentMethod,
        isBulkOrder: true
      };
      const checkoutResponse = await fetch(`${req.protocol}://${req.get("host")}/api/checkout/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization || ""
        },
        body: JSON.stringify(checkoutData)
      });
      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json().catch(() => ({ error: "Checkout failed" }));
        return res.status(checkoutResponse.status).json(errorData);
      }
      const checkoutResult = await checkoutResponse.json();
      res.json({
        processed: orderItems.length,
        totalAmount: totalAmount.toFixed(2),
        checkout: checkoutResult
      });
    } catch (error) {
      console.error("Bulk upload error:", error);
      res.status(500).json({ error: "Failed to process bulk upload", details: error.message });
    }
  });
  app2.get("/api/wallet/stats", requireAuth, async (req, res) => {
    try {
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const transactions2 = await storage.getTransactions({
        customerEmail: req.user.email
      });
      const walletTopups = transactions2.filter((t) => t.type === "wallet_topup" && t.status === "completed");
      const totalTopups = walletTopups.length;
      const totalTopupAmount = walletTopups.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
      const walletPayments = transactions2.filter((t) => t.paymentMethod === "wallet");
      const totalSpent = walletPayments.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
      const lastTopup = walletTopups.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      res.json({
        walletBalance: dbUser.walletBalance || "0.00",
        totalTopups,
        totalTopupAmount: totalTopupAmount.toFixed(2),
        totalSpent: totalSpent.toFixed(2),
        lastTopupDate: lastTopup?.createdAt || null,
        lastTopupAmount: lastTopup?.amount || null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load wallet stats" });
    }
  });
  app2.post("/api/wallet/topup/initialize", requireAuth, async (req, res) => {
    try {
      const { amount, paymentMethod = "paystack" } = req.body;
      if (!amount || parseFloat(amount) < 1) {
        return res.status(400).json({ error: "Invalid amount. Minimum topup is GHS 1" });
      }
      if (paymentMethod === "wallet") {
        return res.status(400).json({ error: "Wallet balance cannot be used to top up wallet. Please use Paystack." });
      }
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const reference = `WALLET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const transaction = await storage.createTransaction({
        reference,
        type: "wallet_topup",
        productName: "Wallet Top-up",
        amount: parseFloat(amount).toFixed(2),
        profit: "0.00",
        customerPhone: dbUser.phone || "",
        customerEmail: dbUser.email,
        paymentMethod,
        status: TransactionStatus.PENDING
      });
      const frontendUrl = process.env.APP_URL || process.env.FRONTEND_URL || "https://resellershubprogh.com";
      const callbackUrl = `${frontendUrl}/wallet/topup/success`;
      const paystackResponse = await initializePayment({
        email: dbUser.email,
        amount: Math.round(parseFloat(amount) * 100),
        reference,
        callbackUrl,
        metadata: {
          type: "wallet_topup",
          userId: dbUser.id,
          customerName: dbUser.name
        }
      });
      if (paystackResponse.status && paystackResponse.data) {
        res.json({
          authorizationUrl: paystackResponse.data.authorization_url,
          reference: paystackResponse.data.reference,
          accessCode: paystackResponse.data.access_code
        });
      } else {
        const paystackError = paystackResponse;
        throw new Error(paystackError.message || "Payment initialization failed");
      }
    } catch (error) {
      res.status(400).json({ error: error.message || "Wallet topup failed" });
    }
  });
  app2.get("/api/wallet/topup/verify/:reference", requireAuth, async (req, res) => {
    try {
      const transaction = await storage.getTransactionByReference(req.params.reference);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      if (transaction.type !== "wallet_topup") {
        return res.status(400).json({ error: "Invalid transaction type" });
      }
      if (transaction.status === TransactionStatus.COMPLETED) {
        return res.json({
          success: true,
          amount: transaction.amount,
          status: transaction.status
        });
      }
      const paystackVerification = await verifyPayment(req.params.reference);
      if (paystackVerification.data.status !== "success") {
        return res.json({
          success: false,
          status: paystackVerification.data.status,
          message: paystackVerification.data.gateway_response
        });
      }
      const dbUser = await storage.getUserByEmail(transaction.customerEmail);
      if (dbUser) {
        const newBalance = parseFloat(dbUser.walletBalance || "0") + parseFloat(transaction.amount);
        await storage.updateUser(dbUser.id, { walletBalance: newBalance.toFixed(2) });
      }
      await storage.updateTransaction(transaction.id, {
        status: TransactionStatus.COMPLETED,
        completedAt: /* @__PURE__ */ new Date(),
        paymentReference: paystackVerification.data.reference
      });
      res.json({
        success: true,
        amount: transaction.amount,
        newBalance: dbUser ? (parseFloat(dbUser.walletBalance || "0") + parseFloat(transaction.amount)).toFixed(2) : "0.00"
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Verification failed" });
    }
  });
  app2.post("/api/wallet/pay", requireAuth, async (req, res) => {
    try {
      const {
        productType,
        productId,
        productName,
        network,
        amount,
        customerPhone,
        phoneNumbers,
        isBulkOrder,
        agentSlug,
        quantity,
        orderItems
      } = req.body;
      const effectiveProductName = productName || (orderItems ? `Bulk Order - ${orderItems.length} items` : null);
      if (!productType || !effectiveProductName || !amount || !customerPhone) {
        console.error("Missing required fields:", { productType, productName: effectiveProductName, amount, customerPhone });
        return res.status(400).json({ error: "Missing required fields" });
      }
      let normalizedPhone;
      if (customerPhone) {
        normalizedPhone = normalizePhoneNumber(customerPhone);
        if (!isValidPhoneLength(normalizedPhone)) {
          return res.status(400).json({
            error: "Invalid phone number length. Phone number must be exactly 10 digits including the prefix (e.g., 0241234567)"
          });
        }
      }
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const purchaseAmount = parseFloat(amount);
      const walletBalanceCents = Math.round(parseFloat(dbUser.walletBalance || "0") * 100);
      const purchaseAmountCents = Math.round(purchaseAmount * 100);
      if (walletBalanceCents < purchaseAmountCents) {
        return res.status(400).json({
          error: "Insufficient wallet balance",
          balance: (walletBalanceCents / 100).toFixed(2),
          required: (purchaseAmountCents / 100).toFixed(2)
        });
      }
      const ENFORCE_COOLDOWN_MINUTES = 20;
      const enforcePhoneCooldown = async (phone) => {
        const lastTx = await storage.getLatestDataBundleTransactionByPhone(phone);
        if (lastTx && lastTx.createdAt) {
          const lastTime = new Date(lastTx.createdAt).getTime();
          const cooldownMs = ENFORCE_COOLDOWN_MINUTES * 60 * 1e3;
          const elapsed = Date.now() - lastTime;
          console.log(`[Wallet-Cooldown] Phone: ${phone}, Last TX: ${lastTx.reference} (${lastTx.paymentStatus}), Elapsed: ${Math.round(elapsed / 1e3)}s, Cooldown: ${ENFORCE_COOLDOWN_MINUTES * 60}s`);
          if (elapsed < cooldownMs) {
            const remainingMinutes = Math.ceil((cooldownMs - elapsed) / 6e4);
            console.log(`[Wallet-Cooldown] BLOCKED: ${phone} must wait ${remainingMinutes} minute(s)`);
            return { blocked: true, remainingMinutes, lastReference: lastTx.reference };
          }
        }
        console.log(`[Wallet-Cooldown] ALLOWED: ${phone} (no recent transactions or cooldown expired)`);
        return { blocked: false, remainingMinutes: 0 };
      };
      if (productType === ProductType.DATA_BUNDLE && normalizedPhone) {
        console.log(`[Wallet] ===================== COOLDOWN CHECK START =====================`);
        console.log(`[Wallet] Product Type: ${productType}`);
        console.log(`[Wallet] Normalized Phone: ${normalizedPhone}`);
        console.log(`[Wallet] Is Bulk Order: ${isBulkOrder}`);
        console.log(`[Wallet] Order Items:`, orderItems);
        if (isBulkOrder && orderItems && Array.isArray(orderItems)) {
          const uniquePhones = [...new Set(orderItems.map((item) => normalizePhoneNumber(item.phone)))];
          console.log(`[Wallet] Checking cooldown for ${uniquePhones.length} unique phones in bulk order`);
          for (const phone of uniquePhones) {
            console.log(`[Wallet] Checking phone: ${phone}`);
            const cooldown = await enforcePhoneCooldown(phone);
            console.log(`[Wallet] Cooldown result for ${phone}:`, cooldown);
            if (cooldown.blocked) {
              console.log(`[Wallet] \u274C COOLDOWN BLOCKED for ${phone}: ${cooldown.remainingMinutes} minutes remaining`);
              return res.status(429).json({
                error: `Please wait ${cooldown.remainingMinutes} minute(s) before purchasing another bundle for ${phone}.`,
                cooldownMinutes: cooldown.remainingMinutes,
                phone
              });
            }
          }
        } else {
          console.log(`[Wallet] Checking cooldown for single purchase: ${normalizedPhone}`);
          const cooldown = await enforcePhoneCooldown(normalizedPhone);
          console.log(`[Wallet] Cooldown result:`, cooldown);
          if (cooldown.blocked) {
            console.log(`[Wallet] \u274C COOLDOWN BLOCKED for ${normalizedPhone}: ${cooldown.remainingMinutes} minutes remaining`);
            return res.status(429).json({
              error: `Please wait ${cooldown.remainingMinutes} minute(s) before purchasing another bundle for ${normalizedPhone}.`,
              cooldownMinutes: cooldown.remainingMinutes,
              phone: normalizedPhone
            });
          }
        }
        console.log(`[Wallet] ===================== COOLDOWN CHECK PASSED =====================`);
      } else {
        console.log(`[Wallet] \u26A0\uFE0F COOLDOWN CHECK SKIPPED - productType: ${productType}, normalizedPhone: ${normalizedPhone}`);
      }
      let product;
      let costPrice = 0;
      let basePrice = parseFloat(amount);
      if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
        console.log("[Wallet] Processing orderItems:", orderItems);
        costPrice = 0;
        for (const item of orderItems) {
          const bundle = await storage.getDataBundle(item.bundleId);
          if (bundle) {
            costPrice += 0;
          }
        }
        product = await storage.getDataBundle(orderItems[0].bundleId);
      } else if (productType === ProductType.DATA_BUNDLE && productId) {
        product = await storage.getDataBundle(productId);
        if (product) {
          costPrice = parseFloat(product.costPrice);
          basePrice = parseFloat(product.basePrice);
        }
      } else if (productType === ProductType.RESULT_CHECKER && productId) {
        product = await storage.getResultChecker(productId);
        if (product) {
          costPrice = parseFloat(product.costPrice);
          basePrice = parseFloat(product.basePrice);
        }
      }
      let agentId;
      let agentProfit = 0;
      const purchasingAgent = await storage.getAgentByUserId(dbUser.id);
      if (agentSlug) {
        const agent = await storage.getAgentBySlug(agentSlug);
        if (agent && agent.isApproved) {
          agentId = agent.id;
          const storedProfit = await storage.getStoredProfit(productId || orderItems[0].bundleId, agent.id, "agent");
          if (storedProfit) {
            agentProfit = Math.max(0, parseFloat(storedProfit));
          } else {
            const agentRoleBasePrice = await storage.getRoleBasePrice(productId || orderItems[0].bundleId, "agent");
            let basePrice2;
            if (agentRoleBasePrice) {
              basePrice2 = parseFloat(agentRoleBasePrice);
            } else {
              const adminBasePrice = await storage.getAdminBasePrice(productId || orderItems[0].bundleId);
              basePrice2 = adminBasePrice ? parseFloat(adminBasePrice) : parseFloat(product?.basePrice || "0");
            }
            agentProfit = Math.max(0, purchaseAmount - basePrice2);
          }
        }
      } else if (purchasingAgent && purchasingAgent.isApproved) {
        agentId = purchasingAgent.id;
        agentProfit = 0;
      }
      const reference = `WALLET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      const phoneNumbersData = orderItems ? orderItems.map((item) => ({
        phone: normalizePhoneNumber(item.phone),
        bundleName: item.bundleName,
        dataAmount: item.bundleName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i)?.[1] || ""
      })) : phoneNumbers ? phoneNumbers.map((phone) => ({ phone: normalizePhoneNumber(phone) })) : void 0;
      console.log("[Wallet] ========== PHONE NUMBERS EXTRACTION ==========");
      console.log("[Wallet] orderItems:", orderItems);
      console.log("[Wallet] phoneNumbers param:", req.body?.phoneNumbers);
      console.log("[Wallet] phoneNumbersData:", phoneNumbersData);
      console.log("[Wallet] ===================================================");
      console.log("[Wallet] ==================== CREATING TRANSACTION ====================");
      console.log("[Wallet] customerPhone (normalized):", normalizedPhone || customerPhone);
      console.log("[Wallet] paymentStatus: paid (cooldown already checked)");
      console.log("[Wallet] type:", productType);
      console.log("[Wallet] =================================================================");
      const transaction = await storage.createTransaction({
        reference,
        type: productType,
        productId: productId || (orderItems ? orderItems[0].bundleId : null),
        productName: effectiveProductName,
        network,
        amount: purchaseAmount.toFixed(2),
        profit: agentProfit > 0 ? agentProfit.toFixed(2) : "0",
        customerPhone: normalizedPhone || customerPhone,
        customerEmail: dbUser.email,
        phoneNumbers: (isBulkOrder || orderItems && orderItems.length > 0) && phoneNumbersData ? JSON.stringify(phoneNumbersData) : void 0,
        isBulkOrder: isBulkOrder || orderItems && orderItems.length > 0 || false,
        paymentMethod: "wallet",
        status: TransactionStatus.CONFIRMED,
        paymentStatus: "paid",
        agentId,
        agentProfit: agentProfit > 0 ? agentProfit.toFixed(2) : void 0
      });
      console.log("[Wallet] Transaction created:", transaction.id);
      const newBalanceCents = walletBalanceCents - purchaseAmountCents;
      const newBalance = newBalanceCents / 100;
      await storage.updateUser(dbUser.id, { walletBalance: newBalance.toFixed(2) });
      let deliveredPin;
      let deliveredSerial;
      if (productType === ProductType.RESULT_CHECKER && productId) {
        const [type, yearStr] = productId.split("-");
        const year = parseInt(yearStr);
        let checker = await storage.getAvailableResultChecker(type, year);
        if (checker) {
          await storage.markResultCheckerSold(checker.id, transaction.id, normalizedPhone || customerPhone);
          deliveredPin = checker.pin;
          deliveredSerial = checker.serialNumber;
        } else {
          deliveredSerial = `RC${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          deliveredPin = Math.random().toString(36).substring(2, 10).toUpperCase();
          const newChecker = await storage.createResultChecker({
            type,
            year,
            serialNumber: deliveredSerial,
            pin: deliveredPin,
            basePrice: purchaseAmount.toString()
          });
          console.log("Auto-generated result checker:", newChecker.id);
        }
        await storage.updateTransaction(transaction.id, {
          status: TransactionStatus.COMPLETED,
          completedAt: /* @__PURE__ */ new Date(),
          deliveredPin,
          deliveredSerial
        });
      } else {
        console.log("[Wallet] Processing data bundle transaction via API:", transaction.reference);
        const fulfillmentResult = await fulfillDataBundleTransaction(transaction, transaction.providerId ?? void 0);
        await storage.updateTransaction(transaction.id, { apiResponse: JSON.stringify(fulfillmentResult) });
        if (fulfillmentResult.success) {
          console.log("[Wallet] Data bundle API fulfillment successful:", fulfillmentResult);
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.PENDING,
            // Changed from COMPLETED to PENDING
            deliveryStatus: "processing"
            // Changed from "pending" to "processing"
            // Don't set completedAt yet - wait for SkyTech delivery confirmation
          });
        } else {
          console.error("[Wallet] Data bundle API fulfillment failed:", fulfillmentResult.error);
          await storage.updateTransaction(transaction.id, {
            status: TransactionStatus.FAILED,
            deliveryStatus: "failed",
            completedAt: /* @__PURE__ */ new Date(),
            failureReason: `API fulfillment failed: ${fulfillmentResult.error}`
          });
        }
      }
      if (agentId && agentProfit > 0) {
        const totalPaid = parseFloat(purchaseAmount.toFixed(2));
        const agentProfitValue = parseFloat(agentProfit.toFixed(2));
        const adminRevenue = parseFloat((totalPaid - agentProfitValue).toFixed(2));
        if (Math.abs(agentProfitValue + adminRevenue - totalPaid) > 0.01) {
          console.error("INVALID_BULK_PAYOUT detected for wallet transaction", transaction.reference);
          throw new Error("INVALID_BULK_PAYOUT");
        }
        await storage.updateAgentBalance(agentId, agentProfitValue, true);
        const agent = await storage.getAgent(agentId);
        if (agent) {
          let profitWallet = await storage.getProfitWallet(agent.userId);
          if (!profitWallet) {
            profitWallet = await storage.createProfitWallet({
              userId: agent.userId,
              availableBalance: "0.00",
              pendingBalance: "0.00",
              totalEarned: "0.00"
            });
          }
          const newAvailableBalance = (parseFloat(profitWallet.availableBalance) + agentProfitValue).toFixed(2);
          const newTotalEarned = (parseFloat(profitWallet.totalEarned) + agentProfitValue).toFixed(2);
          await storage.updateProfitWallet(agent.userId, {
            availableBalance: newAvailableBalance,
            totalEarned: newTotalEarned
          });
        }
        const adminRef = `ADMINREV-${transaction.reference}`;
        await storage.createTransaction({
          reference: adminRef,
          type: "admin_revenue",
          productId: null,
          productName: `Admin revenue for transaction ${transaction.reference}`,
          network: null,
          amount: adminRevenue.toFixed(2),
          profit: "0.00",
          customerPhone: "",
          customerEmail: null,
          isBulkOrder: false,
          status: TransactionStatus.COMPLETED,
          paymentStatus: "paid"
        });
      }
      res.json({
        success: true,
        reference: transaction.reference,
        newBalance: newBalance.toFixed(2),
        deliveredPin,
        deliveredSerial
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Payment failed" });
    }
  });
  app2.post("/api/support/chat/create", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const existingChats = await storage.getUserSupportChats(user.id);
      const openChat = existingChats.find((c) => c.status === "open");
      if (openChat) {
        console.log(`User ${user.id} already has open chat ${openChat.id}, returning existing chat`);
        return res.json({ success: true, chatId: openChat.id });
      }
      const userName = user.user_metadata?.name || user.email.split("@")[0];
      const chatId = await storage.createSupportChat(user.id, user.email, userName);
      console.log(`Created new support chat ${chatId} for user ${user.id}`);
      res.json({ success: true, chatId });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to create chat" });
    }
  });
  app2.get("/api/support/chats", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const chats = await storage.getUserSupportChats(user.id);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get chats" });
    }
  });
  app2.get("/api/support/chat/:chatId", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const { chatId } = req.params;
      const chat = await storage.getSupportChatById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      if (chat.userId !== user.id && user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Access denied" });
      }
      const messages = await storage.getChatMessages(chatId);
      res.json({ chat, messages });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get chat" });
    }
  });
  app2.post("/api/support/chat/:chatId/message", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const { chatId } = req.params;
      const { message } = req.body;
      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message cannot be empty" });
      }
      const chat = await storage.getSupportChatById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      if (chat.userId !== user.id && user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Access denied" });
      }
      const senderType = user.role === UserRole.ADMIN ? "admin" : "user";
      let isFirstUserMessage = false;
      if (senderType === "user") {
        const existingMessages = await storage.getChatMessages(chatId);
        const existingUserMessages = existingMessages.filter((msg) => msg.senderType === "user");
        isFirstUserMessage = existingUserMessages.length === 0;
      }
      const messageId = await storage.createChatMessage(chatId, user.id, senderType, message.trim());
      if (isFirstUserMessage) {
        const autoReplyMessage = "Thank you for contacting us! \u{1F64F}\n\nPlease leave your concerns, questions, or reports below and our support team will respond as soon as they're available. We typically respond within a few hours during business hours.\n\nFeel free to provide as much detail as possible about your issue, and we'll get back to you with a solution.\n\nFor urgent matters, you can also reach us via WhatsApp.";
        await storage.createChatMessage(chatId, user.id, "admin", autoReplyMessage);
      }
      res.json({ success: true, messageId });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });
  app2.put("/api/support/message/:messageId/read", requireAuth, async (req, res) => {
    try {
      await storage.markMessageAsRead(req.params.messageId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to mark message as read" });
    }
  });
  app2.put("/api/support/chat/:chatId/close", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const { chatId } = req.params;
      const chat = await storage.getSupportChatById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }
      if (chat.userId !== user.id && user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: "Access denied" });
      }
      await storage.closeSupportChat(chatId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to close chat" });
    }
  });
  app2.get("/api/support/unread-count", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const count2 = await storage.getUnreadUserMessagesCount(user.id);
      res.json({ count: count2 });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get unread count" });
    }
  });
  app2.get("/api/support/admin/unread-count", requireAuth, requireSupport, async (req, res) => {
    try {
      const count2 = await storage.getUnreadAdminMessagesCount();
      res.json({ count: count2 });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get unread count" });
    }
  });
  app2.get("/api/admin/support/chats", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status } = req.query;
      const chats = await storage.getAllSupportChats(status);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get chats" });
    }
  });
  app2.put("/api/admin/support/chat/:chatId/assign", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { chatId } = req.params;
      const adminId = req.user.id;
      await storage.assignChatToAdmin(chatId, adminId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to assign chat" });
    }
  });
  app2.get("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
    try {
      const settings2 = await storage.getAllSettings();
      const sensitiveKeys = [
        "paystack.secret_key",
        "paystack.public_key",
        "skitech.api_key",
        "skitech.username",
        "skitech.password"
      ];
      const maskedSettings = settings2.map((setting) => {
        if (sensitiveKeys.includes(setting.key) && setting.value) {
          const value = setting.value;
          if (value.length > 15) {
            return {
              ...setting,
              value: `${value.substring(0, 7)}...${value.substring(value.length - 4)}`,
              isMasked: true
            };
          }
          return {
            ...setting,
            value: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
            isMasked: true
          };
        }
        return setting;
      });
      res.json(maskedSettings);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to load settings" });
    }
  });
  app2.put("/api/admin/settings/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const decodedKey = decodeURIComponent(key);
      const { value, description } = req.body;
      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }
      await storage.setSetting(decodedKey, value, description);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to update setting" });
    }
  });
  app2.get("/api/admin/settings/:key", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const value = await storage.getSetting(key);
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get setting" });
    }
  });
  app2.get("/api/public/whatsapp-support", async (req, res) => {
    try {
      const whatsappNumber = await storage.getSetting("whatsapp_support_number");
      res.json({
        whatsappNumber: whatsappNumber || "",
        success: true
      });
    } catch (error) {
      console.error("Error fetching WhatsApp number:", error);
      res.status(500).json({ error: error.message || "Failed to get WhatsApp number", whatsappNumber: "" });
    }
  });
  app2.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users3 = await storage.getUsers();
      const safeUsers = users3.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to load users" });
    }
  });
  app2.put("/api/admin/users/:userId/credentials", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { email, password, name, phone } = req.body;
      if (!email && !password && !name && phone === void 0) {
        return res.status(400).json({ error: "At least one field must be provided" });
      }
      if (email && typeof email === "string") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({ error: "Invalid email format" });
        }
      }
      if (password && typeof password === "string") {
        if (password.length < 8) {
          return res.status(400).json({ error: "Password must be at least 8 characters long" });
        }
      }
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }
      const updateData = {};
      const supabaseUpdates = {};
      if (email && email.trim() !== currentUser.email) {
        updateData.email = email.trim();
        supabaseUpdates.email = email.trim();
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
        supabaseUpdates.password = password;
      }
      if (name && name.trim() !== currentUser.name) {
        updateData.name = name.trim();
        supabaseUpdates.user_metadata = { ...supabaseUpdates.user_metadata || {}, name: name.trim() };
      }
      if (phone !== void 0 && phone !== currentUser.phone) {
        updateData.phone = phone || null;
        supabaseUpdates.phone = phone || null;
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No changes detected" });
      }
      if (supabaseUpdates.email || supabaseUpdates.password) {
        const supabaseServer2 = getSupabase();
        if (!supabaseServer2) {
          console.error("[Credentials] Supabase client not initialized");
          return res.status(500).json({ error: "Authentication service unavailable - please try again later" });
        }
        try {
          const updatePayload = {};
          if (supabaseUpdates.email) updatePayload.email = supabaseUpdates.email;
          if (supabaseUpdates.password) updatePayload.password = supabaseUpdates.password;
          console.log(`[Credentials] Updating Supabase user ${userId}`);
          const { data, error } = await supabaseServer2.auth.admin.updateUserById(userId, updatePayload);
          if (error) {
            console.error(`[Credentials] Supabase Auth error for user ${userId}:`, JSON.stringify(error));
            return res.status(500).json({ error: `Failed to update authentication credentials: ${error.message || JSON.stringify(error)}` });
          }
          console.log(`[Credentials] Successfully updated Supabase user ${userId}`, data ? "with data" : "no data returned");
        } catch (authError) {
          console.error(`[Credentials] Unexpected error updating Supabase Auth for user ${userId}:`, authError);
          return res.status(500).json({ error: `Failed to update authentication credentials: ${authError.message || "Unknown error"}` });
        }
      }
      console.log(`[Credentials] Updating database for user ${userId}`);
      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        console.error(`[Credentials] Failed to update user ${userId} in database - user not found`);
        return res.status(404).json({ error: "User not found" });
      }
      console.log(`[Credentials] Successfully updated user ${userId} in database`);
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      });
    } catch (error) {
      console.error(`[Credentials] Unhandled error:`, error);
      res.status(500).json({ error: error.message || "Failed to update user credentials" });
    }
  });
  app2.get("/api/result-checker/download/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      console.log("[PDF Guest] Generating PDF for reference:", reference);
      const transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        console.error("[PDF Guest] Transaction not found:", reference);
        return res.status(404).json({ error: "Transaction not found" });
      }
      if (transaction.type !== ProductType.RESULT_CHECKER) {
        console.error("[PDF Guest] Invalid transaction type:", transaction.type);
        return res.status(400).json({ error: "Invalid transaction type" });
      }
      if (transaction.status !== TransactionStatus.COMPLETED && transaction.status !== TransactionStatus.CONFIRMED) {
        console.error("[PDF Guest] Transaction not ready. Status:", transaction.status);
        return res.status(400).json({
          error: `Transaction not ready yet. Status: ${transaction.status}. Please wait for payment confirmation.`,
          transactionStatus: transaction.status,
          paymentStatus: transaction.paymentStatus
        });
      }
      if (transaction.paymentStatus !== "paid") {
        console.error("[PDF Guest] Payment not completed. PaymentStatus:", transaction.paymentStatus);
        return res.status(400).json({
          error: `Payment not completed. Status: ${transaction.paymentStatus}. Please complete payment first.`,
          paymentStatus: transaction.paymentStatus
        });
      }
      let quantity = 1;
      if (transaction.phoneNumbers) {
        try {
          const metadata = JSON.parse(transaction.phoneNumbers);
          if (metadata && typeof metadata === "object" && metadata.quantity) {
            quantity = metadata.quantity;
          }
        } catch (e) {
        }
      }
      console.log("[PDF Guest] Transaction details:", {
        id: transaction.id,
        reference: transaction.reference,
        type: transaction.type,
        status: transaction.status,
        paymentStatus: transaction.paymentStatus,
        customerEmail: transaction.customerEmail,
        productId: transaction.productId,
        productName: transaction.productName,
        quantity
      });
      let type;
      let year;
      const allCheckers = await storage.getResultCheckersByTransaction(transaction.id);
      if (allCheckers.length > 0) {
        type = allCheckers[0].type;
        year = allCheckers[0].year;
        console.log("[PDF Guest] Got type and year from checkers:", { type, year });
      } else if (transaction.deliveredPin || transaction.deliveredSerial) {
        const parts = transaction.productId?.split("-");
        if (parts && parts.length >= 2 && !isNaN(parseInt(parts[1]))) {
          type = parts[0];
          year = parseInt(parts[1]);
          console.log("[PDF Guest] Got type and year from productId:", { type, year });
        } else {
          const nameMatch = transaction.productName?.match(/(\w+)\s+(\d{4})/i);
          if (nameMatch) {
            type = nameMatch[1].toLowerCase();
            year = parseInt(nameMatch[2]);
            console.log("[PDF Guest] Got type and year from productName:", { type, year });
          } else {
            console.error("[PDF Guest] Cannot determine type and year from transaction");
            return res.status(400).json({
              error: "Unable to determine result checker details. Please contact support.",
              reference: transaction.reference
            });
          }
        }
      } else {
        console.error("[PDF Guest] No checkers found and no credentials in transaction");
        return res.status(400).json({
          error: "Result checker credentials not available. Please contact support.",
          reference: transaction.reference
        });
      }
      console.log("[PDF Guest] Product info:", { type, year });
      console.log("[PDF Guest] Found", allCheckers.length, "result checkers linked to transaction");
      const { generateResultCheckerPDF: generateResultCheckerPDF2 } = await Promise.resolve().then(() => (init_pdf_generator(), pdf_generator_exports));
      const pdfData = allCheckers.length > 1 ? {
        type,
        year,
        pins: allCheckers.map((c) => ({ pin: c.pin, serialNumber: c.serialNumber })),
        customerName: transaction.customerEmail?.split("@")[0] || "Customer",
        customerPhone: transaction.customerPhone || void 0,
        purchaseDate: new Date(transaction.completedAt || transaction.createdAt),
        transactionReference: transaction.reference
      } : allCheckers.length === 1 ? {
        type,
        year,
        pin: allCheckers[0].pin,
        serialNumber: allCheckers[0].serialNumber,
        customerName: transaction.customerEmail?.split("@")[0] || "Customer",
        customerPhone: transaction.customerPhone || void 0,
        purchaseDate: new Date(transaction.completedAt || transaction.createdAt),
        transactionReference: transaction.reference
      } : {
        // Fallback to transaction fields
        type,
        year,
        pin: transaction.deliveredPin,
        serialNumber: transaction.deliveredSerial,
        customerName: transaction.customerEmail?.split("@")[0] || "Customer",
        customerPhone: transaction.customerPhone || void 0,
        purchaseDate: new Date(transaction.completedAt || transaction.createdAt),
        transactionReference: transaction.reference
      };
      console.log("[PDF Guest] Generating PDF with data:", { type, year, pinCount: allCheckers.length || 1 });
      const pdfBuffer = await generateResultCheckerPDF2(pdfData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${type.toUpperCase()}-Result-Checker-${year}-${transaction.reference}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      console.log("[PDF Guest] PDF generated successfully, size:", pdfBuffer.length, "bytes");
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[PDF Guest] PDF generation error:", error);
      console.error("[PDF Guest] Error stack:", error.stack);
      res.status(500).json({ error: error.message || "Failed to generate PDF" });
    }
  });
  app2.get("/api/result-checker/:transactionId/pdf", requireAuth, async (req, res) => {
    try {
      const { transactionId } = req.params;
      console.log("[PDF] Generating PDF for transaction:", transactionId);
      const dbUser = await storage.getUserByEmail(req.user.email);
      if (!dbUser) {
        console.error("[PDF] User not found:", req.user.email);
        return res.status(404).json({ error: "User not found" });
      }
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        console.error("[PDF] Transaction not found:", transactionId);
        return res.status(404).json({ error: "Transaction not found" });
      }
      let quantity = 1;
      if (transaction.phoneNumbers) {
        try {
          const metadata = JSON.parse(transaction.phoneNumbers);
          if (metadata && typeof metadata === "object" && metadata.quantity) {
            quantity = metadata.quantity;
          }
        } catch (e) {
        }
      }
      console.log("[PDF] Transaction details:", {
        id: transaction.id,
        type: transaction.type,
        status: transaction.status,
        paymentStatus: transaction.paymentStatus,
        customerEmail: transaction.customerEmail,
        deliveredPin: transaction.deliveredPin,
        deliveredSerial: transaction.deliveredSerial,
        productId: transaction.productId,
        quantity
      });
      if (transaction.customerEmail !== dbUser.email) {
        console.error("[PDF] Access denied. Transaction email:", transaction.customerEmail, "User email:", dbUser.email);
        return res.status(403).json({ error: "Access denied" });
      }
      if (transaction.type !== ProductType.RESULT_CHECKER) {
        console.error("[PDF] Invalid transaction type:", transaction.type);
        return res.status(400).json({ error: "Invalid transaction type" });
      }
      if (transaction.status !== TransactionStatus.COMPLETED && transaction.status !== TransactionStatus.CONFIRMED) {
        console.error("[PDF] Transaction not ready. Status:", transaction.status, "PaymentStatus:", transaction.paymentStatus);
        return res.status(400).json({
          error: `Transaction not ready yet. Status: ${transaction.status}. Please wait for payment confirmation.`,
          transactionStatus: transaction.status,
          paymentStatus: transaction.paymentStatus
        });
      }
      if (transaction.paymentStatus !== "paid") {
        console.error("[PDF] Payment not completed. PaymentStatus:", transaction.paymentStatus);
        return res.status(400).json({
          error: `Payment not completed. Status: ${transaction.paymentStatus}. Please complete payment first.`,
          paymentStatus: transaction.paymentStatus
        });
      }
      if (!transaction.productId) {
        console.error("[PDF] No productId in transaction");
        return res.status(400).json({ error: "Invalid transaction data - missing product information" });
      }
      const [type, yearStr] = transaction.productId.split("-");
      const year = parseInt(yearStr);
      if (!type || !year || isNaN(year)) {
        console.error("[PDF] Invalid productId format:", transaction.productId);
        return res.status(400).json({ error: "Invalid product data format" });
      }
      console.log("[PDF] Product info:", { type, year });
      const allCheckers = await storage.getResultCheckersByTransaction(transactionId);
      console.log("[PDF] Found", allCheckers.length, "result checkers linked to transaction");
      if (allCheckers.length === 0) {
        console.warn("[PDF] No checkers linked via transactionId, checking transaction fields");
        if (!transaction.deliveredPin || !transaction.deliveredSerial) {
          console.error("[PDF] No checkers found and no credentials in transaction fields");
          console.error("[PDF] Transaction dump:", JSON.stringify({
            id: transaction.id,
            reference: transaction.reference,
            status: transaction.status,
            paymentStatus: transaction.paymentStatus,
            deliveredPin: transaction.deliveredPin,
            deliveredSerial: transaction.deliveredSerial
          }));
          return res.status(400).json({
            error: "Result checker credentials not available. Please contact support.",
            details: "Reference: " + transaction.reference,
            transactionId: transaction.id,
            reference: transaction.reference
          });
        }
        console.log("[PDF] Using credentials from transaction deliveredPin/deliveredSerial fields");
      }
      const { generateResultCheckerPDF: generateResultCheckerPDF2 } = await Promise.resolve().then(() => (init_pdf_generator(), pdf_generator_exports));
      const pdfData = allCheckers.length > 1 ? {
        type,
        year,
        pins: allCheckers.map((c) => ({ pin: c.pin, serialNumber: c.serialNumber })),
        customerName: dbUser.name,
        customerPhone: transaction.customerPhone || void 0,
        purchaseDate: new Date(transaction.completedAt || transaction.createdAt),
        transactionReference: transaction.reference
      } : allCheckers.length === 1 ? {
        type,
        year,
        pin: allCheckers[0].pin,
        serialNumber: allCheckers[0].serialNumber,
        customerName: dbUser.name,
        customerPhone: transaction.customerPhone || void 0,
        purchaseDate: new Date(transaction.completedAt || transaction.createdAt),
        transactionReference: transaction.reference
      } : {
        // Fallback to transaction fields
        type,
        year,
        pin: transaction.deliveredPin,
        serialNumber: transaction.deliveredSerial,
        customerName: dbUser.name,
        customerPhone: transaction.customerPhone || void 0,
        purchaseDate: new Date(transaction.completedAt || transaction.createdAt),
        transactionReference: transaction.reference
      };
      console.log("[PDF] Generating PDF with data:", { type, year, pinCount: allCheckers.length || 1 });
      const pdfBuffer = await generateResultCheckerPDF2(pdfData);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${type.toUpperCase()}-Result-Checker-${year}-${transaction.reference}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      console.log("[PDF] PDF generated successfully, size:", pdfBuffer.length, "bytes");
      res.send(pdfBuffer);
    } catch (error) {
      console.error("[PDF] PDF generation error:", error);
      console.error("[PDF] Error stack:", error.stack);
      res.status(500).json({ error: error.message || "Failed to generate PDF" });
    }
  });
  app2.get("/api/debug/transaction/:transactionId", requireAuth, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      const checkers = await storage.getResultCheckersByTransaction(transactionId);
      res.json({
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          type: transaction.type,
          status: transaction.status,
          paymentStatus: transaction.paymentStatus,
          deliveredPin: transaction.deliveredPin,
          deliveredSerial: transaction.deliveredSerial,
          productId: transaction.productId,
          customerEmail: transaction.customerEmail,
          completedAt: transaction.completedAt,
          createdAt: transaction.createdAt
        },
        checkers: checkers.map((c) => ({
          id: c.id,
          pin: c.pin,
          serialNumber: c.serialNumber,
          isSold: c.isSold,
          soldAt: c.soldAt
        })),
        checkersCount: checkers.length
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/admin/result-checker/:transactionId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      if (transaction.type !== ProductType.RESULT_CHECKER) {
        return res.status(400).json({ error: "Not a result checker transaction" });
      }
      const checkers = await storage.getResultCheckersByTransaction(transactionId);
      res.json({
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          customerPhone: transaction.customerPhone,
          customerEmail: transaction.customerEmail,
          quantity: transaction.quantity || checkers.length,
          status: transaction.status
        },
        checkers: checkers.map((checker) => ({
          id: checker.id,
          pin: checker.pin,
          serialNumber: checker.serialNumber,
          type: checker.type,
          year: checker.year,
          soldAt: checker.soldAt,
          soldToPhone: checker.soldToPhone
        }))
      });
    } catch (error) {
      console.error("Failed to fetch result checkers:", error);
      res.status(500).json({ error: error.message || "Failed to fetch result checkers" });
    }
  });
  app2.get("/api/user/api-keys", requireAuth, async (req, res) => {
    try {
      const apiKeys2 = await storage.getApiKeys(req.user.id);
      res.json(apiKeys2);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to fetch API keys" });
    }
  });
  app2.post("/api/user/api-keys", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "API key name is required" });
      }
      const key = generateSecureApiKey("sk");
      let resolvedUserId = req.user.id;
      try {
        const dbUser = await storage.getUserByEmail(req.user.email);
        if (dbUser) {
          resolvedUserId = dbUser.id;
        } else {
          try {
            await storage.createUser({
              id: req.user.id,
              email: req.user.email,
              password: "",
              name: req.user.user_metadata?.name || req.user.email.split("@")[0],
              phone: req.user?.phone || null,
              role: "user",
              isActive: true
            });
          } catch (createErr) {
            console.error("Failed to create DB user for API key creation:", createErr);
            const fallback = await storage.getUserByEmail(req.user.email);
            if (fallback) resolvedUserId = fallback.id;
          }
        }
      } catch (err) {
        console.error("Error resolving DB user id for API key creation:", err);
      }
      const apiKey = await storage.createApiKey({
        userId: resolvedUserId,
        name: name.trim(),
        key,
        permissions: "{}",
        isActive: true
      });
      res.json({
        ...apiKey,
        key
        // Include the key in response
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to create API key" });
    }
  });
  app2.delete("/api/user/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const apiKeys2 = await storage.getApiKeys(req.user.id);
      const apiKey = apiKeys2.find((k) => k.id === id);
      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      await storage.deleteApiKey(apiKey.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to revoke API key" });
    }
  });
  app2.get("/api/v1/user/balance", requireApiKey, async (req, res) => {
    try {
      const user = await storage.getUser(req.apiKey.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        balance: user.walletBalance,
        currency: "GHS"
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get balance" });
    }
  });
  app2.get("/api/v1/user/transactions", requireApiKey, async (req, res) => {
    try {
      const user = await storage.getUser(req.apiKey.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { limit = 10, offset = 0 } = req.query;
      const transactions2 = await storage.getTransactions({
        customerEmail: user.email,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      res.json({
        transactions: transactions2.map((t) => ({
          id: t.id,
          reference: t.reference,
          type: t.type,
          amount: t.amount,
          status: t.status,
          createdAt: t.createdAt
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get transactions" });
    }
  });
  app2.get("/api/admin/external-balance", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { providerId } = req.query;
      console.log("[External Balance] Testing provider:", providerId);
      if (!providerId || typeof providerId !== "string") {
        return res.status(400).json({ error: "Provider ID is required" });
      }
      const result = await getExternalBalance(providerId);
      console.log("[External Balance] Result:", result);
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      console.error("[External Balance] Error:", error);
      res.status(500).json({ error: error.message || "Failed to get external balance" });
    }
  });
  app2.get("/api/admin/external-prices", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { network, min_capacity, max_capacity, effective, providerId } = req.query;
      const result = await getExternalPrices(
        network,
        min_capacity ? parseInt(min_capacity) : void 0,
        max_capacity ? parseInt(max_capacity) : void 0,
        effective ? effective === "1" || effective === "true" : void 0,
        providerId
      );
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ error: result.error });
      }
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get external prices" });
    }
  });
  app2.get("/api/order-status/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Order not found" });
      }
      console.log(`[OrderStatus API] Fetching status for transaction ${transaction.reference}`);
      let skytechRef = null;
      if (transaction.apiResponse) {
        try {
          const apiResponse = JSON.parse(transaction.apiResponse);
          if (apiResponse.results && apiResponse.results.length > 0) {
            skytechRef = apiResponse.results[0].ref;
          }
        } catch (e) {
          console.warn(`Failed to parse API response for transaction ${id}`);
        }
      }
      if (!skytechRef) {
        console.log(`[OrderStatus API] No SkyTech ref - returning cached status: ${transaction.deliveryStatus}`);
        return res.json({
          id: transaction.id,
          reference: transaction.reference,
          status: transaction.status,
          deliveryStatus: transaction.deliveryStatus,
          productName: transaction.productName,
          amount: transaction.amount,
          customerPhone: transaction.customerPhone,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
          isSkyTechOrder: false,
          cached: true
        });
      }
      const statusResult = await getExternalOrderStatus(skytechRef, transaction.providerId ?? void 0);
      if (statusResult.success && statusResult.order) {
        const orderData = statusResult.order;
        const skytechStatus = orderData.status?.toLowerCase();
        console.log(`[OrderStatus API] SkyTech returned status: ${skytechStatus} (raw: ${orderData.status})`);
        let newStatus = transaction.status;
        let newDeliveryStatus = transaction.deliveryStatus;
        switch (skytechStatus) {
          case "completed":
          case "delivered":
          case "success":
            newStatus = TransactionStatus.COMPLETED;
            newDeliveryStatus = "delivered";
            console.log(`[OrderStatus API] Mapping to DELIVERED`);
            break;
          case "failed":
          case "error":
            newStatus = TransactionStatus.FAILED;
            newDeliveryStatus = "failed";
            console.log(`[OrderStatus API] Mapping to FAILED`);
            break;
          case "processing":
            newStatus = TransactionStatus.PENDING;
            newDeliveryStatus = "processing";
            console.log(`[OrderStatus API] Mapping to PROCESSING`);
            break;
          case "pending":
          case "queued":
            newStatus = TransactionStatus.PENDING;
            newDeliveryStatus = "processing";
            console.log(`[OrderStatus API] Mapping PENDING/QUEUED to PROCESSING`);
            break;
        }
        if (newStatus !== transaction.status || newDeliveryStatus !== transaction.deliveryStatus) {
          console.log(`[OrderStatus API] Updating transaction: ${transaction.deliveryStatus} -> ${newDeliveryStatus}`);
          await storage.updateTransaction(id, {
            status: newStatus,
            deliveryStatus: newDeliveryStatus,
            completedAt: newStatus === TransactionStatus.COMPLETED ? /* @__PURE__ */ new Date() : transaction.completedAt
          });
        }
        return res.json({
          id: transaction.id,
          reference: transaction.reference,
          status: newStatus,
          deliveryStatus: newDeliveryStatus,
          productName: transaction.productName,
          amount: transaction.amount,
          customerPhone: transaction.customerPhone,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt || (newStatus === TransactionStatus.COMPLETED ? /* @__PURE__ */ new Date() : null),
          isSkyTechOrder: true,
          skytechStatus,
          skytechData: orderData
        });
      } else {
        console.warn(`[OrderStatus API] SkyTech fetch failed: ${statusResult.error}`);
        return res.json({
          id: transaction.id,
          reference: transaction.reference,
          status: transaction.status,
          deliveryStatus: transaction.deliveryStatus,
          productName: transaction.productName,
          amount: transaction.amount,
          customerPhone: transaction.customerPhone,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
          isSkyTechOrder: true,
          cached: true,
          error: statusResult.error
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to fetch order status" });
    }
  });
  app2.post("/api/admin/refresh-order-status/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Order not found" });
      }
      console.log(`[AdminRefresh] Refreshing order status for transaction ${transaction.reference}`);
      let skytechRef = null;
      if (transaction.apiResponse) {
        try {
          const apiResponse = JSON.parse(transaction.apiResponse);
          if (apiResponse.results && apiResponse.results.length > 0) {
            skytechRef = apiResponse.results[0].ref;
          }
        } catch (e) {
          console.warn(`[AdminRefresh] Failed to parse API response for transaction ${id}`);
        }
      }
      if (!skytechRef) {
        return res.status(400).json({ error: "No SkyTech reference found for this order" });
      }
      console.log(`[AdminRefresh] Fetching SkyTech status for ref: ${skytechRef}`);
      const statusResult = await getExternalOrderStatus(skytechRef, transaction.providerId ?? void 0);
      if (statusResult.success && statusResult.order) {
        const orderData = statusResult.order;
        const skytechStatus = orderData.status?.toLowerCase();
        console.log(`[AdminRefresh] SkyTech returned: ${skytechStatus} (raw: ${orderData.status})`);
        let newStatus = transaction.status;
        let newDeliveryStatus = transaction.deliveryStatus;
        let completedAt = transaction.completedAt;
        switch (skytechStatus) {
          case "completed":
          case "delivered":
          case "success":
            newStatus = TransactionStatus.COMPLETED;
            newDeliveryStatus = "delivered";
            if (!completedAt) completedAt = /* @__PURE__ */ new Date();
            console.log(`[AdminRefresh] Mapping to DELIVERED`);
            break;
          case "failed":
          case "error":
            newStatus = TransactionStatus.FAILED;
            newDeliveryStatus = "failed";
            if (!completedAt) completedAt = /* @__PURE__ */ new Date();
            console.log(`[AdminRefresh] Mapping to FAILED`);
            break;
          case "processing":
            newStatus = TransactionStatus.PENDING;
            newDeliveryStatus = "processing";
            console.log(`[AdminRefresh] Mapping to PROCESSING`);
            break;
          case "pending":
          case "queued":
            newStatus = TransactionStatus.PENDING;
            newDeliveryStatus = "processing";
            console.log(`[AdminRefresh] Mapping PENDING/QUEUED to PROCESSING`);
            break;
        }
        console.log(`[AdminRefresh] Updating transaction: ${transaction.deliveryStatus} -> ${newDeliveryStatus}`);
        await storage.updateTransaction(id, {
          status: newStatus,
          deliveryStatus: newDeliveryStatus,
          completedAt
        });
        return res.json({
          success: true,
          message: `Order status updated to ${skytechStatus}`,
          transaction: {
            id: transaction.id,
            reference: transaction.reference,
            status: newStatus,
            deliveryStatus: newDeliveryStatus,
            skytechStatus
          }
        });
      } else {
        console.error(`[AdminRefresh] SkyTech fetch failed: ${statusResult.error}`);
        return res.status(500).json({ error: statusResult.error || "Failed to fetch SkyTech status" });
      }
    } catch (error) {
      console.error(`[AdminRefresh] Error: ${error.message}`);
      res.status(500).json({ error: error.message || "Failed to refresh order status" });
    }
  });
  app2.get("/api/my-orders", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const customerOrders = await db.select().from(transactions).where(eq2(transactions.customerEmail, user.email)).orderBy(desc2(transactions.createdAt)).limit(50);
      res.json(customerOrders);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to fetch orders" });
    }
  });
  app2.get("/api/admin/external-providers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const providers = await storage.getExternalApiProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get external API providers" });
    }
  });
  app2.get("/api/admin/external-providers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await storage.getExternalApiProvider(id);
      if (!provider) {
        return res.status(404).json({ error: "External API provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get external API provider" });
    }
  });
  app2.post("/api/admin/external-providers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const providerData = req.body;
      const provider = await storage.createExternalApiProvider(providerData);
      res.status(201).json(provider);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to create external API provider" });
    }
  });
  app2.put("/api/admin/external-providers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const providerData = req.body;
      const provider = await storage.updateExternalApiProvider(id, providerData);
      if (!provider) {
        return res.status(404).json({ error: "External API provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to update external API provider" });
    }
  });
  app2.delete("/api/admin/external-providers/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExternalApiProvider(id);
      if (!deleted) {
        return res.status(404).json({ error: "External API provider not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to delete external API provider" });
    }
  });
  app2.post("/api/admin/external-providers/:id/set-default", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.setDefaultExternalApiProvider(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to set default external API provider" });
    }
  });
  app2.put("/api/user/api-keys/:id/permissions", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      if (!permissions || typeof permissions !== "object") {
        return res.status(400).json({ error: "Permissions object is required" });
      }
      const apiKeys2 = await storage.getApiKeys(req.user.id);
      const apiKey = apiKeys2.find((k) => k.id === id);
      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      await storage.updateApiKey(apiKey.id, {
        permissions: JSON.stringify(permissions)
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to update API key permissions" });
    }
  });
  app2.put("/api/user/api-keys/:id/toggle", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const apiKeys2 = await storage.getApiKeys(req.user.id);
      const apiKey = apiKeys2.find((k) => k.id === id);
      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      await storage.updateApiKey(apiKey.id, {
        isActive: !apiKey.isActive
      });
      res.json({ success: true, isActive: !apiKey.isActive });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to toggle API key status" });
    }
  });
  app2.get("/api/v1/bundles", requireApiKey, async (req, res) => {
    try {
      const { network, agent } = req.query;
      const bundles = await storage.getDataBundles();
      let filteredBundles = bundles.filter((b) => b.isActive);
      if (network && typeof network === "string") {
        filteredBundles = filteredBundles.filter((b) => b.network === network);
      }
      if (agent && typeof agent === "string") {
        const agentData = await storage.getAgentBySlug(agent);
        if (agentData) {
          const customPricing2 = await storage.getCustomPricing(agentData.id, "agent");
          const pricingMap = new Map(customPricing2.map((p) => [p.productId, p.sellingPrice]));
          filteredBundles = filteredBundles.map((bundle) => ({
            ...bundle,
            effective_price: pricingMap.get(bundle.id) || bundle.agentPrice
          }));
        }
      }
      res.json({
        bundles: filteredBundles.map((b) => {
          let effectivePrice = b.basePrice;
          if (agent && typeof agent === "string") {
            const agentData = filteredBundles.find((fb) => fb.id === b.id);
            effectivePrice = agentData?.effective_price || b.agentPrice || b.basePrice;
          }
          return {
            id: b.id,
            name: b.name,
            network: b.network,
            dataAmount: b.dataAmount,
            validity: b.validity,
            price: effectivePrice,
            currency: "GHS"
          };
        })
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get bundles" });
    }
  });
  app2.post("/api/v1/bundles/purchase", requireApiKey, async (req, res) => {
    try {
      const { bundleId, phone, email, agentSlug } = req.body;
      if (!bundleId || !phone || !email) {
        return res.status(400).json({ error: "bundleId, phone, and email are required" });
      }
      const hasPurchasePermission = hasPermissions(req.apiKey.permissions, ["purchase"]);
      if (!hasPurchasePermission) {
        return res.status(403).json({ error: "API key does not have purchase permission" });
      }
      const bundle = await storage.getDataBundle(bundleId);
      if (!bundle || !bundle.isActive) {
        return res.status(404).json({ error: "Bundle not found or inactive" });
      }
      let price = bundle.basePrice;
      if (agentSlug) {
        const agent = await storage.getAgentBySlug(agentSlug);
        if (agent) {
          const customPricing2 = await storage.getCustomPricing(agent.id, "agent");
          const agentPrice = customPricing2.find((p) => p.productId === bundleId)?.sellingPrice;
          if (agentPrice) price = agentPrice;
        }
      }
      const user = await storage.getUser(req.apiKey.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const balance = parseFloat(user.walletBalance || "0");
      const priceNum = parseFloat(price);
      if (balance < priceNum) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }
      const reference = `API-${Date.now()}-${randomBytes2(4).toString("hex").toUpperCase()}`;
      let providerId;
      if (bundle.network) {
        const provider = await storage.getProviderForNetwork(bundle.network.toLowerCase());
        if (provider) {
          providerId = provider.id;
          console.log(`[API] Selected provider ${provider.name} (${provider.id}) for network ${bundle.network}`);
        }
      }
      const transaction = await storage.createTransaction({
        reference,
        type: "data_bundle",
        productId: bundleId,
        productName: bundle.name,
        network: bundle.network,
        amount: price,
        profit: "0",
        // API purchases don't generate profit
        customerPhone: phone,
        customerEmail: email,
        phoneNumbers: phone,
        isBulkOrder: false,
        status: "pending",
        deliveryStatus: "pending",
        agentId: agentSlug ? (await storage.getAgentBySlug(agentSlug))?.id : null,
        agentProfit: "0",
        deliveredPin: null,
        deliveredSerial: null,
        failureReason: null,
        apiResponse: null,
        providerId
      });
      await storage.updateUser(user.id, {
        walletBalance: (balance - priceNum).toFixed(2)
      });
      console.log("[API] Processing data bundle transaction via API:", transaction.reference);
      const fulfillmentResult = await fulfillDataBundleTransaction(transaction, transaction.providerId ?? void 0);
      await storage.updateTransaction(transaction.id, { apiResponse: JSON.stringify(fulfillmentResult) });
      if (fulfillmentResult && fulfillmentResult.success && fulfillmentResult.results && fulfillmentResult.results.length > 0) {
        const allSuccess = fulfillmentResult.results.every((r) => r.status === "pending" || r.status === "success");
        if (allSuccess) {
          await storage.updateTransaction(transaction.id, {
            status: "pending",
            deliveryStatus: "processing",
            completedAt: null
          });
        } else {
          await storage.updateTransaction(transaction.id, {
            status: "failed",
            deliveryStatus: "failed",
            completedAt: /* @__PURE__ */ new Date(),
            failureReason: "API fulfillment failed for some items"
          });
        }
      } else {
        console.error("[API] Data bundle API fulfillment failed:", fulfillmentResult.error);
        await storage.updateTransaction(transaction.id, {
          status: "failed",
          deliveryStatus: "failed",
          completedAt: /* @__PURE__ */ new Date(),
          failureReason: `API fulfillment failed: ${fulfillmentResult.error}`
        });
      }
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          bundle: {
            name: bundle.name,
            network: bundle.network,
            dataAmount: bundle.dataAmount,
            validity: bundle.validity
          },
          amount: price,
          phone,
          status: "completed"
        }
      });
    } catch (error) {
      console.error("API bundle purchase error:", error);
      res.status(500).json({ error: error.message || "Failed to purchase bundle" });
    }
  });
  app2.get("/api/v1/transactions/:reference", requireApiKey, async (req, res) => {
    try {
      const { reference } = req.params;
      const transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      if (transaction.customerEmail !== (await storage.getUser(req.apiKey.userId))?.email) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json({
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          type: transaction.type,
          productName: transaction.productName,
          amount: transaction.amount,
          status: transaction.status,
          deliveryStatus: transaction.deliveryStatus,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get transaction" });
    }
  });
  app2.get("/api/v1/result-checkers/stock", requireApiKey, async (req, res) => {
    try {
      const stock = await storage.getResultCheckerSummary();
      res.json({
        stock: stock.map((item) => ({
          type: item.type,
          year: item.year,
          available: item.available,
          price: "50.00",
          // Fixed price for result checkers
          currency: "GHS"
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to get result checker stock" });
    }
  });
  app2.post("/api/v1/result-checkers/purchase", requireApiKey, async (req, res) => {
    try {
      const { type, year, quantity = 1 } = req.body;
      if (!type || !year) {
        return res.status(400).json({ error: "type and year are required" });
      }
      const hasPurchasePermission = hasPermissions(req.apiKey.permissions, ["purchase"]);
      if (!hasPurchasePermission) {
        return res.status(403).json({ error: "API key does not have purchase permission" });
      }
      const stock = await storage.getResultCheckerSummary();
      const item = stock.find((s) => s.type === type && s.year === parseInt(year));
      if (!item || item.available < quantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      const user = await storage.getUser(req.apiKey.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const totalAmount = (50 * quantity).toFixed(2);
      const balance = parseFloat(user.walletBalance || "0");
      if (balance < parseFloat(totalAmount)) {
        return res.status(400).json({ error: "Insufficient wallet balance" });
      }
      const reference = `API-RC-${Date.now()}-${randomBytes2(4).toString("hex").toUpperCase()}`;
      const transaction = await storage.createTransaction({
        reference,
        type: "result_checker",
        productId: `${type}_${year}`,
        productName: `${type.toUpperCase()} ${year} Result Checker`,
        network: null,
        amount: totalAmount,
        profit: "0",
        customerPhone: user.phone || "",
        customerEmail: user.email,
        phoneNumbers: null,
        isBulkOrder: false,
        status: "pending",
        deliveryStatus: "pending",
        agentId: null,
        agentProfit: "0",
        deliveredPin: null,
        deliveredSerial: null,
        failureReason: null,
        apiResponse: null
      });
      await storage.updateUser(user.id, {
        walletBalance: (balance - parseFloat(totalAmount)).toFixed(2)
      });
      const availableCheckers = await storage.getResultCheckers({ type, year: parseInt(year), isSold: false });
      const checkersToSell = availableCheckers.slice(0, quantity);
      for (const checker of checkersToSell) {
        await storage.markResultCheckerSold(checker.id, transaction.id, user.phone);
      }
      await storage.updateTransaction(transaction.id, {
        status: "completed",
        deliveryStatus: "delivered",
        completedAt: /* @__PURE__ */ new Date()
      });
      res.json({
        success: true,
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          product: {
            type,
            year,
            quantity
          },
          amount: totalAmount,
          status: "completed"
        }
      });
    } catch (error) {
      console.error("API result checker purchase error:", error);
      res.status(500).json({ error: error.message || "Failed to purchase result checker" });
    }
  });
  app2.post("/api/webhooks/transaction-status", async (req, res) => {
    try {
      const { reference, status, provider, metadata } = req.body;
      console.log(`Webhook received for transaction ${reference}: ${status}`);
      const transaction = await storage.getTransactionByReference(reference);
      if (transaction) {
        await storage.updateTransaction(transaction.id, {
          status,
          apiResponse: JSON.stringify({ provider, metadata }),
          ...status === "completed" ? { completedAt: /* @__PURE__ */ new Date() } : {}
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.post("/api/cron/update-order-statuses", async (req, res) => {
    try {
      console.log("[Cron] Starting order status update check");
      const pendingTransactions = await storage.getTransactionsByStatusAndDelivery(
        ["pending", "completed"],
        ["processing", "pending"]
      );
      console.log(`[Cron] Found ${pendingTransactions.length} transactions to check`);
      let updatedCount = 0;
      let errorCount = 0;
      for (const transaction of pendingTransactions) {
        try {
          if (transaction.type !== ProductType.DATA_BUNDLE) {
            continue;
          }
          let skytechRef = null;
          if (transaction.apiResponse) {
            try {
              const apiResponse = JSON.parse(transaction.apiResponse);
              if (apiResponse.results && apiResponse.results.length > 0) {
                skytechRef = apiResponse.results[0].ref;
              }
            } catch (e) {
              console.warn(`[Cron] Failed to parse API response for transaction ${transaction.id}`);
            }
          }
          if (!skytechRef) {
            console.warn(`[Cron] No SkyTech reference found for transaction ${transaction.id}`);
            continue;
          }
          const statusResult = await getExternalOrderStatus(skytechRef, transaction.providerId ?? void 0);
          if (statusResult.success && statusResult.order) {
            const orderData = statusResult.order;
            console.log(`[Cron] SkyTech status for ${skytechRef}: ${orderData.status}`);
            let newStatus = transaction.status;
            let newDeliveryStatus = transaction.deliveryStatus;
            const skytechStatus = orderData.status?.toLowerCase();
            console.log(`[Cron] SkyTech status for transaction ${transaction.id}: ${skytechStatus}`);
            switch (skytechStatus) {
              case "completed":
              case "delivered":
              case "success":
                newStatus = TransactionStatus.COMPLETED;
                newDeliveryStatus = "delivered";
                console.log(`[Cron] \u2705 Mapping to DELIVERED for transaction ${transaction.id}`);
                break;
              case "failed":
              case "error":
                newStatus = TransactionStatus.FAILED;
                newDeliveryStatus = "failed";
                console.log(`[Cron] \u274C Mapping to FAILED for transaction ${transaction.id}`);
                break;
              case "processing":
                newStatus = TransactionStatus.PENDING;
                newDeliveryStatus = "processing";
                console.log(`[Cron] \u{1F504} Mapping to PROCESSING for transaction ${transaction.id}`);
                break;
              case "pending":
              case "queued":
                newStatus = TransactionStatus.PENDING;
                newDeliveryStatus = "processing";
                console.log(`[Cron] \u{1F504} Mapping PENDING/QUEUED to PROCESSING for transaction ${transaction.id}`);
                break;
              default:
                console.log(`[Cron] \u26A0\uFE0F Unknown SkyTech status for transaction ${transaction.id}: ${orderData.status}`);
                break;
            }
            const statusChanged = newStatus !== transaction.status || newDeliveryStatus !== transaction.deliveryStatus;
            if (statusChanged) {
              const updateData = {
                status: newStatus,
                deliveryStatus: newDeliveryStatus,
                apiResponse: JSON.stringify({
                  ...JSON.parse(transaction.apiResponse || "{}"),
                  lastStatusCheck: (/* @__PURE__ */ new Date()).toISOString(),
                  skytechStatus: orderData
                })
              };
              if (newStatus === TransactionStatus.COMPLETED && !transaction.completedAt) {
                updateData.completedAt = /* @__PURE__ */ new Date();
              }
              await storage.updateTransaction(transaction.id, updateData);
              updatedCount++;
              console.log(`[Cron] Updated transaction ${transaction.id} - status: ${newStatus}, delivery: ${newDeliveryStatus} (from SkyTech: ${orderData.status})`);
            }
          } else {
            console.warn(`[Cron] Failed to get status for SkyTech ref ${skytechRef}: ${statusResult.error}`);
            errorCount++;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`[Cron] Error processing transaction ${transaction.id}:`, error.message);
          errorCount++;
        }
      }
      console.log(`[Cron] Order status update completed. Updated: ${updatedCount}, Errors: ${errorCount}`);
      res.json({
        success: true,
        message: `Checked ${pendingTransactions.length} transactions, updated ${updatedCount}, errors ${errorCount}`
      });
    } catch (error) {
      console.error("[Cron] Order status update failed:", error);
      res.status(500).json({ error: "Order status update failed", details: error.message });
    }
  });
  app2.post("/api/cron/cleanup-failed-orders", async (req, res) => {
    try {
      console.log("[Cron] Starting failed order cleanup");
      const cutoffDate = /* @__PURE__ */ new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      const failedTransactions = await storage.getFailedTransactionsOlderThan(cutoffDate);
      console.log(`[Cron] Found ${failedTransactions.length} old failed transactions to clean up`);
      let cleanedCount = 0;
      for (const transaction of failedTransactions) {
        try {
          await storage.updateTransaction(transaction.id, {
            deliveryStatus: "permanently_failed",
            apiResponse: JSON.stringify({
              ...JSON.parse(transaction.apiResponse || "{}"),
              cleanupDate: (/* @__PURE__ */ new Date()).toISOString(),
              cleanupReason: "Auto-cleanup after 24 hours"
            })
          });
          cleanedCount++;
        } catch (error) {
          console.error(`[Cron] Error cleaning up transaction ${transaction.id}:`, error.message);
        }
      }
      console.log(`[Cron] Cleanup completed. Cleaned: ${cleanedCount}`);
      res.json({
        success: true,
        message: `Cleaned up ${cleanedCount} old failed transactions`
      });
    } catch (error) {
      console.error("[Cron] Cleanup failed:", error);
      res.status(500).json({ error: "Cleanup failed", details: error.message });
    }
  });
}

// src/server/index.ts
import { createServer } from "http";
import cors from "cors";
import multer2 from "multer";
import fs3 from "fs";
var __serverFilename = fileURLToPath4(import.meta.url);
var __serverDirname = path4.dirname(__serverFilename);
var rootDir = path4.resolve(__serverDirname, "../..");
function loadEnvironment() {
  const hasHostingEnvVars = Boolean(
    process.env.DATABASE_URL || process.env.SUPABASE_URL
  );
  if (hasHostingEnvVars) {
    return;
  }
  const nodeEnv = process.env.NODE_ENV || "development";
  dotenv.config({ path: path4.join(rootDir, ".env") });
  const envFile = nodeEnv === "production" ? ".env.production" : ".env.development";
  dotenv.config({ path: path4.join(rootDir, envFile), override: true });
}
loadEnvironment();
function validateEnv() {
  const required = ["DATABASE_URL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
  }
}
validateEnv();
var supabaseServerInstance = null;
function initializeSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseServerInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseServerInstance;
}
function getSupabaseServer() {
  return supabaseServerInstance;
}
var supabaseServer = null;
if (process.env.SKIP_DB !== "true") {
  initializeSupabase();
}
var __dirname3 = __serverDirname;
var REQUEST_TIMEOUT_MS = 30 * 1e3;
var SOCKET_TIMEOUT_MS = 60 * 1e3;
var KEEP_ALIVE_TIMEOUT_MS = 65 * 1e3;
function serveStatic(app2) {
  const distPath = path4.resolve(__dirname3, "../../dist/public");
  if (!fs3.existsSync(distPath)) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`
      );
    }
    return;
  }
  app2.use(express.static(distPath));
  app2.get("/", (req, res) => {
    const indexPath = path4.resolve(distPath, "index.html");
    if (fs3.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("Application not built properly");
    }
  });
  app2.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    const indexPath = path4.resolve(distPath, "index.html");
    if (fs3.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(500).send("Application not built properly");
    }
  });
}
var app = express();
var httpServer = createServer(app);
var index_default = app;
var rateLimitMap = /* @__PURE__ */ new Map();
var createRateLimiter = (maxRequests, windowMs, options) => {
  const blockDurationMs = options?.blockDurationMs || windowMs;
  return async (req, res, next) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const now = Date.now();
      let record = rateLimitMap.get(ip);
      if (record?.blockedUntil && now < record.blockedUntil) {
        const remainingTime = Math.ceil((record.blockedUntil - now) / 1e3);
        res.set("Retry-After", String(Math.ceil(remainingTime / 60)));
        return res.status(429).json({
          error: "Too many requests",
          message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
          retryAfter: remainingTime
        });
      }
      if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }
      if (record.count >= maxRequests) {
        record.blockedUntil = now + blockDurationMs;
        const remainingTime = Math.ceil(blockDurationMs / 1e3);
        res.set("Retry-After", String(Math.ceil(remainingTime / 60)));
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: `Too many requests from this IP. Blocked for ${Math.ceil(remainingTime / 60)} minute(s).`,
          retryAfter: remainingTime
        });
      }
      record.count++;
      next();
    } catch (error) {
      next();
    }
  };
};
var startRateLimitCleanup = () => {
  setInterval(async () => {
    try {
      const now = Date.now();
      let cleaned = 0;
      for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetTime && (!record.blockedUntil || now > record.blockedUntil)) {
          rateLimitMap.delete(ip);
          cleaned++;
        }
      }
      if (cleaned > 0) {
      }
    } catch (error) {
    }
  }, 60 * 60 * 1e3);
};
startRateLimitCleanup();
app.use(async (req, res, next) => {
  try {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: "Request timeout" });
        req.socket.destroy();
      }
    }, REQUEST_TIMEOUT_MS);
    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://api.paystack.co https://checkout.paystack.com https://h.online-metrix.net; script-src-elem 'self' 'unsafe-inline' https://js.paystack.co https://api.paystack.co https://checkout.paystack.com https://h.online-metrix.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.paystack.co https://js.paystack.co https://checkout.paystack.com https://h.online-metrix.net https://jddstfppigucldetsxws.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com; frame-src https://js.paystack.co https://checkout.paystack.com; object-src 'none'; base-uri 'self'; form-action 'self';");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  } catch (error) {
    next();
  }
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: process.uptime(),
    rateLimitDisabled: process.env.DISABLE_RATE_LIMIT === "true"
  });
});
app.get("/api/health/db", async (_req, res) => {
  try {
    const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    if (!pool2) {
      return res.status(503).json({ status: "error", message: "Database pool not initialized" });
    }
    const client = await pool2.connect();
    try {
      const result = await client.query("SELECT NOW()");
      client.release();
      res.status(200).json({
        status: "ok",
        message: "Database connection healthy",
        timestamp: result.rows[0]?.now
      });
    } catch (err) {
      client.release();
      res.status(503).json({
        status: "error",
        message: "Database query failed",
        error: err.message
      });
    }
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Database pool error",
      error: error.message
    });
  }
});
app.use(async (req, res, next) => {
  try {
    const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    req.dbPool = pool2;
    if (pool2 && pool2.totalCount > 0) {
      const idleCount = pool2.idleCount || 0;
      const totalCount = pool2.totalCount || 0;
    }
    next();
  } catch (error) {
    next();
  }
});
var disableRateLimit = process.env.DISABLE_RATE_LIMIT === "true";
if (!disableRateLimit) {
  app.use("/api/auth/login", createRateLimiter(10, 15 * 60 * 1e3, { blockDurationMs: 30 * 60 * 1e3 }));
  app.use("/api/auth/register", createRateLimiter(10, 30 * 60 * 1e3, { blockDurationMs: 60 * 60 * 1e3 }));
  app.use("/api/agent/register", createRateLimiter(10, 30 * 60 * 1e3, { blockDurationMs: 60 * 60 * 1e3 }));
  app.use("/api/", createRateLimiter(100, 60 * 1e3));
}
if (process.env.NODE_ENV !== "production") {
  app.post("/api/dev/clear-rate-limits", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    rateLimitMap.delete(ip);
    res.json({ message: `Rate limits cleared for ${ip}` });
  });
}
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    setImmediate(() => {
      try {
        const duration = Date.now() - start;
        if (path5.startsWith("/api")) {
          let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }
          log(logLine);
        }
      } catch (error) {
      }
    });
  });
  next();
});
var assetsUploadPath = process.env.NODE_ENV === "production" ? path4.join(process.cwd(), "dist", "public", "assets") : path4.join(process.cwd(), "client", "public", "assets");
try {
  if (!fs3.existsSync(assetsUploadPath)) {
    fs3.mkdirSync(assetsUploadPath, { recursive: true });
  }
} catch (error) {
}
var storage2 = multer2.diskStorage({
  destination: (req, file, cb) => {
    cb(null, assetsUploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "_" + uniqueSuffix + path4.extname(file.originalname));
  }
});
var upload = multer2({
  storage: storage2,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
global.upload = upload;
var FRONTEND_URL = process.env.APP_URL || (process.env.NODE_ENV === "production" ? "https://resellershubprogh.com" : process.env.NODE_ENV === "development" ? "http://localhost:5173" : `http://localhost:${process.env.PORT || 1e4}`);
var allowedOrigins = [
  FRONTEND_URL,
  "https://resellershubprogh.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:")) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Cache-Control", "Pragma", "Expires"],
  exposedHeaders: ["Content-Length", "Content-Type"]
}));
var SessionStore = MemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-secret-key-in-production",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 864e5
      // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  })
);
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    await registerRoutes(httpServer, app);
    app.use((err, _req, res, _next) => {
      setImmediate(async () => {
        try {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          if (!res.headersSent) {
            res.status(status).json({ message });
          }
        } catch (error) {
        }
      });
    });
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite: setupVite2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
      await setupVite2(httpServer, app);
    }
    httpServer.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
    httpServer.headersTimeout = KEEP_ALIVE_TIMEOUT_MS + 5e3;
    httpServer.on("connection", (socket) => {
      socket.setTimeout(SOCKET_TIMEOUT_MS);
      socket.on("timeout", () => {
        socket.destroy();
      });
    });
    const PORT = Number(process.env.PORT) || 3e3;
    const HOST = "0.0.0.0";
    httpServer.listen(
      {
        port: PORT,
        host: HOST
      },
      () => {
      }
    );
  } catch (error) {
    process.exit(1);
  }
})();
process.on("uncaughtException", (err) => {
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});
process.on("unhandledRejection", (reason, promise) => {
});
process.on("SIGTERM", async () => {
  httpServer.close(() => {
    process.exit(0);
  });
  setTimeout(() => {
    process.exit(1);
  }, 3e4);
});
process.on("SIGINT", async () => {
  httpServer.close(() => {
    process.exit(0);
  });
});
export {
  app,
  index_default as default,
  getSupabaseServer,
  log,
  supabaseServer
};
