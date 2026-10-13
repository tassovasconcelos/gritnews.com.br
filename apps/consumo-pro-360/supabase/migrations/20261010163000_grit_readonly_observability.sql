-- GRIT technical superadmin: full read-only observability, not business approval.
drop policy if exists cp_cost_read on public.cp_product_costs;
create policy cp_cost_read on public.cp_product_costs for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','controller','finance','buyer','grit_superadmin']));
drop policy if exists cp_invoice_read on public.cp_invoices;
create policy cp_invoice_read on public.cp_invoices for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','controller','finance','buyer','warehouse','director','grit_superadmin']));
drop policy if exists cp_invoice_line_read on public.cp_invoice_lines;
create policy cp_invoice_line_read on public.cp_invoice_lines for select to authenticated
 using(exists(select 1 from public.cp_invoices i where i.id=invoice_id
 and private.cp_has_role(i.company_id,array['group_admin','controller','finance','buyer','warehouse','director','grit_superadmin'])));
drop policy if exists cp_event_read on public.cp_stock_events;
create policy cp_event_read on public.cp_stock_events for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','controller','finance','buyer','warehouse','director','grit_superadmin']));
drop policy if exists cp_quote_read on public.cp_quote_batches;
create policy cp_quote_read on public.cp_quote_batches for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','director','controller','finance','buyer','grit_superadmin']));
drop policy if exists cp_quote_line_read on public.cp_quote_lines;
create policy cp_quote_line_read on public.cp_quote_lines for select to authenticated
 using(exists(select 1 from public.cp_quote_batches b where b.id=batch_id
 and private.cp_has_role(b.company_id,array['group_admin','director','controller','finance','buyer','grit_superadmin'])));
drop policy if exists cp_supplier_quotes_read on public.cp_supplier_quotes;
create policy cp_supplier_quotes_read on public.cp_supplier_quotes for select to authenticated
 using(exists(select 1 from public.cp_quote_batches b where b.id=batch_id
 and private.cp_has_role(b.company_id,array['group_admin','director','controller','finance','buyer','grit_superadmin'])));
drop policy if exists cp_po_read on public.cp_purchase_orders;
create policy cp_po_read on public.cp_purchase_orders for select to authenticated
 using(private.cp_has_role(company_id,array['group_admin','director','controller','finance','buyer','grit_superadmin']));
drop policy if exists cp_po_lines_read on public.cp_purchase_order_lines;
create policy cp_po_lines_read on public.cp_purchase_order_lines for select to authenticated
 using(exists(select 1 from public.cp_purchase_orders p where p.id=purchase_order_id
 and private.cp_has_role(p.company_id,array['group_admin','director','controller','finance','buyer','grit_superadmin'])));
