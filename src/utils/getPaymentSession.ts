const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

const { PAYMENT_SESSION_MODE, CLIENT_URL } = require('../constants');

const getPaymentSession = async (
  paymenthMethod, paymentData, paymentCurrency, successRoute, cancelRoute,
) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: [paymenthMethod],
    mode: PAYMENT_SESSION_MODE,
    line_items: paymentData.map((item) => ({
      price_data: {
        currency: paymentCurrency,
        product_data: {
          name: `${item.title}`,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.count,
    })),
    success_url: `${CLIENT_URL}${successRoute}`,
    cancel_url: `${CLIENT_URL}${cancelRoute}`,
  });

  return session;
};

export default getPaymentSession;
