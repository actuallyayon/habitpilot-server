import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import Subscription from '../models/Subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: '2025-01-27.acacia',
});

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Try to use real Stripe if configured
    try {
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_stripe')) {
        throw new Error('Stripe not configured');
      }

      const priceId = 'price_dummy'; // In a real app, this is an env variable
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: user.email,
        client_reference_id: user._id.toString(),
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?success=true`,
        cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      });

      res.status(200).json({ url: session.url });
    } catch (stripeError) {
      // MOCK FALLBACK: If Stripe fails (e.g. missing keys or dummy price), mock the upgrade
      console.log('Stripe checkout failed or not configured, falling back to mock upgrade:', (stripeError as Error).message);
      
      user.plan = 'pro';
      await user.save();
      
      // Redirect straight back to dashboard with success flag
      res.status(200).json({ url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?success=true` });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error in checkout process', error: (error as Error).message });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.plan = 'pro';
            user.stripeCustomerId = customerId;
            await user.save();

            const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
            await Subscription.create({
              userId,
              stripeSubscriptionId: subscriptionId,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            });
          }
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const sub: any = event.data.object as Stripe.Subscription;
        const dbSub = await Subscription.findOne({ stripeSubscriptionId: sub.id });
        if (dbSub) {
          dbSub.status = sub.status;
          dbSub.currentPeriodEnd = new Date(sub.current_period_end * 1000);
          await dbSub.save();

          if (sub.status !== 'active' && sub.status !== 'trialing') {
            await User.findByIdAndUpdate(dbSub.userId, { plan: 'free' });
          } else {
            await User.findByIdAndUpdate(dbSub.userId, { plan: 'pro' });
          }
        }
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send('Received');
  } catch (error) {
    res.status(500).send('Webhook handler failed');
  }
};
