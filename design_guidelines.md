# CLECTECH Design Guidelines

## Design Approach
**System-Based with Fintech References**
Drawing from modern fintech leaders (Stripe, Paystack, Coinbase) combined with Material Design principles for clarity and trust. The white background requirement ensures maximum readability for financial transactions.

## Core Design Principles
1. **Financial Clarity**: Transaction details, pricing, and balances must be immediately scannable
2. **Trust Signals**: Professional, clean layouts that inspire confidence in financial transactions
3. **Speed Perception**: Lightweight, fast-loading interfaces critical for high-traffic scenarios
4. **Mobile-First**: PWA requires touch-optimized interactions and responsive layouts

## Typography
**Font Stack**: Inter (primary) via Google Fonts
- **Headings**: Font weight 600-700, sizes: text-3xl (dashboard headers), text-2xl (section titles), text-xl (card headers)
- **Body**: Font weight 400, text-base for primary content, text-sm for secondary info
- **Financial Data**: Font weight 600, tabular-nums for amount alignment
- **Micro-copy**: text-xs for labels, timestamps, helper text

## Layout System
**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12
- Consistent card padding: p-6
- Section spacing: space-y-6 to space-y-8
- Form field gaps: gap-4
- Dashboard grid gaps: gap-6

**Container Strategy**:
- Admin Dashboard: Full-width with sidebar (w-64), main content max-w-7xl
- Guest/Agent Pages: Centered max-w-6xl with px-4
- Forms: max-w-md centered for focused checkout

## Component Library

### Navigation
**Admin**: Fixed sidebar (white background, subtle border-r) with icon+label navigation items
**Guest/Agent**: Top navbar with logo left, actions right, sticky on scroll

### Data Display
**Transaction Cards**: White cards with subtle shadow (shadow-sm), rounded-lg, clear status badges (bg-green-50 text-green-700 for success, bg-orange-50 text-orange-700 for pending)
**Pricing Cards**: Bordered cards (border-2) for data bundles and result checkers, prominent pricing with text-2xl font-bold
**Agent Dashboard Stats**: Grid of metric cards (3-4 columns) showing balance, sales, commissions with large numbers and small labels

### Forms
**Input Fields**: Consistent height (h-12), rounded-lg borders, clear labels above fields, placeholder text in text-gray-400
**Payment Integration**: Prominent Paystack-branded button, trust badges below
**Agent Storefront**: Clean product grid with clear "Buy Now" CTAs per item

### Actions
**Primary CTAs**: Solid background buttons (rounded-lg, px-6 py-3, font-medium)
**Secondary**: Outlined buttons with border-2
**Danger Actions**: Red accent for withdrawals/critical actions requiring confirmation

### Status & Feedback
**Transaction States**: Color-coded badges with icons (success, pending, failed)
**Loading States**: Skeleton screens for financial data, spinners for actions
**Notifications**: Toast messages (top-right) for transaction confirmations

## Page-Specific Layouts

### Guest Checkout
Single-column flow: Product selection → Phone number input → Payment → Confirmation
Clean, distraction-free with progress indicator at top

### Agent Storefront
Hero section: Agent branding/name with custom welcome message
Product grid: 2-3 columns on desktop, 1 on mobile, clear pricing markup visible
Footer: Trust elements (secure checkout, payment methods)

### Admin Dashboard
Left sidebar navigation, main content area with:
- Top stats row (4 metrics)
- Recent transactions table (full-width)
- Action buttons for stock management
- Withdrawal approval queue (if pending items)

### Agent Dashboard
- Balance card (prominent, top)
- Sales metrics (grid)
- Withdrawal button (clear profit calculation shown)
- Transaction history table

## Images
**Logo Placement**: Top-left in navbar/sidebar, simple wordmark or icon+text
**Trust Badges**: Small payment method logos (Paystack, MTN, etc.) in footer
**No Hero Images**: Fintech focus means immediate utility - skip decorative heroes in favor of functional dashboards

## Accessibility
- ARIA labels for all transaction states
- Keyboard navigation for all forms
- High contrast for financial amounts (text-gray-900)
- Focus states visible on all interactive elements (ring-2 ring-offset-2)

## Performance Considerations
- Lazy load transaction history
- Optimistic UI updates for checkout flow
- Cache product pricing data
- Minimal animations (subtle fades only)

## Mobile Optimization
- Bottom sheet patterns for quick actions
- Thumb-friendly tap targets (min h-12)
- Simplified tables to card lists on mobile
- Fixed bottom CTAs for checkout flow