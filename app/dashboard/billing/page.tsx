import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard, Crown, Calendar, DollarSign, ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getUserSubscription, getPaymentHistory, checkIsOwner } from "@/app/actions/subscriptions";
import { UpgradeButton } from "@/components/subscriptions/UpgradeButton";
import { ManageSubscriptionButton } from "@/components/subscriptions/ManageSubscriptionButton";
import { CancelSubscriptionButton } from "@/components/subscriptions/CancelSubscriptionButton";

export default async function BillingPage() {
    const supabase = await createClient();
    if (!supabase) redirect("/login");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const subscription = await getUserSubscription();
    const paymentHistory = await getPaymentHistory(10);
    const isOwner = await checkIsOwner();

    const isPro = subscription?.plan === "pro" && subscription?.status === "active";
    const isCanceling = subscription?.cancel_at_period_end;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-grid-cyan" />
                    Billing & Subscription
                </h1>
                <p className="text-gray-400 mt-2">Manage your ProGrid subscription and payment methods</p>
            </div>

            {/* Owner Badge */}
            {isOwner && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Crown className="w-6 h-6 text-yellow-500" />
                        <div>
                            <h3 className="font-bold text-yellow-500">Owner Account</h3>
                            <p className="text-sm text-yellow-400/80">You have full access to all ProGrid features</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Plan */}
            <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Current Plan</h2>

                <div className={`p-6 rounded-xl border-2 ${
                    isPro
                        ? "bg-gradient-to-br from-electric-blue/10 to-purple-500/10 border-electric-blue/30"
                        : "bg-midnight-900 border-white/10"
                }`}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h3 className="text-2xl font-bold text-white">
                                    {isPro ? "ProGrid Pro" : "ProGrid Free"}
                                </h3>
                                {isPro && <Crown className="w-6 h-6 text-yellow-500" />}
                            </div>

                            <p className="text-gray-400 mt-2">
                                {isPro
                                    ? "Unlimited access to all premium features"
                                    : "Basic features with limited access"}
                            </p>

                            {isPro && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <Calendar className="w-4 h-4 text-grid-cyan" />
                                        <span>
                                            {isCanceling
                                                ? `Cancels on ${new Date(subscription.current_period_end!).toLocaleDateString()}`
                                                : `Renews on ${new Date(subscription.current_period_end!).toLocaleDateString()}`
                                            }
                                        </span>
                                    </div>
                                    {isCanceling && (
                                        <div className="flex items-center gap-2 text-sm text-yellow-500">
                                            <Clock className="w-4 h-4" />
                                            <span>Subscription will be canceled at the end of billing period</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="text-right">
                            <div className="text-3xl font-bold text-white">
                                {isPro ? "$5" : "$0"}
                            </div>
                            <div className="text-sm text-gray-500">
                                {isPro ? "per month" : "forever"}
                            </div>
                        </div>
                    </div>

                    {/* Features List */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">
                            {isPro ? "Your Pro Features:" : "Free Features:"}
                        </h4>
                        <div className="grid md:grid-cols-2 gap-2">
                            <Feature included={true} text="Tournaments & Teams" />
                            <Feature included={true} text="Player Discovery" />
                            <Feature included={true} text="Feed & Social" />
                            <Feature included={true} text="Calendar & Events" />
                            <Feature included={isPro} text="AI Support Assistant" />
                            <Feature included={isPro} text="Advanced Analytics" />
                            <Feature included={isPro} text="Custom Profile Themes" />
                            <Feature included={isPro} text="Priority Tournament Entry" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex gap-3">
                        {!isPro && !isOwner && <UpgradeButton />}
                        {isPro && !isOwner && (
                            <>
                                <ManageSubscriptionButton />
                                {!isCanceling && <CancelSubscriptionButton />}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment History */}
            {paymentHistory.length > 0 && (
                <div className="bg-midnight-800 border border-white/5 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Payment History</h2>

                    <div className="space-y-3">
                        {paymentHistory.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between p-4 bg-midnight-900 rounded-lg border border-white/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        payment.status === "completed"
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400"
                                    }`}>
                                        {payment.status === "completed" ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <XCircle className="w-5 h-5" />
                                        )}
                                    </div>

                                    <div>
                                        <p className="font-medium text-white">{payment.description || payment.type}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(payment.created_at).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-white">
                                        {payment.type === "prize_payout" ? "+" : "-"}
                                        ${(payment.amount / 100).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase">{payment.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Success/Cancel Messages */}
            {/* These would be shown based on URL params from Stripe redirect */}
        </div>
    );
}

function Feature({ included, text }: { included: boolean; text: string }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {included ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : (
                <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
            )}
            <span className={included ? "text-gray-200" : "text-gray-600"}>
                {text}
            </span>
        </div>
    );
}
