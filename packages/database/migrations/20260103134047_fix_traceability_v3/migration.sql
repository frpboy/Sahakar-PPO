-- AlterTable
ALTER TABLE "po_pending_items" ADD COLUMN     "order_request_id" TEXT;

-- AddForeignKey
ALTER TABLE "po_pending_items" ADD CONSTRAINT "po_pending_items_order_request_id_fkey" FOREIGN KEY ("order_request_id") REFERENCES "order_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
