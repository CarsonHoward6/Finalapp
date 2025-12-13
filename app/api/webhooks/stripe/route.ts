import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    if (!STRIPE_CONFIG.WEBHOOK_SECRET) {
        console.error("STRIPE_WEBHOOK_SECRET is not configured");
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            STRIPE_CONFIG.WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
        console.error("Supabase client not initialized");
        return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    try {
        switch (event.type as string) {
            // ============================================
            // SUBSCRIPTION EVENTS
            // ============================================

            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode === "subscription") {
                    const subscriptionId = session.subscription as string;
                    const customerId = session.customer as string;
                    const userId = session.metadata?.userId;

                    if (!userId) {
                        console.error("No userId in session metadata");
                        break;
                    }

                    // Get subscription details from Stripe
                    const subscriptionData: any = await stripe.subscriptions.retrieve(subscriptionId);

                    // Update database
                    await supabase
                        .from("subscriptions")
                        .upsert({
                            user_id: userId,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            status: "active",
                            plan: "pro",
                            current_period_start: subscriptionData.current_period_start
                                ? new Date(subscriptionData.current_period_start * 1000).toISOString()
                                : new Date().toISOString(),
                            current_period_end: subscriptionData.current_period_end
                                ? new Date(subscriptionData.current_period_end * 1000).toISOString()
                                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                            cancel_at_period_end: subscriptionData.cancel_at_period_end || false,
                        });

                    // Update profile subscription tier
                    await supabase
                        .from("profiles")
                        .update({ subscription_tier: "pro" })
                        .eq("id", userId);

                    // Add to payment history
                    await supabase.from("payment_history").insert({
                        user_id: userId,
                        type: "subscription",
                        amount: STRIPE_CONFIG.PRO_MONTHLY_PRICE,
                        currency: STRIPE_CONFIG.CURRENCY,
                        description: "ProGrid Pro Monthly Subscription",
                        stripe_transaction_id: subscriptionId,
                        status: "completed",
                    });

                    console.log(`Subscription activated for user ${userId}`);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription: any = event.data.object;
                const customerId = subscription.customer as string;

                // Find user by customer ID
                const { data: subData } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (!subData) {
                    console.error("No subscription found for customer:", customerId);
                    break;
                }

                // Update subscription status
                await supabase
                    .from("subscriptions")
                    .update({
                        status: subscription.status,
                        current_period_start: subscription.current_period_start
                            ? new Date(subscription.current_period_start * 1000).toISOString()
                            : undefined,
                        current_period_end: subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000).toISOString()
                            : undefined,
                        cancel_at_period_end: subscription.cancel_at_period_end || false,
                    })
                    .eq("user_id", subData.user_id);

                console.log(`Subscription updated for user ${subData.user_id}, status: ${subscription.status}`);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription: any = event.data.object;
                const customerId = subscription.customer as string;

                // Find user
                const { data: subData } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (!subData) break;

                // Downgrade to free
                await supabase
                    .from("subscriptions")
                    .update({
                        status: "canceled",
                        plan: "free",
                        canceled_at: new Date().toISOString(),
                    })
                    .eq("user_id", subData.user_id);

                await supabase
                    .from("profiles")
                    .update({ subscription_tier: "free" })
                    .eq("id", subData.user_id);

                console.log(`Subscription canceled for user ${subData.user_id}`);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice: any = event.data.object;
                const customerId = invoice.customer as string;
                const subscriptionId = invoice.subscription as string;

                if (!subscriptionId) break;

                const { data: subData } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (!subData) break;

                // Add to payment history
                await supabase.from("payment_history").insert({
                    user_id: subData.user_id,
                    type: "subscription",
                    amount: invoice.amount_paid,
                    currency: invoice.currency,
                    description: "ProGrid Pro Monthly Subscription - Renewal",
                    stripe_transaction_id: invoice.id,
                    status: "completed",
                });

                console.log(`Payment succeeded for user ${subData.user_id}, amount: ${invoice.amount_paid}`);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const { data: subData } = await supabase
                    .from("subscriptions")
                    .select("user_id")
                    .eq("stripe_customer_id", customerId)
                    .single();

                if (!subData) break;

                // Update status to past_due
                await supabase
                    .from("subscriptions")
                    .update({ status: "past_due" })
                    .eq("user_id", subData.user_id);

                console.log(`Payment failed for user ${subData.user_id}`);
                break;
            }

            // ============================================
            // TOURNAMENT PAYMENT EVENTS
            // ============================================

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const paymentIntentId = paymentIntent.id;

                // Update tournament payment status
                const { data: payment } = await supabase
                    .from("tournament_payments")
                    .select("*")
                    .eq("stripe_payment_intent_id", paymentIntentId)
                    .single();

                if (payment) {
                    await supabase
                        .from("tournament_payments")
                        .update({
                            status: "succeeded",
                            stripe_charge_id: paymentIntent.latest_charge as string,
                        })
                        .eq("id", payment.id);

                    // Add to payment history
                    await supabase.from("payment_history").insert({
                        user_id: payment.user_id,
                        type: "tournament_entry",
                        amount: payment.amount,
                        currency: payment.currency,
                        description: `Tournament entry fee`,
                        stripe_transaction_id: paymentIntentId,
                        status: "completed",
                    });

                    console.log(`Tournament payment succeeded: ${paymentIntentId}`);
                }
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const paymentIntentId = paymentIntent.id;

                await supabase
                    .from("tournament_payments")
                    .update({
                        status: "failed",
                        failure_reason: paymentIntent.last_payment_error?.message || "Unknown error",
                    })
                    .eq("stripe_payment_intent_id", paymentIntentId);

                console.log(`Tournament payment failed: ${paymentIntentId}`);
                break;
            }

            // ============================================
            // CONNECT ACCOUNT EVENTS
            // ============================================

            case "account.updated": {
                const account = event.data.object as Stripe.Account;

                await supabase
                    .from("stripe_connect_accounts")
                    .update({
                        charges_enabled: account.charges_enabled,
                        payouts_enabled: account.payouts_enabled,
                        details_submitted: account.details_submitted,
                        verification_status: account.details_submitted ? "verified" : "pending",
                    })
                    .eq("stripe_account_id", account.id);

                console.log(`Connect account updated: ${account.id}`);
                break;
            }

            case "transfer.created": {
                const transfer = event.data.object as Stripe.Transfer;
                const transferId = transfer.id;

                // Update prize distribution status
                await supabase
                    .from("prize_distributions")
                    .update({ status: "paid", paid_at: new Date().toISOString() })
                    .eq("stripe_transfer_id", transferId);

                console.log(`Transfer created: ${transferId}`);
                break;
            }

            case "transfer.failed": {
                const transfer = event.data.object as Stripe.Transfer;
                const transferId = transfer.id;

                await supabase
                    .from("prize_distributions")
                    .update({
                        status: "failed",
                        failure_reason: "Transfer failed",
                    })
                    .eq("stripe_transfer_id", transferId);

                console.log(`Transfer failed: ${transferId}`);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Error processing webhook:", error);
        return NextResponse.json(
            { error: "Webhook processing failed", details: error.message },
            { status: 500 }
        );
    }
}
