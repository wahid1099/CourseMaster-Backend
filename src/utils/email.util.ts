import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.createTransporter();
  }

  private createTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      console.log('✅ Email service configured');
    } catch (error) {
      console.error('Email service configuration failed:', error);
      console.log('⚠️  Continuing without email notifications');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email service not available');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `CourseMaster <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      });
      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(name: string, email: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CourseMaster! 🎓</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for joining CourseMaster, your gateway to world-class education.</p>
              <p>We're excited to have you on board. Start exploring our courses and begin your learning journey today!</p>
              <a href="${process.env.FRONTEND_URL}" class="button">Explore Courses</a>
              <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CourseMaster. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to CourseMaster! 🎓',
      html
    });
  }

  async sendEnrollmentEmail(name: string, email: string, courseTitle: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .course-title { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Enrollment Confirmed! ✅</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${name}!</h2>
              <p>You've successfully enrolled in:</p>
              <div class="course-title">
                <strong>${courseTitle}</strong>
              </div>
              <p>You can now access all course materials and start learning at your own pace.</p>
              <a href="${process.env.FRONTEND_URL}/student/dashboard" class="button">Go to Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: `Enrolled: ${courseTitle}`,
      html
    });
  }
}

export default new EmailService();
