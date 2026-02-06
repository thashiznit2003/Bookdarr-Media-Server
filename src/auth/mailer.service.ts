import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { SettingsService } from '../settings/settings.service';
import { SmtpConfigService } from '../settings/smtp-config.service';

@Injectable()
export class MailerService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly smtpConfigService: SmtpConfigService,
  ) {}

  async sendPasswordReset(
    email: string,
    token: string,
    ttlMinutes: number,
    baseUrl?: string,
  ) {
    const settings = this.settingsService.getSettings();
    const stored = await this.smtpConfigService.getConfig();
    const smtp = stored ?? settings.smtp;

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

    const fromAddress = this.formatFromAddress(
      smtp.fromName,
      smtp.from ?? smtp.user,
    );
    const subject = 'Bookdarr Media Server password reset';
    const resetLink = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/login?reset=${encodeURIComponent(token)}`
      : undefined;
    const text = `A password reset was requested for your Bookdarr Media Server account.

Use this token to reset your password (valid for ${ttlMinutes} minutes):
${token}

${resetLink ? `Reset link: ${resetLink}\n\n` : ''}
If you did not request this, you can ignore this email.`;

    await transporter.sendMail({
      to: email,
      from: fromAddress,
      subject,
      text,
    });
  }

  async sendNewUserWelcome(email: string, username: string, baseUrl?: string) {
    const settings = this.settingsService.getSettings();
    const stored = await this.smtpConfigService.getConfig();
    const smtp = stored ?? settings.smtp;

    if (!smtp.host || !smtp.port || !smtp.user || !smtp.pass) {
      return;
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

    const fromAddress = this.formatFromAddress(
      smtp.fromName,
      smtp.from ?? smtp.user,
    );
    const loginUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/login`
      : undefined;
    const subject = 'Your Bookdarr Media Server account';
    const text = `An account has been created for you on Bookdarr Media Server.

Username: ${username}
${loginUrl ? `Login: ${loginUrl}\n` : ''}
If you did not expect this email, you can ignore it.`;

    await transporter.sendMail({
      to: email,
      from: fromAddress,
      subject,
      text,
    });
  }

  private formatFromAddress(
    fromName?: string | null,
    fromEmail?: string | null,
  ) {
    const email = (fromEmail || '').trim();
    if (!email) {
      return undefined;
    }
    if (!fromName || fromName.trim().length === 0) {
      return email;
    }
    return `${fromName.trim()} <${email}>`;
  }
}
