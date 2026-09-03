export function evaluateMoneyAction({ merchant, cart, paymentMethod }) {
  const amount = cart.reduce((sum, item) => sum + item.total, 0);
  const reasons = [];

  for (const item of cart) {
    if (item.quantity > merchant.guardrails.maxSingleItemQuantity) {
      reasons.push(`${item.name} quantity ${item.quantity} exceeds max ${merchant.guardrails.maxSingleItemQuantity}.`);
    }
  }

  if (amount > merchant.guardrails.maxOrderValue) {
    reasons.push(`Order value ${amount} exceeds max ${merchant.guardrails.maxOrderValue}.`);
  }

  if (!merchant.guardrails.allowedPaymentMethods.includes(paymentMethod)) {
    reasons.push(`Payment method ${paymentMethod} is not allowed.`);
  }

  const requiresHumanApproval = amount > merchant.guardrails.requiresHumanApprovalAbove;

  return {
    allowed: reasons.length === 0,
    requiresHumanApproval,
    reasons: requiresHumanApproval
      ? [...reasons, `Order value ${amount} requires human approval above ${merchant.guardrails.requiresHumanApprovalAbove}.`]
      : reasons,
    boundedBy: {
      maxOrderValue: merchant.guardrails.maxOrderValue,
      maxSingleItemQuantity: merchant.guardrails.maxSingleItemQuantity,
      requiresHumanApprovalAbove: merchant.guardrails.requiresHumanApprovalAbove,
      allowedPaymentMethods: merchant.guardrails.allowedPaymentMethods
    }
  };
}
