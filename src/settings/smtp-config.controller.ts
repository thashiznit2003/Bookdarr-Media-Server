import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SettingsService } from './settings.service';
import { SmtpConfigService } from './smtp-config.service';
import type { SmtpConfigInput } from './smtp-config.service';
import nodemailer from 'nodemailer';

@Controller('settings/smtp')
@UseGuards(AuthGuard, AdminGuard)
export class SmtpConfigController {
  constructor(
    private readonly smtpConfigService: SmtpConfigService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get()
  async getConfig() {
    const config = await this.smtpConfigService.getConfig();
    if (config) {
      return {
        configured: this.smtpConfigService.isConfigured(config),
        host: config.host,
        port: config.port,
        user: config.user,
        from: config.from ?? undefined,
        fromName: config.fromName ?? undefined,
      };
    }
    const settings = this.settingsService.getSettings();
    const smtp = settings.smtp;
    const configured = Boolean(smtp.host && smtp.port && smtp.user && smtp.pass);
    return {
      configured,
      host: smtp.host,
      port: smtp.port,
      user: smtp.user,
      from: smtp.from,
      fromName: smtp.fromName,
    };
  }

  @Post()
  async updateConfig(@Body() input: SmtpConfigInput) {
    const config = await this.smtpConfigService.upsert(input);
    return {
      configured: this.smtpConfigService.isConfigured(config),
      host: config.host,
      port: config.port,
      user: config.user,
      from: config.from ?? undefined,
      fromName: config.fromName ?? undefined,
    };
  }

  @Post('test')
  async testConfig(@Body() input?: SmtpConfigInput) {
    const host = input?.host?.trim();
    const port = input?.port;
    const user = input?.user?.trim();
    const pass = input?.pass;
    const from = input?.from?.trim();
    const fromName = input?.fromName?.trim();

    const stored = await this.smtpConfigService.getConfig();
    const settings = this.settingsService.getSettings();
    const fallback = stored
      ? {
          host: stored.host,
          port: stored.port,
          user: stored.user,
          pass: stored.pass,
          from: stored.from,
        }
      : settings.smtp;

    const smtpHost = host || fallback.host;
    const smtpPort = port || fallback.port;
    const smtpUser = user || fallback.user;
    const smtpPass = pass || fallback.pass;
    const smtpFrom = from || fallback.from || smtpUser;
    const smtpFromName = fromName || fallback.fromName;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      throw new BadRequestException('SMTP settings are incomplete.');
    }

    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      await transport.sendMail({
        from: this.formatFromAddress(smtpFromName, smtpFrom),
        to: smtpUser,
        subject: 'Bookdarr Media Server SMTP Test',
        text: 'This is a test email from Bookdarr Media Server.',
      });
    } catch (error) {
      return {
        ok: false,
        message: error?.message ?? 'Unable to send test email.',
      };
    }

    return { ok: true };
  }

  private formatFromAddress(fromName?: string | null, fromEmail?: string | null) {
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
