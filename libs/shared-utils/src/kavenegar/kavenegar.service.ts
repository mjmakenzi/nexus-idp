import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Kavenegar from 'kavenegar';

@Injectable()
export class KavenegarService {
  private api: any;
  private sender: string;
  private verifyTemplate: string;
  constructor(private readonly configService: ConfigService) {
    this.api = Kavenegar.KavenegarApi({
      apikey: this.configService.get('kavenegar.apiKey')!,
    });
    this.sender = this.configService.get('kavenegar.sender')!;
    this.verifyTemplate = this.configService.get('kavenegar.verifyTemplate')!;
  }

  async sendOtpBySms(phone: string, otp: string): Promise<boolean> {
    // Use the SMS template function with the OTP and phone
    return this.sendSmsTemplate(phone, otp);
  }

  async sendSmsTemplate(receptor: string, otp: string): Promise<boolean> {
    const result = await this.api.Send(
      {
        message: `${this.verifyTemplate}\n code: ${otp}`,
        sender: this.sender,
        receptor: receptor,
      },
      function (response: any, status: any) {
        console.log(response);
        console.log(status);
      },
    );
    return true;
  }
}
