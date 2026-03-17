import nodemailer from "nodemailer";

/* ======================= UTILS ======================= */
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ======================= MAIL SENDER ======================= */
export async function sendTicketEmail(ticket) {
  const recipients = [
    {
      email: "mushtaq.talib@spc-it.com.iq",
      title: "Mushtaq Talib",
    },

    //  {
    //   email: "monther.sahib@spc-it.com.iq",
    //   title: "Monther Sahib",
    // },
    
 
   
   
  ];

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const safe = (v) => escapeHtml(v ?? "");

  const safeRate =
    ticket?.rate !== null && ticket?.rate !== undefined && ticket?.rate !== ""
      ? Number(ticket.rate).toLocaleString()
      : "-";

  const safeDueDate = ticket?.dueDate
    ? new Date(ticket.dueDate).toLocaleDateString("en-CA")
    : "-";

  const ticketId = ticket?._id?.toString?.() || ticket?._id || "";
  const baseUrl = "https://outsource.spc-it.com.iq";
  const ticketDetailsUrl = `${baseUrl}/tickets/${encodeURIComponent(ticketId)}`;

  for (const recipient of recipients) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Ticket</title>
</head>
<body style="margin:0; padding:0; background-color:#0b1220;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0b1220; margin:0; padding:0;">
    <tr>
      <td align="center" style="padding:22px 14px;">

        <table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:720px; border-collapse:collapse;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1f2937; border:1px solid #374151; border-radius:16px; padding:18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" valign="middle" align="left">
                    <div style="font-family:Arial,sans-serif; font-size:22px; font-weight:700; color:#ffffff; line-height:1.2;">
                      SPC
                    </div>
                    <div style="font-family:Arial,sans-serif; font-size:11px; color:#cbd5e1; margin-top:4px;">
                      Developed by SPC team
                    </div>
                  </td>

                  <td width="34%" valign="middle" align="center">
                    <div style="font-family:Arial,sans-serif; font-size:18px; font-weight:700; color:#ffffff; line-height:1.2;">
                      Ticket System
                    </div>
                    <div style="font-family:Arial,sans-serif; font-size:11px; color:#cbd5e1; margin-top:5px;">
                      Email Notification
                    </div>
                  </td>

                  <td width="33%" valign="middle" align="right">
                    <span style="
                      display:inline-block;
                      font-family:Arial,sans-serif;
                      font-size:14px;
                      font-weight:700;
                      color:#ffffff;
                      background-color:#2563eb;
                      border:1px solid #1d4ed8;
                      border-radius:999px;
                      padding:10px 16px;
                      text-transform:uppercase;
                    ">
                      New Ticket
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SPACER -->
          <tr>
            <td height="14" style="height:14px;"></td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#0f172a; border:1px solid #334155; border-radius:16px; overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="right" style="background-color:#1f2937; padding:14px 16px; font-family:Arial,sans-serif; color:#f3f4f6; font-weight:700; font-size:13px; border-bottom:1px solid #334155;">
                    إشعار إنشاء تذكرة جديدة
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px;">

                    <div style="text-align:right; font-family:Arial,sans-serif; font-weight:700; font-size:18px; color:#e5e7eb; margin:0 0 10px 0;">
                      👋 مرحبا ${safe(recipient.title || "زميلنا")}
                    </div>

                    <div style="text-align:right; font-family:Arial,sans-serif; font-size:13px; color:#cbd5e1; line-height:1.9; margin:0 0 14px 0;">
                      تم إنشاء تذكرة جديدة بواسطة
                      <b style="color:#ffffff;">${safe(ticket?.createdBy || "Unknown")}</b>.
                      <br/>
                      يمكنك مراجعة تفاصيل التذكرة من خلال الزر التالي:
                    </div>

                    <!-- BUTTON -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:18px auto 8px auto;">
                      <tr>
                        <td align="center" bgcolor="#2563eb" style="border-radius:8px; border:1px solid #1d4ed8;">
                          <a href="${safe(ticketDetailsUrl)}"
                             style="display:inline-block; font-family:Arial,sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; padding:12px 24px;">
                            🎫 عرض التفاصيل
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- INFO GRID -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                      <tr>
                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Ticket ID</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(ticketId || "-")}</div>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Title</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(ticket?.title || "-")}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Assigned To</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(ticket?.assignedTo || "-")}</div>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Company</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(ticket?.company || "-")}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Priority</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(ticket?.priority || "-")}</div>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Due Date</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(safeDueDate)}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <tr>
                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Rate</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(safeRate)} ${safe(ticket?.currency || "")}</div>
                              </td>
                            </tr>
                          </table>
                        </td>

                        <td width="50%" valign="top" style="padding:6px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                            <tr>
                              <td style="padding:14px;">
                                <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">Paid</div>
                                <div style="font-family:Arial,sans-serif; font-size:14px; color:#f8fafc; font-weight:700;">${safe(ticket?.paid || "no")}</div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${
                      ticket?.description
                        ? `
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px; background-color:#1f2937; border:1px solid #374151; border-radius:12px;">
                          <tr>
                            <td style="padding:14px; text-align:right;">
                              <div style="font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; font-weight:700; margin-bottom:6px;">
                                Description
                              </div>
                              <div style="font-family:Arial,sans-serif; font-size:13px; color:#e5e7eb; line-height:1.8;">
                                ${safe(ticket.description).replaceAll("\n", "<br/>")}
                              </div>
                            </td>
                          </tr>
                        </table>
                      `
                        : ""
                    }

                    <div style="margin-top:16px; font-family:Arial,sans-serif; font-size:11px; color:#94a3b8; text-align:center;">
                      هذا الإيميل مرسل تلقائياً من النظام. الرجاء عدم الرد عليه.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:12px; text-align:center; font-family:Arial,sans-serif; color:#94a3b8; font-size:11px; line-height:1.7;">
              <div style="font-weight:700;">SPC • Ticket System</div>
              <div>© ${new Date().getFullYear()} All rights reserved</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"Ticket System" <${process.env.SMTP_USER}>`,
      to: recipient.email,
      subject: `New Ticket: ${ticket?.title || "Untitled"}`,
      html,
    });
  }
}