// Payments through Fahrasa (checkout, commission, orders) stay off until the
// community is big enough. While off, the market works like classifieds:
// buyer and seller agree on payment and delivery in a direct message.
// Turn on by setting PAYMENTS_ENABLED=true in the environment.
export const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true'
