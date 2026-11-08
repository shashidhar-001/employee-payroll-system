// dto/LeaveBalance.java
package com.payroll.employee_service.dto;

public record LeaveBalance(
  int month,
  int year,
  int paidQuota,
  int approvedDays,
  int pendingDays,
  int paidRemaining,
  int unpaidDays
) {}
