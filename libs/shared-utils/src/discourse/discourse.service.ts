import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '@app/db';
import { createHmac } from 'crypto';
import { AvatarService } from '../avatar/avatar.service';

@Injectable()
export class DiscourseService {
  constructor(
    private readonly config: ConfigService,
    private readonly avatarService: AvatarService,
  ) {}

  createSsoPayloadAndSig(
    user: UserEntity,
    file?: Express.Multer.File,
    nonce?: string,
  ): { sso: string; sig: string } {
    // const userDataKey = user.id;
    // const avatarFileName = profile.avatar || false;
    let avatarUrl = '';
    if (!file) {
      avatarUrl = this.avatarService.generateDefaultAvatarUrl();
    } else {
      avatarUrl = this.avatarService.generateImgproxyAvatarUrl(file, 256);
    }
    const emailVerified = !!user.emailVerifiedAt;
    const identityVerified = !!user.identityVerifiedAt;
    let addGroups = '';
    let removeGroups = '';
    if (identityVerified) {
      addGroups += 'verified,';
    } else {
      removeGroups += 'verified,';
    }
    const payload: Record<string, any> = {
      add_groups: addGroups,
      avatar_force_update: 'true',
      avatar_url: avatarUrl,
      email: emailVerified ? user.email : user.username + '@site.invalid',
      external_id: user.id,
      name: user.profile?.displayname,
      remove_groups: removeGroups,
      suppress_welcome_message: 'true',
      username: user.username,
      website: user.profile?.website,
    };

    if (nonce) payload.nonce = nonce;
    const payloadString = new URLSearchParams(payload).toString();
    const payloadBase64 = Buffer.from(payloadString).toString('base64');
    const secret = this.config.getOrThrow<string>('discourse.ssoSecret');
    const sig = createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('hex');
    return { sso: payloadBase64, sig };
  }

  async syncSsoRecord(
    user: UserEntity,
    file?: Express.Multer.File,
  ): Promise<boolean> {
    const ssoData = this.createSsoPayloadAndSig(user, file);
    const url =
      this.config.getOrThrow<string>('discourse.url') + '/admin/users/sync_sso';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': this.config.getOrThrow<string>('discourse.apiKey'),
          'Api-Username': this.config.getOrThrow<string>('discourse.userName'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(ssoData).toString(),
      });
      if (response.status !== 200) {
        Logger.error(
          `Error syncing SSO record. Status code: ${response.status}. Response: ${await response.text()}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      Logger.error('Error syncing SSO record: ' + error);
      return false;
    }
  }

  async logoutUser(userId: string | number): Promise<boolean> {
    const url = `${this.config.getOrThrow<string>('discourse.url')}/admin/users/${userId}/log_out`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': this.config.getOrThrow<string>('discourse.apiKey'),
          'Api-Username': this.config.getOrThrow<string>('discourse.userName'),
          'Content-Type': 'application/json',
        },
      });
      if (response.status !== 200) {
        Logger.error(
          `Error logging out user from Discourse. Status code: ${response.status}. Response: ${await response.text()}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      Logger.error('Error logging out user from Discourse: ' + error);
      return false;
    }
  }
}
