import AuditLog from '../models/AuditLog.js';

export async function logAudit({ merchantId, transactionId, actor, action, riskLevel = 'low', boundedBy = {}, explanation, input = {}, output = {} }) {
  return AuditLog.create({
    merchantId,
    transactionId,
    actor,
    action,
    riskLevel,
    boundedBy,
    explanation,
    input,
    output
  });
}
