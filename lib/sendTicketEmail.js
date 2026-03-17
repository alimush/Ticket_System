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
    {
      email: "monther.sahib@spc-it.com.iq",
      title: "Monther Sahib",
    },
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
    <div style="margin:0;padding:0;background:#0b1220;direction:ltr">
      <div style="max-width:720px;margin:0 auto;padding:22px 14px">

        <!-- ================= HEADER ================= -->
        <div style="
          position:relative;
          border-radius:22px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,.10);
          background:linear-gradient(to bottom,#1f2937,#1f2937 35%,#111827);
          box-shadow:0 14px 34px rgba(0,0,0,.60);
        ">
          <div style="position:relative;padding:16px 18px">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
              <tr>
                <td style="width:33%;vertical-align:middle">
                  <div style="font-family:Arial,sans-serif;line-height:1.15">
                    <div style="
                      font-weight:900;font-size:22px;letter-spacing:.3px;
                      background:linear-gradient(90deg,#d1d5db,#f3f4f6,#ffffff);
                      -webkit-background-clip:text;background-clip:text;color:transparent;
                    ">SPC</div>
                    <div style="font-size:11px;color:#cbd5e1;margin-top:4px">
                      Developed by SPC team
                    </div>
                  </div>
                </td>

                <td style="width:34%;text-align:center;vertical-align:middle">
                  <div style="
                    font-family:Arial,sans-serif;
                    font-weight:900;
                    font-size:18px;
                    letter-spacing:.2px;
                    background:linear-gradient(90deg,#e5e7eb,#f3f4f6,#ffffff);
                    -webkit-background-clip:text;background-clip:text;color:transparent;
                  ">Ticket System</div>

                  <div style="font-family:Arial,sans-serif;font-size:11px;color:#cbd5e1;margin-top:5px">
                    Email Notification
                  </div>
                </td>

                <td style="width:33%;text-align:right;vertical-align:middle">
                  <span style="
                    display:inline-block;
                    font-family:Arial,sans-serif;
                    font-size:16px;
                    font-weight:900;
                    letter-spacing:2.2px;
                    padding:12px 18px;
                    border-radius:999px;
                    border:2px solid rgba(255,255,255,.34);
                    background:linear-gradient(135deg,#60a5fa,#2563eb);
                    color:#ffffff;
                    white-space:nowrap;
                    text-transform:uppercase;
                    box-shadow:0 14px 28px rgba(0,0,0,.55);
                  ">
                    NEW TICKET
                  </span>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- ================= BODY ================= -->
        <div style="
          margin-top:14px;
          border-radius:22px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,.08);
          background:rgba(15,23,42,.88);
          box-shadow:0 12px 30px rgba(0,0,0,.60);
        ">
          <div style="
            padding:14px 16px;
            background:rgba(31,41,55,.78);
            border-bottom:1px solid rgba(255,255,255,.06);
            font-family:Arial,sans-serif;
            color:#f3f4f6;
            font-weight:900;
            font-size:13px;
            text-align:right;
          ">
            إشعار إنشاء تذكرة جديدة
          </div>

          <div style="padding:18px">

            <div style="
              text-align:right;
              font-family:Arial,sans-serif;
              font-weight:900;
              font-size:18px;
              color:#e5e7eb;
              margin:6px 2px 10px 2px;
            ">
              👋 مرحبا ${safe(recipient.title || "زميلنا")}
            </div>

            <div style="
              text-align:right;
              font-family:Arial,sans-serif;
              font-size:13px;
              color:#cbd5e1;
              line-height:1.95;
              margin:0 2px 14px 2px;
            ">
              تم إنشاء تذكرة جديدة بواسطة
              <b style="color:#f8fafc">${safe(ticket?.createdBy || "Unknown")}</b>.
              <br/>
              يمكنك مراجعة تفاصيل التذكرة من خلال الزر التالي:
            </div>

            <div style="text-align:center;margin:18px 0 8px 0">
              <a href="${safe(ticketDetailsUrl)}" style="
                display:inline-block;
                padding:12px 24px;
                border-radius:999px;
                font-family:Arial,sans-serif;
                font-size:15px;
                font-weight:900;
                letter-spacing:.3px;
                background:linear-gradient(to bottom,#1f2937,#1f2937 40%,#111827);
                border:1px solid rgba(255,255,255,.28);
                box-shadow:0 14px 28px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.18);
                text-decoration:none;
              ">
                <span style="
                  font-weight:900;
                  font-size:15px;
                  letter-spacing:.3px;
                  background:linear-gradient(90deg,#d1d5db,#f3f4f6,#ffffff);
                  -webkit-background-clip:text;background-clip:text;color:transparent;
                  display:inline-block;
                ">🎫 عرض التفاصيل</span>
              </a>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-collapse:separate;border-spacing:12px 12px;margin-top:10px">

              <tr>
                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Ticket ID
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(ticketId || "-")}
                    </div>
                  </div>
                </td>

                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Title
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(ticket?.title || "-")}
                    </div>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Assigned To
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(ticket?.assignedTo || "-")}
                    </div>
                  </div>
                </td>

                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Company
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(ticket?.company || "-")}
                    </div>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Priority
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(ticket?.priority || "-")}
                    </div>
                  </div>
                </td>

                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Due Date
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(safeDueDate)}
                    </div>
                  </div>
                </td>
              </tr>

              <tr>
                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Rate
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(safeRate)} ${safe(ticket?.currency || "")}
                    </div>
                  </div>
                </td>

                <td style="width:50%">
                  <div style="
                    border:1px solid rgba(255,255,255,.10);
                    background:rgba(31,41,55,.58);
                    border-radius:18px;
                    padding:14px">
                    <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                      Paid
                    </div>
                    <div style="font-size:14px;color:#f8fafc;font-weight:900">
                      ${safe(ticket?.paid || "no")}
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            ${
              ticket?.description
                ? `
                <div style="
                  margin-top:14px;
                  border:1px solid rgba(255,255,255,.10);
                  background:rgba(31,41,55,.58);
                  border-radius:18px;
                  padding:14px;
                  text-align:right">
                  <div style="font-size:11px;color:#94a3b8;font-weight:900;margin-bottom:6px">
                    Description
                  </div>
                  <div style="font-size:13px;color:#e5e7eb;line-height:1.8">
                    ${safe(ticket.description).replaceAll("\n", "<br/>")}
                  </div>
                </div>
              `
                : ""
            }

            <div style="margin-top:16px;font-size:11px;color:#94a3b8;text-align:center">
              هذا الإيميل مرسل تلقائياً من النظام. الرجاء عدم الرد عليه.
            </div>
          </div>
        </div>

        <div style="margin-top:12px;text-align:center;font-family:Arial,sans-serif;color:#94a3b8;font-size:11px;line-height:1.7">
          <div style="opacity:.92;font-weight:900">SPC • Ticket System</div>
          <div style="opacity:.75">© ${new Date().getFullYear()} All rights reserved</div>
        </div>
      </div>
    </div>
    `;

    await transporter.sendMail({
      from: `"Ticket System" <${process.env.SMTP_USER}>`,
      to: recipient.email,
      subject: `New Ticket: ${ticket?.title || "Untitled"}`,
      html,
    });
  }
}