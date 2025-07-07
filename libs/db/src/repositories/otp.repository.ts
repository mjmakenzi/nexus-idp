import {
  OneClickEmailDto,
  OneClickPhoneDto,
  SendOptEmailDto,
  SendOtpPhoneDto,
} from '@app/otp';
import { EntityRepository } from '@mikro-orm/postgresql';
import { OtpEntity } from '../entities/otp.entity';
import { UserEntity } from '../entities/user.entity';

export class OtpRepository extends EntityRepository<OtpEntity> {
  async createOtp(
    dto: SendOtpPhoneDto,
    userAgent: string,
    ip: string,
    now: Date,
    otp: string,
    user: UserEntity | null,
  ) {
    return await this.create({
      user,
      countryCode: dto.country_code,
      phoneNo: dto.phone_no,
      email: null,
      otp,
      actionType: dto.type ?? 'login',
      stepNo: 0,
      userAgent,
      ip,
      createdOn: now,
      expiredOn: new Date(now.getTime() + 5 * 60 * 1000),
    });
  }

  async createEmailOtp(
    dto: SendOptEmailDto,
    userAgent: string,
    ip: string,
    now: Date,
    otp: string,
    user: UserEntity | null,
  ) {
    return await this.create({
      user,
      countryCode: null,
      phoneNo: null,
      email: dto.email,
      otp,
      actionType: dto.type ?? 'login',
      stepNo: 0,
      userAgent,
      ip,
      createdOn: now,
      expiredOn: new Date(now.getTime() + 5 * 60 * 1000),
    });
  }

  async deleteOtp(dto: OneClickPhoneDto) {
    return await this.nativeDelete({
      countryCode: dto.country_code,
      phoneNo: dto.phone_no,
      otp: dto.otp,
      actionType: 'login',
    });
  }

  async deleteEmailOtp(dto: OneClickEmailDto) {
    return await this.nativeDelete({
      email: dto.email,
      otp: dto.otp,
      actionType: 'login',
    });
  }

  async getOtp(
    dto: OneClickPhoneDto | SendOtpPhoneDto,
  ): Promise<OtpEntity | null> {
    const validOtp = await this.findOne(
      {
        countryCode: dto.country_code,
        phoneNo: dto.phone_no,
        ...('otp' in dto && { otp: dto.otp }),
        actionType: 'login',
        expiredOn: { $gt: new Date() },
      },
      { orderBy: { createdOn: 'DESC' } },
    );
    return validOtp;
  }

  async getEmailOtp(
    dto: OneClickEmailDto | SendOptEmailDto,
  ): Promise<OtpEntity | null> {
    const validOtp = await this.findOne(
      {
        email: dto.email,
        ...('otp' in dto && { otp: dto.otp }),
        actionType: 'type' in dto ? (dto.type ?? 'login') : 'login',
        expiredOn: { $gt: new Date() },
      },
      { orderBy: { createdOn: 'DESC' } },
    );
    return validOtp;
  }

  async getRecentEmailOtp(dto: SendOptEmailDto): Promise<OtpEntity | null> {
    const now = new Date();
    const fourMinutesFromNow = new Date(now.getTime() + 4 * 60 * 1000);

    return await this.findOne(
      {
        email: dto.email,
        actionType: dto.type ?? 'login',
        expiredOn: { $gt: fourMinutesFromNow },
      },
      { orderBy: { createdOn: 'DESC' } },
    );
  }
}
