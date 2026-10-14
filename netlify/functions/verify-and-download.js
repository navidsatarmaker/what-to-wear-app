const crypto = require('crypto');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(event.body || '{}');

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Incomplete transaction credentials' })
      };
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // 1. Verify Razorpay Payment Signature cryptographically
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Razorpay signature mismatch: unauthorized tampering attempt');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payment verification failed' })
      };
    }

    // 2. Configure Cloudflare R2 Client
    const r2Endpoint = process.env.R2_ENDPOINT; // e.g. https://<ACCOUNT_ID>.r2.cloudflarestorage.com
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.R2_BUCKET_NAME || 'navid';
    const r2FileKey = process.env.R2_FILE_KEY || 'WhatToWear.apk';

    if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
      console.error('Cloudflare R2 configuration missing');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Storage distribution configuration missing' })
      };
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey
      }
    });

    // 3. Generate a secure, expiring download link (45 minutes = 2700 seconds)
    const command = new GetObjectCommand({
      Bucket: r2BucketName,
      Key: r2FileKey,
      ResponseContentDisposition: 'attachment; filename="WhatToWear.apk"',
      ResponseContentType: 'application/vnd.android.package-archive'
    });

    const expiresInSeconds = 2700; // 45 minutes
    const presignedDownloadUrl = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        downloadUrl: presignedDownloadUrl,
        expiresInMinutes: 45,
        paymentId: razorpay_payment_id
      })
    };
  } catch (err) {
    console.error('Error in verify-and-download:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Payment processing error' })
    };
  }
};
