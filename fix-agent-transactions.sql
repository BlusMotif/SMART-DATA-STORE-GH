-- AGENT PROFIT MIGRATION SCRIPT
-- This script fixes agent.total_profit fields by recalculating from transactions
-- The root cause: Previous code used user.id instead of agent.id in transactions

-- ===================================
-- STEP 1: View the impact
-- ===================================
-- See which agents need their profit recalculated
SELECT 
  a.id as agent_id,
  a.user_id,
  a.total_profit as current_total_profit,
  COALESCE(SUM(CAST(t.agent_profit AS NUMERIC)), 0) as calculated_total_profit,
  COUNT(t.id) as transaction_count,
  COALESCE(SUM(CASE WHEN DATE(t.created_at) = CURRENT_DATE THEN CAST(t.agent_profit AS NUMERIC) ELSE 0 END), 0) as today_profit
FROM agents a
LEFT JOIN transactions t ON t.agent_id = a.id 
  AND t.agent_profit IS NOT NULL 
  AND CAST(t.agent_profit AS NUMERIC) > 0
  AND (t.status = 'completed' OR t.payment_status = 'paid')
GROUP BY a.id, a.user_id, a.total_profit
HAVING COALESCE(SUM(CAST(t.agent_profit AS NUMERIC)), 0) > 0
ORDER BY calculated_total_profit DESC;

-- ===================================
-- STEP 2: Update agent.total_profit
-- ===================================
-- UNCOMMENT BELOW AND RUN TO FIX

UPDATE agents a
SET total_profit = COALESCE(profit_calc.calculated_profit, 0)::TEXT
FROM (
  SELECT 
    a.id as agent_id,
    COALESCE(SUM(CAST(t.agent_profit AS NUMERIC)), 0) as calculated_profit
  FROM agents a
  LEFT JOIN transactions t ON t.agent_id = a.id 
    AND t.agent_profit IS NOT NULL 
    AND CAST(t.agent_profit AS NUMERIC) > 0
    AND (t.status = 'completed' OR t.payment_status = 'paid')
  GROUP BY a.id
) profit_calc
WHERE a.id = profit_calc.agent_id
AND COALESCE(profit_calc.calculated_profit, 0) != CAST(a.total_profit AS NUMERIC);


-- ===================================
-- STEP 3: Verify the fix worked
-- ===================================
-- Run after the UPDATE to confirm

SELECT 
  a.id as agent_id,
  a.user_id,
  CAST(a.total_profit AS NUMERIC) as agent_total_profit,
  COALESCE(SUM(CAST(t.agent_profit AS NUMERIC)), 0) as transactions_total_profit,
  COUNT(t.id) as transaction_count,
  CASE 
    WHEN CAST(a.total_profit AS NUMERIC) = COALESCE(SUM(CAST(t.agent_profit AS NUMERIC)), 0) THEN '✓ MATCH'
    ELSE '✗ MISMATCH'
  END as status
FROM agents a
LEFT JOIN transactions t ON t.agent_id = a.id 
  AND t.agent_profit IS NOT NULL 
  AND CAST(t.agent_profit AS NUMERIC) > 0
  AND (t.status = 'completed' OR t.payment_status = 'paid')
GROUP BY a.id, a.user_id, a.total_profit
ORDER BY agent_id;


