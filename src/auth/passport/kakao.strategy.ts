import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { KakaoData, KakaoProfile } from '../interfaces/oauth.interface';
import { Oauth2AuthenticationException } from 'src/member/exceptions/oauth2-authentication.exception';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(readonly configService: ConfigService) {
    const kakaoClientId = configService.get('K_CLIENT_ID') as string;
    const kakaoClientSecret = configService.get('K_CLIENT_SECRET') as string;
    const backendUrl = configService.get('BACKEND_URL') as string;

    super({
      clientID: kakaoClientId,
      clientSecret: kakaoClientSecret,
      callbackURL: `${backendUrl}/login/oauth2/code/kakao`,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ) {
    const kakaoProfile = profile as KakaoProfile;

    if (!kakaoProfile._json.kakao_account) {
      throw new Oauth2AuthenticationException();
    }

    try {
      const user: KakaoData = {
        email: kakaoProfile._json.kakao_account?.email,
        nickname: kakaoProfile._json.kakao_account?.profile?.nickname,
      };
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
