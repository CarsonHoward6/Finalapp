"use server";

import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitation(email: string) {
    try {
        // Validate email format
        if (!email || !email.includes("@")) {
            return { success: false, error: "Invalid email address" };
        }

        // Get current user
        const supabase = await createClient();
        if (!supabase) {
            return { success: false, error: "Failed to initialize database client" };
        }

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        // Get inviter's profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username")
            .eq("id", user.id)
            .single();

        const inviterName = profile?.full_name || profile?.username || "A friend";

        // Generate invitation link
        const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/signup?ref=${user.id}`;

        // Check if RESEND_API_KEY is configured
        if (!process.env.RESEND_API_KEY) {
            console.warn("RESEND_API_KEY not configured. Email would have been sent to:", email);
            return {
                success: true,
                message: "Demo mode: Email functionality requires RESEND_API_KEY environment variable"
            };
        }

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "ProGrid <onboarding@progrid.com>",
            to: [email],
            subject: `${inviterName} invited you to join ProGrid`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background-color: #0D0D0D;
                        }
                        .container {
                            max-width: 600px;
                            margin: 40px auto;
                            background: linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%);
                            border-radius: 16px;
                            overflow: hidden;
                            border: 1px solid rgba(255, 255, 255, 0.05);
                        }
                        .header {
                            background: linear-gradient(135deg, #1A73FF 0%, #00E5FF 100%);
                            padding: 40px;
                            text-align: center;
                        }
                        .logo {
                            font-size: 32px;
                            font-weight: bold;
                            color: white;
                            letter-spacing: 2px;
                        }
                        .content {
                            padding: 40px;
                            color: #E5E5E5;
                        }
                        .content h1 {
                            font-size: 24px;
                            margin-top: 0;
                            color: white;
                        }
                        .content p {
                            margin: 16px 0;
                            color: #9CA3AF;
                        }
                        .button {
                            display: inline-block;
                            padding: 16px 32px;
                            background: linear-gradient(135deg, #1A73FF 0%, #00E5FF 100%);
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                            margin: 24px 0;
                            transition: transform 0.2s;
                        }
                        .button:hover {
                            transform: translateY(-2px);
                        }
                        .footer {
                            padding: 24px 40px;
                            text-align: center;
                            color: #6B7280;
                            font-size: 14px;
                            border-top: 1px solid rgba(255, 255, 255, 0.05);
                        }
                        .features {
                            background: rgba(255, 255, 255, 0.03);
                            border-radius: 12px;
                            padding: 24px;
                            margin: 24px 0;
                        }
                        .features ul {
                            margin: 0;
                            padding-left: 20px;
                            color: #D1D5DB;
                        }
                        .features li {
                            margin: 8px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="logo">PROGRID</div>
                        </div>
                        <div class="content">
                            <h1>You're Invited to ProGrid!</h1>
                            <p><strong>${inviterName}</strong> has invited you to join ProGrid - the all-in-one platform for competitive people.</p>

                            <div class="features">
                                <p style="margin-top: 0; color: white; font-weight: 600;">Join thousands of competitors who use ProGrid to:</p>
                                <ul>
                                    <li>Organize and participate in tournaments</li>
                                    <li>Build and manage competitive teams</li>
                                    <li>Track performance with detailed analytics</li>
                                    <li>Stream matches and watch others compete</li>
                                    <li>Connect with the competitive community</li>
                                </ul>
                            </div>

                            <p style="text-align: center;">
                                <a href="${inviteUrl}" class="button">Join ProGrid Now</a>
                            </p>

                            <p style="font-size: 14px; color: #6B7280;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="${inviteUrl}" style="color: #00E5FF;">${inviteUrl}</a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ProGrid. All rights reserved.</p>
                            <p>You received this email because ${inviterName} invited you to join ProGrid.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error: "Failed to send invitation email" };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Error sending invitation:", error);
        return { success: false, error: "An unexpected error occurred" };
    }
}
