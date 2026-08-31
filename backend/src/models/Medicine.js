// Architecture note only:
// Medicine is a pharmacy-specific inventory listing and includes pharmacyId.
// The specified quantity and inStock fields must remain consistent:
// quantity > 0 -> inStock = true; quantity = 0 -> inStock = false.
// expirationDate is non-destructive: expired records are not physically deleted
// and must be excluded from public search/results.
// No schema or business logic is implemented in this scaffold.
