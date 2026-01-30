import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MailerService {
  constructor(private readonly settingsService: SettingsService) {}

  async sendPasswordReset(email: string, token: string, ttlMinutes: number) {
    const settings = this.settingsService.getSettings();
    const smtp = settings.smtp;

    if (!smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      throw new ServiceUnavailableException('SMTP is not configured.');
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const fromAddress = smtp.from ?? smtp.user;
    const subject = 'Bookdarr Media Server password reset';
    const text = `A password reset was requested for your Bookdarr Media Server account.

Use this token to reset your password (valid for ${ttlMinutes} minutes):
${token}

If you did not request this, you can ignore this email.`;

    await transporter.sendMail({
      to: email,
      from: fromAddress,
      subject,
      text,
    });
  }
}
