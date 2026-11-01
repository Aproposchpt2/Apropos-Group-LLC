const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL = 'jmitchell1126@gmail.com';
const FROM_EMAIL = 'noreply@aproposgroupllc.com';

const ALLOWED_INQUIRY_TYPES = [
  'capability-briefing',
  'rfp-response',
  'teaming',
  'demo',
  'partnership',
  'general',
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  const {
    contracting_officer,
    agency_name,
    email,
    phone,
    opportunity_number,
    inquiry_type,
    requirement,
  } = body;

  if (!contracting_officer || !agency_name || !email || !inquiry_type || !requirement) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid email address' }) };
  }
  if (!ALLOWED_INQUIRY_TYPES.includes(inquiry_type)) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Invalid inquiry type' }) };
  }
  if (
    contracting_officer.length > 120 ||
    agency_name.length > 200 ||
    email.length > 254 ||
    requirement.length > 4000
  ) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Input too long' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: dbError } = await supabase.from('contact_inquiries').insert({
    agency_name: agency_name.trim(),
    contracting_officer: contracting_officer.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : null,
    opportunity_number: opportunity_number ? opportunity_number.trim() : null,
    requirement: requirement.trim(),
    status: 'new',
  });

  if (dbError) {
    console.error('Supabase insert error:', dbError.message);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Database error' }) };
  }

  const inquiryLabels = {
    'capability-briefing': 'Capability Briefing Request',
    'rfp-response': 'RFP / Solicitation Response',
    'teaming': 'Teaming or Subcontracting Inquiry',
    'demo': 'Product Demo',
    'partnership': 'Partnership Discussion',
    'general': 'General Inquiry',
  };

  const emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:600px;background:#0A0E17;color:#F2F5FA;padding:32px;border-radius:8px">
  <div style="border-bottom:1px solid rgba(200,169,110,.3);padding-bottom:16px;margin-bottom:24px">
    <span style="font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#C8A96E">Apropos Group LLC · New Government Inquiry</span>
  </div>
  <h2 style="font-size:20px;color:#F2F5FA;margin:0 0 20px">${inquiryLabels[inquiry_type] || inquiry_type}</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#8FA3BE;font-size:13px;width:160px">Contracting Officer</td><td style="padding:8px 0;font-size:14px">${contracting_officer}</td></tr>
    <tr><td style="padding:8px 0;color:#8FA3BE;font-size:13px">Agency / Organization</td><td style="padding:8px 0;font-size:14px">${agency_name}</td></tr>
    <tr><td style="padding:8px 0;color:#8FA3BE;font-size:13px">Email</td><td style="padding:8px 0;font-size:14px"><a href="mailto:${email}" style="color:#C8A96E">${email}</a></td></tr>
    ${phone ? `<tr><td style="padding:8px 0;color:#8FA3BE;font-size:13px">Phone</td><td style="padding:8px 0;font-size:14px">${phone}</td></tr>` : ''}
    ${opportunity_number ? `<tr><td style="padding:8px 0;color:#8FA3BE;font-size:13px">Opportunity #</td><td style="padding:8px 0;font-size:14px;font-family:monospace">${opportunity_number}</td></tr>` : ''}
    <tr><td style="padding:8px 0;color:#8FA3BE;font-size:13px">Received</td><td style="padding:8px 0;font-size:14px">${new Date().toLocaleString('en-US',{timeZone:'America/Los_Angeles'})}</td></tr>
  </table>
  <div style="margin-top:24px;padding:20px;background:rgba(28,35,51,.8);border-radius:6px;border-left:2px solid #C8A96E">
    <div style="font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8FA3BE;margin-bottom:10px">Requirement</div>
    <div style="font-size:14px;line-height:1.7;color:#B8C8DC;white-space:pre-wrap">${requirement}</div>
  </div>
  <div style="margin-top:24px;font-size:11px;color:#2A3448">Apropos Group LLC · aproposgroupllc.com</div>
</div>`;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ALERT_EMAIL,
        reply_to: email,
        subject: `[Apropos Group] ${inquiryLabels[inquiry_type] || 'New Inquiry'} — ${agency_name}`,
        html: emailHtml,
      }),
    });
    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', errText);
    }
  } catch (emailErr) {
    console.error('Email send failed:', emailErr.message);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
