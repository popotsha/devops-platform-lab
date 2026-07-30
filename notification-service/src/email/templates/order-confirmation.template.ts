export type OrderConfirmationTemplateParams = {
  orderId: number;
  productName: string;
  quantity: number;
  status: string;
  recipientEmail: string;
  storefrontUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOrderConfirmationSubject(params: OrderConfirmationTemplateParams): string {
  return `Order #${params.orderId} confirmed — ${params.productName}`;
}

export function buildOrderConfirmationHtml(params: OrderConfirmationTemplateParams): string {
  const storefrontUrl = params.storefrontUrl ?? "http://localhost:3000";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order #${params.orderId} confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #dbe3f0;border-radius:16px;overflow:hidden;box-shadow:0 20px 45px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:28px;background:linear-gradient(135deg,#4f46e5,#06b6d4);color:#ffffff;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">Order confirmed</p>
              <h1 style="margin:0;font-size:24px;line-height:1.3;">Thanks for your purchase</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;line-height:1.6;">Hi ${escapeHtml(params.recipientEmail)},</p>
              <p style="margin:0 0 20px;line-height:1.6;">Your order <strong>#${params.orderId}</strong> has been placed successfully.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2ff;border-radius:12px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px;"><strong>Product:</strong> ${escapeHtml(params.productName)}</p>
                    <p style="margin:0 0 8px;"><strong>Quantity:</strong> ${params.quantity}</p>
                    <p style="margin:0;"><strong>Status:</strong> ${escapeHtml(params.status)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;line-height:1.6;color:#64748b;font-size:14px;">
                Track your order anytime in the storefront under <strong>My Orders</strong>.
              </p>
              <p style="margin:16px 0 0;text-align:center;">
                <a href="${escapeHtml(storefrontUrl)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px;">
                  Open storefront
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildOrderConfirmationText(params: OrderConfirmationTemplateParams): string {
  return `Order #${params.orderId} confirmed

Hi ${params.recipientEmail},

Your order has been placed successfully.

Product: ${params.productName}
Quantity: ${params.quantity}
Status: ${params.status}

View your orders in the storefront: ${params.storefrontUrl ?? "http://localhost:3000"}
`;
}
