export interface KakaoProfile {
  provider: string;
  id: string;
  username?: string;
  displayName?: string;
  _raw: string;
  _json: {
    id: number;
    kakao_account?: {
      email?: string;
      profile?: {
        email?: string;
        nickname?: string;
      };
    };
  };
}

export interface KakaoData {
  email?: string;
  nickname?: string;
}
