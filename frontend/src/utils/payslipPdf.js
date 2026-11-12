import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

// The built-in PDF fonts cannot print the rupee sign, so amounts use "Rs."
const inr = (v) => 'Rs. ' + Number(v ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bold = (t) => ({ content: t, styles: { fontStyle: 'bold' } });

export function downloadPayslipPdf(p) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const m = 40;
  const e = p.employee || {};
  const period = `${MONTHS[p.month - 1]} ${p.year}`;

  // Header band
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, w, 92, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Employee Payroll System', m, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Payslip for ${period}`, m, 66);
  doc.setTextColor(30, 41, 59);

  // Employee details
  autoTable(doc, {
    startY: 112, theme: 'plain', styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 85 }, 2: { cellWidth: 90 } },
    body: [
      [bold('Employee'), e.name || '-', bold('Employee ID'), e.employeeCode ?? e.id ?? '-'],
      [bold('Department'), e.department?.name || '-', bold('Designation'), e.designation || '-'],
      [bold('Email'), e.email || '-', bold('Generated on'),
        p.generatedAt ? new Date(p.generatedAt).toLocaleDateString('en-IN') : '-'],
    ],
  });

  // Attendance summary
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 14, theme: 'grid',
    headStyles: { fillColor: [238, 242, 255], textColor: [30, 41, 59] },
    styles: { fontSize: 10, halign: 'center' },
    head: [['Working days', 'Absent days', 'Paid leave days', 'Unpaid leave days']],
    body: [[p.workingDays, Number(p.absentDays ?? 0), p.paidLeaveDays ?? 0, p.unpaidLeaveDays ?? 0]],
  });

  // Earnings and deductions
  const section = (t) => [{ content: t, colSpan: 2,
    styles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' } }];
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18, theme: 'striped', styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 1: { halign: 'right', cellWidth: 140 } },
    body: [
      section('Earnings'),
      ['Basic salary', inr(p.basic)], ['House rent allowance (HRA)', inr(p.hra)], ['Dearness allowance (DA)', inr(p.da)],
      [bold('Gross salary'), bold(inr(p.gross))],
      section('Deductions'),
      ['Provident fund (PF)', inr(p.pf)], ['Professional tax', inr(p.professionalTax)],
      ['Income tax', inr(p.incomeTax)], ['Loss of pay', inr(p.lossOfPay)],
      [bold('Total deductions'), bold(inr(p.totalDeductions))],
    ],
  });

  // Net pay box
  const y = doc.lastAutoTable.finalY + 22;
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(m, y, w - 2 * m, 54, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(79, 70, 229);
  doc.text('NET SALARY', m + 16, y + 32);
  doc.setFontSize(18);
  doc.text(inr(p.netSalary), w - m - 16, y + 34, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 130, 150);
  doc.text('This is a system-generated payslip and does not require a signature.', w / 2, y + 90, { align: 'center' });

  const safe = (e.name || 'Employee').replace(/\s+/g, '_');
  doc.save(`Payslip_${safe}_${MONTHS[p.month - 1]}_${p.year}.pdf`);
}