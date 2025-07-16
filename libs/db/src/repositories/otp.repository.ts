import { SendOtpPhoneDto } from '@app/auth';
import { EntityRepository } from '@mikro-orm/core';
// import { UserEntity } from '../../../user/src/entities/user.entity';
import {
  OtpDeliveryMethod,
  OtpEntity,
  OtpIdentifier,
} from '../entities/otp.entity';

export class OtpRepository extends EntityRepository<OtpEntity> {
  async createOtp(
    dto: SendOtpPhoneDto,
    userAgent: string,
    ip: string,
    otp: string,
    userId?: number,
  ): Promise<OtpEntity> {
    return await this.create({
      identifier: OtpIdentifier.PHONE,
      otpHash: otp,
      purpose: dto.type,
      deliveryMethod: OtpDeliveryMethod.SMS,
      userAgent: userAgent,
      ipAddress: ip,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
  }
  // async createEmailOtp(
  //   dto: SendOptEmailDto,
  //   userAgent: string,
  //   ip: string,
  //   now: Date,
  //   otp: string,
  //   user: UserEntity | null,
  // ) {
  //   return await this.create({
  //     user,
  //     identifier: dto.email,
  //     otpHash: otp,
  //     purpose: dto.type ?? 'login',
  //     deliveryMethod: 'email',
  //     stepNumber: 0,
  //     userAgent: userAgent,
  //     ipAddress: ip,
  //     createdAt: now,
  //     expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
  //     maxAttempts: 3,
  //     isUsed: false,
  //   });
  // }
  // async deleteOtp(dto: OneClickPhoneDto) {
  //   return await this.nativeDelete({
  //     identifier: dto.phone_no,
  //     otpHash: dto.otp,
  //     purpose: 'login',
  //   });
  // }
  // async deleteEmailOtp(dto: OneClickEmailDto) {
  //   return await this.nativeDelete({
  //     identifier: dto.email,
  //     otpHash: dto.otp,
  //     purpose: 'login',
  //   });
  // }
  // async getOtp(
  //   dto: OneClickPhoneDto | SendOtpPhoneDto,
  // ): Promise<OtpEntity | null> {
  //   const validOtp = await this.findOne(
  //     {
  //       identifier: dto.phone_no,
  //       ...('otp' in dto && { otpHash: dto.otp }),
  //       purpose: 'login',
  //       expiresAt: { $gt: new Date() },
  //     },
  //     { orderBy: { createdAt: 'DESC' } },
  //   );
  //   return validOtp;
  // }
  // async getEmailOtp(
  //   dto: OneClickEmailDto | SendOptEmailDto,
  // ): Promise<OtpEntity | null> {
  //   const validOtp = await this.findOne(
  //     {
  //       identifier: dto.email,
  //       ...('otp' in dto && { otpHash: dto.otp }),
  //       purpose: 'type' in dto ? (dto.type ?? 'login') : 'login',
  //       expiresAt: { $gt: new Date() },
  //     },
  //     { orderBy: { createdAt: 'DESC' } },
  //   );
  //   return validOtp;
  // }
  // async getRecentEmailOtp(dto: SendOptEmailDto): Promise<OtpEntity | null> {
  //   const now = new Date();
  //   const fourMinutesFromNow = new Date(now.getTime() + 4 * 60 * 1000);
  //   return await this.findOne(
  //     {
  //       identifier: dto.email,
  //       purpose: dto.type ?? 'login',
  //       expiresAt: { $gt: fourMinutesFromNow },
  //     },
  //     { orderBy: { createdAt: 'DESC' } },
  //   );
  // }
}
