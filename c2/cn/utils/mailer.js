const nodemailer = require('nodemailer');

// configure your Gmail or any SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yourgmail@gmail.com',
    pass: 'your-app-password' // use App Password for Gmail
  }
});

async function sendDeadlineEmail(to, todo) {
  await transporter.sendMail({
    from: '"Todo Reminder" <yourgmail@gmail.com>',
    to,
    subject: '⏰ Todo deadline is near!',
    text: `Reminder: Your task "${todo.text}" is due at ${new Date(todo.deadline).toLocaleString()}`
  });
}

module.exports = { sendDeadlineEmail };
