import { CreateOtpDto, FindOtpDto } from '@app/auth';
import { EntityRepository } from '@mikro-orm/postgresql';
import { OtpEntity } from '../entities/otp.entity';

export class OtpRepository extends EntityRepository<OtpEntity> {
  async createOtp(dto: CreateOtpDto, otpHash: string): Promise<OtpEntity> {
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes,

    const otpData: any = {
      user: dto.user,
      identifier: dto.identifier,
      otpHash: otpHash,
      purpose: dto.purpose,
      deliveryMethod: dto.deliveryMethod,
      userAgent: dto.userAgent,
      ipAddress: dto.ipAddress,
      expiresAt: expiresAt,
      attempts: 0,
      maxAttempts: 5,
      isUsed: false,
    };

    // Store phone metadata for non-existing users
    if (!dto.user && dto.countryCode && dto.phoneNumber) {
      otpData.metadata = {
        countryCode: dto.countryCode,
        phoneNumber: dto.phoneNumber,
      };
    }

    const otpEntity = await this.create(otpData);
    await this.em.persistAndFlush(otpEntity);
    return otpEntity;
  }

  async updateOtp(id: bigint, otp: OtpEntity) {
    return await this.nativeUpdate({ id }, otp);
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
  //     identifier: OtpIdentifier.PHONE,
  //     otpHash: dto.otp,
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
  //       identifier: OtpIdentifier.PHONE,
  //       otpHash: 'otp' in dto ? dto.otp : undefined,
  //       expiresAt: { $gt: new Date() },
  //     },
  //     { orderBy: { createdAt: 'DESC' } },
  //   );
  //   return validOtp;
  // }

  async findOtp(dto: FindOtpDto): Promise<OtpEntity | null> {
    const expiresAt = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes,

    const baseQuery = {
      identifier: dto.identifier,
      purpose: dto.purpose,
      expiresAt: { $gt: expiresAt },
      isUsed: false, // Prevent reuse of already used OTPs
    };

    // Handle both existing and non-existing users
    if (dto.countryCode && dto.phoneNumber) {
      // Use OR logic: either user exists with matching phone OR user is null (for new users)
      const query = {
        ...baseQuery,
        $or: [
          // Case 1: Existing user with matching phone
          {
            user: {
              countryCode: dto.countryCode,
              phoneNumber: dto.phoneNumber,
            },
          },
          // Case 2: Non-existing user (user is null) - we need to store phone info in OTP
          {
            user: null,
            // We'll need to add phone metadata to OTP entity
            metadata: {
              countryCode: dto.countryCode,
              phoneNumber: dto.phoneNumber,
            },
          },
        ],
      };

      return await this.findOne(query, { orderBy: { createdAt: 'DESC' } });
    }

    // Fallback: no phone filtering
    return await this.findOne(baseQuery, { orderBy: { createdAt: 'DESC' } });
  }

  async findRecentOtp(dto: FindOtpDto): Promise<OtpEntity | null> {
    // Check for OTPs created in the last 2 minutes (rate limiting)
    const recentTime = new Date(Date.now() - 2 * 60 * 1000);

    const baseQuery = {
      identifier: dto.identifier,
      purpose: dto.purpose,
      createdAt: { $gt: recentTime },
    };

    // Handle both existing and non-existing users
    if (dto.countryCode && dto.phoneNumber) {
      const query = {
        ...baseQuery,
        $or: [
          // Case 1: Existing user with matching phone
          {
            user: {
              countryCode: dto.countryCode,
              phoneNumber: dto.phoneNumber,
            },
          },
          // Case 2: Non-existing user (user is null) with matching metadata
          {
            user: null,
            metadata: {
              countryCode: dto.countryCode,
              phoneNumber: dto.phoneNumber,
            },
          },
        ],
      };

      return await this.findOne(query, { orderBy: { createdAt: 'DESC' } });
    }

    // Fallback: no phone filtering
    return await this.findOne(baseQuery, { orderBy: { createdAt: 'DESC' } });
  }

  async deleteOtp() {
    return await this.nativeDelete({
      expiresAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) },
    });
  }

  /**
   * Helper method to test OTP lookup logic
   * This method helps debug OTP lookup issues
   */
  async debugOtpLookup(dto: FindOtpDto): Promise<{
    foundOtp: OtpEntity | null;
    query: any;
    explanation: string;
  }> {
    const expiresAt = new Date(Date.now() - 2 * 60 * 1000);

    const baseQuery = {
      identifier: dto.identifier,
      purpose: dto.purpose,
      expiresAt: { $gt: expiresAt },
      isUsed: false,
    };

    let query: any;
    let explanation: string;

    if (dto.countryCode && dto.phoneNumber) {
      query = {
        ...baseQuery,
        $or: [
          {
            user: {
              countryCode: dto.countryCode,
              phoneNumber: dto.phoneNumber,
            },
          },
          {
            user: null,
            metadata: {
              countryCode: dto.countryCode,
              phoneNumber: dto.phoneNumber,
            },
          },
        ],
      };
      explanation = `Looking for OTP with phone ${dto.countryCode}${dto.phoneNumber} - either existing user or new user with metadata`;
    } else {
      query = baseQuery;
      explanation = 'Looking for OTP without phone filtering';
    }

    const foundOtp = await this.findOne(query, {
      orderBy: { createdAt: 'DESC' },
    });

    return {
      foundOtp,
      query,
      explanation,
    };
  }
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
