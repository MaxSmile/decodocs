# Validation Criteria — Invoice

Type id: `business_invoice`

## Goal
Detect malformed or risky invoices and surface concrete issues:
- compliance fields missing
- math/tax inconsistencies
- unclear payment terms
- party/entity mismatches

## What to extract (structured)
- Supplier entity (name, address, tax id)
- Buyer entity (name, address)
- Invoice identifiers (invoice number, issue date, due date)
- Currency
- Line items (description, qty, unit price, line total)
- Subtotal, taxes, total
- Payment terms and payment instructions
- References (PO number, contract/SOW reference, project name)

## Validation checklist

### A) Legal entity consistency
- Supplier name matches supplier tax id context (ABN/VAT id present when expected)
- Buyer name matches who the invoice is addressed to
- Flag mismatch between header entity name and footer/legal entity lines

### B) Required invoice fields
Flag as **missing** if absent:
- invoice number
- issue date
- due date or payment terms
- supplier tax id (when it is a tax invoice / claims GST/VAT)
- currency (if ambiguous)

### C) Tax logic (GST/VAT)
- Detect whether tax is included vs excluded
- Check tax rate consistency across lines
- Check subtotal + tax = total (within rounding tolerance)
- Flag “tax invoice” wording without tax id

### D) Line items vs totals
- qty × unit price = line total
- sum(line totals) = subtotal
- subtotal + tax = total
- Flag suspicious “misc/other” lines without description

### E) Payment terms clarity
- Detect net terms (e.g. Net 7/14/30)
- Detect late fees / interest
- Flag missing payment method details (if the invoice demands payment)

### F) Cross-document references (if provided)
If PO/contract docs are provided:
- invoice references PO number when a PO exists
- line items match PO/contract scope (high-level)
- flag extra/unscoped items

## Output schema (draft)
```json
{
  "type": "invoice_validation",
  "supplier": {"name": "", "taxId": "", "address": ""},
  "buyer": {"name": "", "address": ""},
  "invoice": {"number": "", "issueDate": "", "dueDate": "", "currency": ""},
  "totals": {"subtotal": null, "tax": null, "total": null, "taxIncluded": null},
  "lineItems": [{"description": "", "qty": null, "unitPrice": null, "lineTotal": null}],
  "findings": [{"severity": "high|medium|low", "code": "", "message": "", "evidence": [{"page": 1, "quote": ""}]}]
}
```

## Red flags (high severity)
- invoice total inconsistent with line items
- tax claimed but no tax id
- buyer entity mismatch vs contract/PO (if provided)
- missing invoice number
