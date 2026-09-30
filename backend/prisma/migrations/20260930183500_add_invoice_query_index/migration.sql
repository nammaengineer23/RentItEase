CREATE INDEX "Invoice_userId_status_invoiceDate_idx"
ON "Invoice"("userId", "status", "invoiceDate");