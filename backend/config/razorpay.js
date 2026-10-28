const Razorpay = require('razorpay');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.warn('[Razorpay Warning] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables. Using test credentials.');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId || 'rzp_test_IntelliCartKey123',
      key_secret: keySecret || 'IntelliCartSecretKeyXYZ456',
    });
  }
  return razorpayInstance;
};

module.exports = { getRazorpayInstance };
