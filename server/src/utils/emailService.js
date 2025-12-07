import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your email provider
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});



// Send budget alert email
export const sendBudgetAlertEmail = async (userEmail, userName, budgetDetails) => {
  const { categoryName, spent, total, percentage } = budgetDetails;


  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: userEmail,
    subject: `⚠️ Budget Alert: ${categoryName} at ${percentage}%`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Budget Alert</h2>
        <p>Hello ${userName},</p>

        <p>Your <strong>${categoryName}</strong> budget has reached <strong>${percentage}%</strong> of your limit.</p>
        

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Category:</strong> ${categoryName}</p>
          <p style="margin: 5px 0;"><strong>Spent:</strong> €${spent.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Budget:</strong> €${total.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Remaining:</strong> €${(total - spent).toFixed(2)}</p>
        </div>


        <p>Please review your spending to stay within your budget.</p>
        

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated message from your Finance Manager app.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Budget alert email sent to ${userEmail}`);
    return true;


  } catch (error) {
    console.error('Error sending budget alert email:', error);

    return false;
  }
};



export default { sendBudgetAlertEmail };
