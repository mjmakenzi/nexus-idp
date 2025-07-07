import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class NodemailerService {
  constructor(private readonly configService: ConfigService) {}
  async sendEmail(
    receptor: string,
    subject: string,
    content: string,
    headers: Record<string, string> = {
      'Content-Type': 'text/html; charset=UTF-8',
    },
    attachments: any[] = [],
  ): Promise<boolean> {
    // Configure nodemailer transport
    const transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('smtp.host'),
      port: Number(this.configService.getOrThrow<string>('smtp.port')),
      secure: this.configService.getOrThrow<boolean>('smtp.secure'),
      auth: {
        user: this.configService.getOrThrow<string>('smtp.user'),
        pass: this.configService.getOrThrow<string>('smtp.pass'),
      },
    });
    try {
      await transporter.sendMail({
        from: this.configService.getOrThrow<string>('smtp.from'),
        to: receptor,
        subject,
        html: content,
        headers,
        attachments,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendOtpByEmail(receptor: string, otp: string): Promise<boolean> {
    // Load the email template from env or a file
    let mailHtml =
      this.configService.getOrThrow<string>('email.base') ||
      '<div>{{BODY}}</div>';
    mailHtml = mailHtml.replace(
      '{{BODY}}',
      (this.configService.getOrThrow<string>('email.body.logo') || '') +
        (this.configService.getOrThrow<string>('email.body.box_otp') || '') +
        (this.configService.getOrThrow<string>('email.body.social') || '') +
        (this.configService.getOrThrow<string>('email.body.copyright') || ''),
    );
    mailHtml = mailHtml.replace('{{SUBJECT}}', 'Verification Code');
    mailHtml = mailHtml.replace(
      '{{OTP_TITLE}}',
      'کاربر عزیز؛ جهت تکمیل مراحل لطفا کد زیر را وارد نمایید:',
    );
    mailHtml = mailHtml.replace('{{OTP_SUBTITLE}}', 'کد تایید شما:');
    mailHtml = mailHtml.replace('{{OTP}}', otp);
    const subject = 'Verification Code';
    const headers = { 'Content-Type': 'text/html; charset=UTF-8' };
    return await this.sendEmail(receptor, subject, mailHtml, headers);
  }
}
