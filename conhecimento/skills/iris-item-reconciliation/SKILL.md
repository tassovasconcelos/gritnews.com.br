---
name: iris-item-reconciliation
description: Reconcile Íris B2G search results with the exact official procurement item, winner, unit price, quantity, and source evidence. Use for product-market searches and award identity mismatches.
metadata:
  short-description: Reconcile official Íris procurement items
---

# Íris official item reconciliation

Use this skill when Íris returns a candidate award, a missing official description, a generic product description, or conflicting item, winner, price, or quantity fields.

## Required result

Present one concise answer first: exact official item number and description, buyer, winner, unit price, awarded quantity, total, decision date, and evidence link. Follow it with a compact reconciliation detail and any unresolved product-equivalence limits. Keep official facts separate from search/catalog suggestions.

## Reconciliation rules

1. Preserve the source identity. Join an award result to its official item only with the same procurement ID and item ID. When available, also verify the supplier CNPJ, award status, and result date. Never join by similar description alone.
2. Fetch the official item record when the result lacks a usable description. Retry through the item-enrichment endpoint using the procurement and item identifiers. Merge only a response with the same identifiers. If lookup is unavailable, retain “official item description pending.”
3. Keep fields distinct: short official item description, full official specification, supplier/result data, and catalog or price-research description. Do not substitute catalog prose for the official procurement item.
4. Reconcile the arithmetic: total awarded value should agree with unit price × awarded quantity within source rounding. Show the source values and flag discrepancies; do not silently choose one.
5. Treat product identity as a separate assessment from award identity. A public record may prove the exact item and winner while leaving the requested model, SKU, manufacturer, or technical equivalence unresolved. Mark the match level and name the missing attributes. For medical equipment, compare each relevant technical attribute, not only the product family or PDM.
6. A brand string can be composite or declared in a price-research record. Preserve its wording and do not attribute the full item, lot, or award exclusively to one manufacturer without official evidence.
7. When a search asks for one brand and the source declares multiple brands together, keep the adjudication as an official fact but classify that result as a candidate with brand/model unresolved. Do not count a composite brand as an individually confirmed match.
8. Compute summary counts and badges from the same reconciled records shown in the cards. Separate confirmed adjudications from confirmed individual brand matches. A card cannot claim official confirmation while the summary counts it as unresolved, or vice versa.
9. Report search scope honestly: queried sources, filters, date window, candidate count, pagination/limits, retrieval time, and source failures. An incomplete query is not evidence that no purchase exists.

## Release and regression checks

Íris spans the Hostinger web app and the `cip-b2g` Supabase Edge Function. A UI-only publish can leave production search behavior on an old server version. For changes to result discovery or reconciliation, verify that the UI and the Edge Function on the CIP Supabase project both contain the intended release. Confirm the deployed function version and test an authenticated production query after deployment.

Retain tests for exact-ID joins, missing item details, wrong-item responses, supplier/price/quantity conflicts, status/date handling, composite brand wording, and consistent card/summary counts. Use a known official case as a regression fixture without embedding credentials or personal user data. A green local test or HTTP 200 for static assets alone does not prove a production search was reconciled.

## Case that motivated this skill

The official Compras.gov.br record for procurement `94300105910412024`, item `9430010591041202400003` (item 3), reports “Cama hospitalar,” detailed requirements, Prohospital as supplier, 1,101 units, and R$ 2,614.00 per unit on 20/10/2025. The associated price-research wording says “PROCIRURGICA e RIOFL.” This confirms the procurement item and award values; it does not establish an exclusive manufacturer or a specific commercial SKU/model. Keep this fixture only as public procurement evidence, not as proof that every “cama” search is equivalent.
