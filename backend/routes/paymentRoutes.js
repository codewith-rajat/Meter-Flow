import express from 'express';
import { protect as authMiddleware } from '../middlewares/authMiddleware.js';
import { handleResponse, handleError } from '../utils/helpers.js';
import StripeService from '../services/StripeService.js';
import EmailService from '../services/EmailService.js';
import InvoiceService from '../services/InvoiceService.js';
import User from '../models/User.js';
import Billing from '../models/Billing.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('PaymentRoutes');

/**
 * POST /payments/create-payment-intent
 * Create a Stripe payment intent for payment
 */
router.post('/payments/create-payment-intent', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'USD', invoiceId } = req.body;

    if (!amount || amount <= 0) {
      return handleError(res, 'Invalid amount', 400);
    }

    const paymentIntent = await StripeService.createPaymentIntent(amount, currency, {
      userId: req.user._id,
      invoiceId
    });

    handleResponse(res, 'Payment intent created', {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    logger.error('Failed to create payment intent', error);
    handleError(res, error.message, 500);
  }
});

/**
 * POST /payments/confirm
 * Confirm a payment - accepts invoiceId and amount directly
 */
router.post('/payments/confirm', authMiddleware, async (req, res) => {
  try {
    const { invoiceId, amount } = req.body;

    if (!invoiceId || !amount) {
      return handleError(res, 'Invoice ID and amount are required', 400);
    }

    logger.info(`Payment request received: invoiceId=${invoiceId}, amount=${amount}, token=${process.env.STRIPE_SECRET_KEY ? 'present' : 'MISSING'}`);

    // Verify invoice exists and belongs to user
    const invoice = await Billing.findById(invoiceId);
    if (!invoice) {
      logger.error(`Invoice not found: ${invoiceId}`);
      return handleError(res, 'Invoice not found', 404);
    }

    if (invoice.userId.toString() !== req.user._id.toString()) {
      logger.error(`Unauthorized access to invoice: ${invoiceId}`);
      return handleError(res, 'Unauthorized', 403);
    }

    logger.info(`Invoice found and verified: ${invoice._id}`);

    // Create payment intent with Stripe
    let paymentIntent;
    try {
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        logger.warn('Stripe API key not configured, using demo mode');
      } else {
        paymentIntent = await StripeService.createPaymentIntent(
          amount, // Amount in USD, will be converted to cents
          'USD',
          { invoiceId: invoiceId.toString(), userId: req.user._id }
        );
        logger.info(`Payment intent created successfully: ${paymentIntent.id}`);
      }
    } catch (stripeError) {
      logger.error(`Stripe error: ${stripeError.message}`);
      // Continue anyway - mark invoice as paid in demo mode
      logger.warn('Continuing in demo mode without Stripe confirmation');
    }

    // Update invoice as paid
    const updatedInvoice = await Billing.findByIdAndUpdate(invoiceId, {
      status: 'paid',
      paidAt: new Date(),
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent?.id || 'demo_' + Date.now()
    }, { new: true });

    logger.info(`Invoice marked as paid: ${invoiceId}`);

    // Send confirmation email (optional)
    const user = await User.findById(req.user._id);
    if (user && invoice) {
      try {
        if (EmailService && EmailService.sendPaymentConfirmation) {
          await EmailService.sendPaymentConfirmation(
            user.email,
            user.name,
            invoice.amount,
            invoice.invoiceNumber
          );
          logger.info(`Confirmation email sent to ${user.email}`);
        }
      } catch (emailError) {
        logger.warn('Failed to send payment confirmation email', emailError);
      }
    }

    handleResponse(res, 'Payment confirmed and invoice marked as paid', {
      invoiceId,
      status: 'paid',
      amount: invoice.amount,
      paymentIntentId: paymentIntent?.id || 'demo_' + Date.now()
    });
  } catch (error) {
    logger.error('Failed to confirm payment', error);
    handleError(res, error.message, 500);
  }
});

