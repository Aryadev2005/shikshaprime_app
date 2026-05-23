import nodemailer from "nodemailer";

// ZeptoMail SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.in",
  port: 587,
  secure: false,
  auth: {
    user: "emailapikey", // ZeptoMail requires this fixed username
    pass: "PHtE6r0MRb2/jjZ6oxACs/HpEM6nZowp9eJnLgRBt41CCaBSSU1XqYwrwD/jqRcjXfRHRf7OzN9tubPKte7RIG+4NGlLD2qyqK3sx/VYSPOZsbq6x00as1sfcUffU4fuetZs1SzQv9feNA=="
  }
});

export const sendRegistrationEmail = async (
  to: string,
  name: string,
  registrationId: string,
  paymentUrl: string
) => {
  try {
    await transporter.sendMail({
      from: '"ShikshaPrime" <noreply@shikshaprime.com>',
      to: to, // user email from registration form
      subject: "Registration Successful - ShikshaPrime",
      html: `
        <h3>Registration Successful</h3>
        <p>Hello ${name},</p>
        <p>Your Registration ID: <b>${registrationId}</b></p>
        <p>Please complete your payment:</p>
        <a href="${paymentUrl}">${paymentUrl}</a>
        <br/><br/>
        <p>ShikshaPrime Team</p>
      `
    });

    console.log("[EMAIL] Sent to:", to);
  } catch (error) {
    console.error("[EMAIL ERROR]", error);
    throw error;
  }
};

export const sendPaymentSuccessEmail = async (
  to: string,
  name: string,
  registrationId: string,
  amount: number,
  transactionId: string,
  receiptNo: string,
  receiptUrl: string
) => {
  await transporter.sendMail({
    from: '"ShikshaPrime" <noreply@shikshaprime.com>',
    to,
    subject: "Payment Successful - ShikshaPrime",
    html: `
      <h3>Payment Successful</h3>
      <p>Hello ${name},</p>
      <p>Your payment has been received successfully.</p>
      <p><b>Registration ID:</b> ${registrationId}</p>
      <p><b>Amount:</b> ₹${amount}</p>
      <p><b>Transaction ID:</b> ${transactionId}</p>
      <p><b>Receipt No:</b> ${receiptNo}</p>
      <p><a href="${receiptUrl}">Download Receipt</a></p>
      <br/>
      <p>ShikshaPrime Team</p>
    `
  });
};

export const sendSelectionEmail = async (
  to: string,
  name: string,
  registrationId: string,
  paymentUrl: string
) => {
  try {
    await transporter.sendMail({
      from: '"ShikshaPrime" <noreply@shikshaprime.com>',
      to,
      subject: "Congratulations! You are selected for admission",
      html: `
        <h3>Admission Selection</h3>
        <p>Hello ${name},</p>
        <p><b>Congratulations!</b> You have been selected for admission.</p>
        <p>Your Registration ID: <b>${registrationId}</b></p>
        <p>Please pay the admission fees using the link below:</p>
        <a href="${paymentUrl}">Pay Admission Fees</a>
        <br/><br/>
        <p>ShikshaPrime Team</p>
      `
    });

    console.log("[SELECTION EMAIL] Sent to:", to);
  } catch (error) {
    console.error("[SELECTION EMAIL ERROR]", error);
    throw error;
  }
};

export const sendRegistrationPaymentSuccessEmail = async (
  to: string,
  name: string,
  registrationId: string,
  amount: number,
  transactionId: string
) => {
  try {
    await transporter.sendMail({
      from: '"ShikshaPrime" <noreply@shikshaprime.com>',
      to,
      subject: "Registration Fee Payment Successful",
      html: `
        <h3>Registration Fee Paid Successfully</h3>
        <p>Hello ${name},</p>
        <p>Your registration fee has been received successfully.</p>
        <p><b>Registration ID:</b> ${registrationId}</p>
        <p><b>Amount:</b> ₹${amount}</p>
        <p><b>Transaction ID:</b> ${transactionId}</p>
        <br/>
        <p>Thank you.<br/>ShikshaPrime Team</p>
      `
    });

    console.log("[EMAIL] Registration payment email sent to:", to);
  } catch (error) {
    console.error("[EMAIL ERROR] Registration payment:", error);
  }
};

export const sendAdmissionCompletedEmail = async (
  to: string,
  name: string,
  studentId: string
) => {
  try {
    await transporter.sendMail({
      from: '"ShikshaPrime" <noreply@shikshaprime.com>',
      to,
      subject: "Admission Completed - ShikshaPrime",
      html: `
        <h3>Admission Confirmed</h3>
        <p>Hello ${name},</p>
        <p>Your admission process has been completed successfully.</p>
        <p><b>Your Student ID:</b> ${studentId}</p>
        <br/>
        <p>Welcome to ShikshaPrime.</p>
        <p>Regards,<br/>ShikshaPrime Team</p>
      `
    });

    console.log("[EMAIL] Admission completed email sent to:", to);
  } catch (error) {
    console.error("[EMAIL ERROR] Admission completed:", error);
    throw error;
  }
};

export const sendOtpEmail = async (to: string, otp: string, name: string): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: '"ShikshaPrime" <noreply@shikshaprime.com>',
      to,
      subject: "Password Change OTP - ShikshaPrime",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h3 style="color: #1e293b;">Password Change Verification</h3>
          <p>Hello ${name},</p>
          <p>Your OTP for password change is:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="letter-spacing: 8px; color: #2563eb; font-size: 36px; font-weight: bold;">${otp}</span>
          </div>
          <p>This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 13px;">If you did not request this, please ignore this email.</p>
          <p>Regards,<br/>ShikshaPrime Team</p>
        </div>
      `
    });
    console.log("[EMAIL OTP] Sent to:", to);
    return true;
  } catch (error) {
    console.error("[EMAIL OTP ERROR]", error);
    return false;
  }
};
