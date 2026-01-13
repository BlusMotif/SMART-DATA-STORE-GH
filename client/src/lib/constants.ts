// resellershubprogh.com Constants

export const APP_NAME = "resellershubprogh.com";
export const APP_DESCRIPTION = "Digital Products & Data Bundle Marketplace";

export const ROLE_LABELS = {
  admin: "Admin",
  agent: "Agent",
  dealer: "Dealer",
  super_dealer: "Super Dealer",
  master: "Master",
  user: "User",
  guest: "Guest",
} as const;

export const ROLE_ROUTES = {
  admin: "/admin",
  agent: "/agent/dashboard",
  dealer: "/dealer/dashboard",
  super_dealer: "/super-dealer/dashboard",
  master: "/master/dashboard",
  user: "/user/dashboard",
} as const;

export const STOREFRONT_ROUTES = {
  agent: "/store/agent",
  dealer: "/store/dealer",
  super_dealer: "/store/super-dealer",
  master: "/store/master",
} as const;

export const NETWORKS = [
  { id: "mtn", name: "MTN", color: "#FFCC00", textColor: "#000000" },
  { id: "telecel", name: "TELECEL", color: "#E60000", textColor: "#FFFFFF" },
  { id: "at_bigtime", name: "AT Bigtime", color: "#FF0000", textColor: "#FFFFFF" },
  { id: "at_ishare", name: "AT ishare", color: "#FF0000", textColor: "#FFFFFF" },
] as const;

export const RESULT_CHECKER_TYPES = [
  { id: "bece", name: "BECE", description: "Basic Education Certificate Examination" },
  { id: "wassce", name: "WASSCE", description: "West African Senior School Certificate Examination" },
] as const;

export const TRANSACTION_STATUSES = {
  pending: { label: "Pending", color: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  failed: { label: "Failed", color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  refunded: { label: "Refunded", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
} as const;

export const WITHDRAWAL_STATUSES = {
  pending: { label: "Pending", color: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400" },
  approved: { label: "Approved", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
  paid: { label: "Paid", color: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
} as const;

export const PAYMENT_METHODS = [
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Transfer to bank account",
    icon: "Building2",
    requiresBankDetails: true,
    placeholder: {
      accountNumber: "Enter account number",
      accountName: "Name on account",
      bankName: "e.g., Access Bank, GTBank",
      bankCode: "e.g., 030100 (Access Bank)"
    }
  },
  {
    id: "mtn_momo",
    name: "MTN Mobile Money",
    description: "Send to MTN MoMo number",
    icon: "Smartphone",
    requiresBankDetails: false,
    placeholder: {
      accountNumber: "Enter MTN phone number (e.g., 0241234567)",
      accountName: "Name on MTN account",
      bankName: "",
      bankCode: ""
    }
  },
  {
    id: "telecel_cash",
    name: "Telecel Cash",
    description: "Send to Telecel Cash number",
    icon: "Smartphone",
    requiresBankDetails: false,
    placeholder: {
      accountNumber: "Enter Telecel phone number (e.g., 0271234567)",
      accountName: "Name on Telecel account",
      bankName: "",
      bankCode: ""
    }
  },
  {
    id: "airtel_tigo_cash",
    name: "AirtelTigo Cash",
    description: "Send to AirtelTigo Cash number",
    icon: "Smartphone",
    requiresBankDetails: false,
    placeholder: {
      accountNumber: "Enter AirtelTigo phone number (e.g., 0261234567)",
      accountName: "Name on AirtelTigo account",
      bankName: "",
      bankCode: ""
    }
  },
  {
    id: "at_bigtime",
    name: "AT Bigtime",
    description: "Send to AT Bigtime number",
    icon: "Smartphone",
    requiresBankDetails: false,
    placeholder: {
      accountNumber: "Enter AT Bigtime phone number (e.g., 0261234567)",
      accountName: "Name on AT Bigtime account",
      bankName: "",
      bankCode: ""
    }
  },
  {
    id: "at_ishare",
    name: "AT ishare",
    description: "Send to AT ishare number",
    icon: "Smartphone",
    requiresBankDetails: false,
    placeholder: {
      accountNumber: "Enter AT ishare phone number (e.g., 0261234567)",
      accountName: "Name on AT ishare account",
      bankName: "",
      bankCode: ""
    }
  },
] as const;

export const GHANA_BANKS = [
  "Access Bank Ghana",
  "Absa Bank Ghana",
  "Agricultural Development Bank",
  "Bank of Africa Ghana",
  "CalBank",
  "Consolidated Bank Ghana",
  "Ecobank Ghana",
  "FBN Bank Ghana",
  "Fidelity Bank Ghana",
  "First Atlantic Bank",
  "First National Bank Ghana",
  "GCB Bank",
  "Guaranty Trust Bank Ghana",
  "National Investment Bank",
  "OmniBSIC Bank Ghana",
  "Prudential Bank",
  "Republic Bank Ghana",
  "Société Générale Ghana",
  "Stanbic Bank Ghana",
  "Standard Chartered Bank Ghana",
  "United Bank for Africa Ghana",
  "Zenith Bank Ghana",
] as const;

export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("233")) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
};

export const generateReference = (prefix: string = "CLK"): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};