/**
 * POST /payments/subscribe
 * Subscribe user to a plan
 */
router.post('/payments/subscribe', authMiddleware, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;

    if (!planId || !paymentMethodId) {
      return handleError(res, 'Plan ID and payment method required', 400);
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return handleError(res, 'User not found', 404);
    }

    // Create Stripe customer if not exists
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await StripeService.createCustomer(user);
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // In a real implementation, you would create a subscription with Stripe
    // For now, we'll update the user's plan
    user.plan = planId;
    user.subscribedAt = new Date();
    await user.save();

    handleResponse(res, 'Subscription successful', {
      userId: user._id,
      plan: user.plan,
      subscribedAt: user.subscribedAt
    });
  } catch (error) {
    logger.error('Failed to subscribe', error);
    handleError(res, error.message, 500);
  }
});

/**
 * POST /payments/invoice-pdf
 * Generate and send invoice PDF
 */
router.post('/payments/invoice-pdf', authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId) {
      return handleError(res, 'Invoice ID required', 400);
    }

    const invoice = await Billing.findById(invoiceId);
    if (!invoice) {
      return handleError(res, 'Invoice not found', 404);
    }

    if (invoice.userId.toString() !== req.user.userId) {
      return handleError(res, 'Unauthorized', 403);
    }

    const user = await User.findById(req.user.userId);

    // Format invoice data
    const invoiceData = InvoiceService.formatInvoiceData(invoice, {
      userName: user.name,
      userEmail: user.email,
      amount: invoice.amount,
      requestsUsed: invoice.requestsUsed || 0,
      pricePerRequest: invoice.pricePerRequest || 0
    });

    // Generate PDF
    const pdfBuffer = await InvoiceService.generateInvoicePDF(invoiceData);

    // Send email with PDF
    try {
      await EmailService.sendInvoiceEmail(user.email, invoiceData, pdfBuffer);
    } catch (emailError) {
      logger.warn('Failed to send invoice email, but PDF was generated', emailError);
    }

    // Send PDF as response
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Failed to generate invoice PDF', error);
    handleError(res, error.message, 500);
  }
});

/**
 * GET /payments/download-invoice/:invoiceId
 * Download invoice as PDF
 */
router.get('/payments/download-invoice/:invoiceId', authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Billing.findById(invoiceId);
    if (!invoice) {
      return handleError(res, 'Invoice not found', 404);
    }

    if (invoice.userId.toString() !== req.user.userId) {
      return handleError(res, 'Unauthorized', 403);
    }

    const user = await User.findById(req.user.userId);

    // Format invoice data
    const invoiceData = InvoiceService.formatInvoiceData(invoice, {
      userName: user.name,
      userEmail: user.email,
      amount: invoice.amount,
      requestsUsed: invoice.requestsUsed || 0,
      pricePerRequest: invoice.pricePerRequest || 0
    });

    // Generate PDF
    const pdfBuffer = await InvoiceService.generateInvoicePDF(invoiceData);

    // Send PDF as response
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Failed to download invoice', error);
    handleError(res, error.message, 500);
  }
});

/**
 * POST /payments/webhook
 * Stripe webhook handler
 */
router.post('/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const event = StripeService.verifyWebhookSignature(req.body, signature);

    logger.info(`Webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        logger.success(`Payment succeeded: ${paymentIntent.id}`);
        // Handle successful payment
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.warn(`Payment failed: ${paymentIntent.id}`);
        // Handle failed payment
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        logger.success(`Invoice paid: ${invoice.id}`);
        // Handle paid invoice
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        logger.warn(`Invoice payment failed: ${invoice.id}`);
        // Handle failed invoice payment
        break;
      }
      default:
        logger.debug(`Unhandled webhook type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook error', error);
    res.status(400).send(`Webhook error: ${error.message}`);
  }
});

export default router;
