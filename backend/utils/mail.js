// backend/utils/mail.js
import nodemailer from "nodemailer";

/* ------------------------------------------------------
   Create Nodemailer Transporter (Gmail App Password)
--------------------------------------------------------- */
export function createTransporter() {
  const user = process.env.SMTP_USER; // your gmail address
  const pass = process.env.SMTP_PASS; // 16-char Gmail app password

  if (!user || !pass) {
    console.warn("⚠️ SMTP credentials missing — emails will NOT be sent.");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

/* ------------------------------------------------------
   Helper: Escape text for ICS format
--------------------------------------------------------- */
function escapeICSText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/* ------------------------------------------------------
   Helper: Convert ISO → ICS datetime (UTC)
--------------------------------------------------------- */
function toICSDate(isoStr) {
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/* ------------------------------------------------------
   Build ICS Calendar Event String (UTC) - unchanged
--------------------------------------------------------- */
export function buildICS(booking, event, host) {
  const uid = `booking-${booking.id}@bookmyslot`;
  const dtstamp = toICSDate(new Date().toISOString());
  const dtstart = toICSDate(booking.start);
  const dtend = toICSDate(booking.end);

  const summary = `${event.title} with ${host.name || host.username}`.trim();

  const descriptionLines = [
    `Booked via BookMySlot`,
    `Event: ${event.title}`,
    `Host: ${host.name || host.username}`,
    `Invitee: ${booking.inviteeName} <${booking.inviteeEmail}>`,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter(Boolean);

  const description = descriptionLines.join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookMySlot//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `ORGANIZER:MAILTO:${escapeICSText(host.email || "")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/* ------------------------------------------------------
   NEW: Format ISO in a specific timezone for display
   Returns { date, time } strings
--------------------------------------------------------- */
function formatWithTimezone(isoStr, timeZone) {
  try {
    const dateObj = new Date(isoStr);

    // Date part (weekday, month day, year)
    const date = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timeZone || undefined, // undefined => system default
    }).format(dateObj);

    // Time part (HH:MM 24h)
    const time = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timeZone || undefined,
    }).format(dateObj);

    return { date, time };
  } catch (err) {
    // fallback
    const d = new Date(isoStr);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString(),
    };
  }
}

/* ------------------------------------------------------
   Send Email to Host AND Invitee (uses timezone-aware formatting)
--------------------------------------------------------- */
export async function sendBookingEmails({ booking, event, host }) {
  const transporter = createTransporter();
  if (!transporter) return;

  const icsString = buildICS(booking, event, host);
  const icsBuffer = Buffer.from(icsString, "utf-8");

  // Determine timezones
  const hostTz = host.timezone || "UTC";
  const inviteeTz = booking.inviteeTimezone || hostTz || "UTC";

  // formatted strings
  const hostStart = formatWithTimezone(booking.start, hostTz);
  const hostEnd = formatWithTimezone(booking.end, hostTz);

  const inviteeStart = formatWithTimezone(booking.start, inviteeTz);
  const inviteeEnd = formatWithTimezone(booking.end, inviteeTz);

  // Friendly text lines
  const hostWhenLine = `${hostStart.date} at ${hostStart.time} — ${hostEnd.time} (${hostTz})`;
  const inviteeWhenLine = `${inviteeStart.date} at ${inviteeStart.time} — ${inviteeEnd.time} (${inviteeTz})`;

  const hostEmail = host.email || process.env.SMTP_USER;

  /* ------------------- Host Email ------------------- */
  const hostMail = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: hostEmail,
    subject: `New booking: ${event.title} — ${booking.inviteeName}`,
    text: [
      `Hi ${host.name || host.username || ""},`,
      "",
      `You have a new booking for "${event.title}".`,
      "",
      `When (host timezone): ${hostWhenLine}`,
      `When (invitee timezone): ${inviteeWhenLine}`,
      "",
      `Invitee: ${booking.inviteeName} (${booking.inviteeEmail})`,
      "",
      `Notes:`,
      booking.notes || "None",
      "",
      `This email includes an .ics file you can add to your calendar.`,
    ].join("\n"),
    attachments: [
      {
        filename: `${event.title.replace(/\s+/g, "_")}-${booking.id}.ics`,
        content: icsBuffer,
        contentType: "text/calendar",
      },
    ],
  };

  /* ------------------- Invitee Email ------------------- */
  const inviteeMail = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: booking.inviteeEmail,
    subject: `Booking confirmed: ${event.title}`,
    text: [
      `Hi ${booking.inviteeName || ""},`,
      "",
      `Your booking for "${event.title}" with ${host.name || host.username || ""} is confirmed.`,
      "",
      `When (invitee timezone): ${inviteeWhenLine}`,
      `When (host timezone): ${hostWhenLine}`,
      "",
      `Notes:`,
      booking.notes || "None",
      "",
      `An .ics calendar file is attached so you can add it to your calendar.`,
    ].join("\n"),
    attachments: [
      {
        filename: `${event.title.replace(/\s+/g, "_")}-${booking.id}.ics`,
        content: icsBuffer,
        contentType: "text/calendar",
      },
    ],
  };

  /* ------------------- Send both emails in parallel (non-fatal) ------------------- */
  await Promise.allSettled([
    transporter.sendMail(hostMail),
    transporter.sendMail(inviteeMail),
  ]).then((results) => {
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        console.error(
          `❌ Failed to send ${i === 0 ? "host" : "invitee"} email:`,
          result.reason
        );
      } else {
        // you can log messageId if you want: result.value.messageId
        // console.log(`${i===0?'host':'invitee'} mail sent:`, result.value?.messageId);
      }
    });
  });
}
