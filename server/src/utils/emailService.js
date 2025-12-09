import nodemailer from 'nodemailer';

// Function to check if email is configured (called lazily)
const isEmailConfigured = () => {
  return process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
};

// Function to get transporter (creates it lazily when needed)
let transporter = null;
const getTransporter = () => {
  if (!transporter && isEmailConfigured()) {
    console.log('Initializing email transporter with user:', process.env.EMAIL_USER);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  return transporter;
};



// Send budget alert email
export const sendBudgetAlertEmail = async (userEmail, userName, budgetDetails) => {
  console.log('Attempting to send budget alert email...');
  console.log('   To:', userEmail);
  console.log('   User:', userName);
  console.log('   Details:', budgetDetails);
  
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
    const emailTransporter = getTransporter();
    
    if (!emailTransporter) {
      console.log('Email not configured, skipping alert email');
      console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
      console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
      return false;
    }
    
    console.log('Sending email via Gmail...');
    const result = await emailTransporter.sendMail(mailOptions);
    console.log('Budget alert email sent successfully!');
    console.log('   Message ID:', result.messageId);
    console.log('   Recipient:', userEmail);
    return true;


  } catch (error) {
    console.error('Error sending budget alert email:');
    console.error('   Error message:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    return false;
  }
};



export default { sendBudgetAlertEmail };
