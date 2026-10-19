const Razorpay = require('razorpay');

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server payment configuration missing' })
      };
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    // ₹49 INR in paise (1 INR = 100 paise)
    const options = {
      amount: 4900,
      currency: 'INR',
      receipt: `w2w_${Date.now()}`,
      notes: {
        product: 'What To Wear Android APK',
        developer: 'Navid Satarmaker'
      }
    };

    const order = await instance.orders.create(options);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId
      })
    };
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to initialize order' })
    };
  }
};
