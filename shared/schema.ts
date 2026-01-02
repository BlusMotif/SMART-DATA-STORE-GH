import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User roles enum
export const UserRole = {
  ADMIN: "admin",
  AGENT: "agent",
  GUEST: "guest",
} as const;

// Transaction status enum
export const TransactionStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

// Product type enum
export const ProductType = {
  DATA_BUNDLE: "data_bundle",
  RESULT_CHECKER: "result_checker",
} as const;

// Network provider enum
export const NetworkProvider = {
  MTN: "mtn",
  TELECEL: "telecel",
  AIRTELTIGO: "airteltigo",
} as const;

// Result checker type enum
export const ResultCheckerType = {
  BECE: "bece",
  WASSCE: "wassce",
} as const;

// Withdrawal status enum
export const WithdrawalStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
} as const;

// Chat status enum
export const ChatStatus = {
  OPEN: "open",
  CLOSED: "closed",
} as const;

// Chat sender type enum
export const ChatSenderType = {
  USER: "user",
  ADMIN: "admin",
} as const;

// SMS status enum
export const SmsStatus = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  RETRYING: "retrying",
} as const;

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("guest"),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
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
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  storefrontSlug: text("storefront_slug").notNull().unique(),
  businessName: text("business_name").notNull(),
  businessDescription: text("business_description"),
  customPricingMarkup: decimal("custom_pricing_markup", { precision: 5, scale: 2 }).notNull().default("0.00"),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).notNull().default("0.00"),
  totalProfit: decimal("total_profit", { precision: 12, scale: 2 }).notNull().default("0.00"),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("agents_user_id_idx").on(table.userId),
  slugIdx: index("agents_slug_idx").on(table.storefrontSlug),
}));

// ============================================
// DATA BUNDLES TABLE
// ============================================
export const dataBundles = pgTable("data_bundles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  network: text("network").notNull(),
  dataAmount: text("data_amount").notNull(),
  validity: text("validity").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
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
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  year: integer("year").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  pin: text("pin").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  isSold: boolean("is_sold").notNull().default(false),
  soldAt: timestamp("sold_at"),
  soldToPhone: text("sold_to_phone"),
  transactionId: varchar("transaction_id", { length: 36 }),
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
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reference: text("reference").notNull().unique(),
  type: text("type").notNull(),
  productId: varchar("product_id", { length: 36 }),
  productName: text("product_name").notNull(),
  network: text("network"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }).notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  paymentMethod: text("payment_method").notNull().default("paystack"), // "paystack" or "wallet"
  status: text("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  agentId: varchar("agent_id", { length: 36 }),
  agentProfit: decimal("agent_profit", { precision: 12, scale: 2 }).default("0.00"),
  apiResponse: jsonb("api_response"),
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
// WITHDRAWALS TABLE
// ============================================
export const withdrawals = pgTable("withdrawals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id", { length: 36 }).notNull().references(() => agents.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  accountName: text("account_name").notNull(),
  adminNote: text("admin_note"),
  processedBy: varchar("processed_by", { length: 36 }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  agentIdx: index("withdrawals_agent_idx").on(table.agentId),
  statusIdx: index("withdrawals_status_idx").on(table.status),
}));

// ============================================
// SMS LOGS TABLE
// ============================================
export const smsLogs = pgTable("sms_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id", { length: 36 }).notNull(),
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
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
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
// SUPPORT CHATS TABLE
// ============================================
export const supportChats = pgTable("support_chats", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  status: text("status").notNull().default("open"), // open, closed
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  assignedToAdminId: varchar("assigned_to_admin_id", { length: 36 }),
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
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  chatId: varchar("chat_id", { length: 36 }).notNull(),
  senderId: varchar("sender_id", { length: 36 }).notNull(),
  senderType: text("sender_type").notNull(), // user, admin
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  chatIdx: index("chat_messages_chat_idx").on(table.chatId),
  senderIdx: index("chat_messages_sender_idx").on(table.senderId),
}));

// ============================================
// SETTINGS TABLE
// ============================================
export const settings = pgTable("settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ one }) => ({
  agent: one(agents, {
    fields: [users.id],
    references: [agents.userId],
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
  agent: one(agents, {
    fields: [withdrawals.agentId],
    references: [agents.id],
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
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
}).extend({
  id: z.string().optional(), // Allow optional id for Supabase user ID
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  balance: true,
  totalSales: true,
  totalProfit: true,
});

export const insertDataBundleSchema = createInsertSchema(dataBundles).omit({
  id: true,
  createdAt: true,
});

export const insertResultCheckerSchema = createInsertSchema(resultCheckers).omit({
  id: true,
  createdAt: true,
  isSold: true,
  soldAt: true,
  soldToPhone: true,
  transactionId: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
  adminNote: true,
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSupportChatSchema = createInsertSchema(supportChats).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// ============================================
// TYPES
// ============================================
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertDataBundle = z.infer<typeof insertDataBundleSchema>;
export type DataBundle = typeof dataBundles.$inferSelect;

export type InsertResultChecker = z.infer<typeof insertResultCheckerSchema>;
export type ResultChecker = typeof resultCheckers.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type Withdrawal = typeof withdrawals.$inferSelect;

export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogs.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertSupportChat = z.infer<typeof insertSupportChatSchema>;
export type SupportChat = typeof supportChats.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

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
  phone: z.string().optional(),
});

export const agentRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone must be at least 10 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  storefrontSlug: z.string().min(3, "Storefront URL must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
});

export const purchaseSchema = z.object({
  productId: z.string(),
  productType: z.enum(["data_bundle", "result_checker"]),
  customerPhone: z.string().min(10, "Phone must be at least 10 digits"),
  customerEmail: z.string().email().optional(),
  agentSlug: z.string().optional(),
});

export const withdrawalRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  bankName: z.string().min(2, "Bank name required"),
  accountNumber: z.string().min(10, "Account number required"),
  accountName: z.string().min(2, "Account name required"),
});
