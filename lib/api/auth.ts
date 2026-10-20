import { request } from '@/lib/api/client';
import type {
  LoginResponse,
  MeResponse,
  MessageResponse,
  ProfileResponse,
  SessionResponse,
} from '@/lib/api/types';

/**
 * Password login. A 2FA account answers with a challenge instead of a token —
 * call `challengeTwoFactor` with the returned token to finish signing in.
 */
export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

/** Exchange a valid TOTP or recovery code for a session token. */
export function challengeTwoFactor(challengeToken: string, code: string) {
  return request<SessionResponse>('/auth/two-factor/challenge', {
    method: 'POST',
    body: { challenge_token: challengeToken, code },
  });
}

export function me(token: string) {
  return request<MeResponse>('/auth/me', { token });
}

export function logout(token: string) {
  return request<MessageResponse>('/auth/logout', { method: 'POST', token });
}

export function forgotPassword(email: string) {
  return request<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export function changePassword(token: string, currentPassword: string, password: string) {
  return request<MessageResponse>('/auth/change-password', {
    method: 'POST',
    token,
    body: {
      current_password: currentPassword,
      password,
      password_confirmation: password,
    },
  });
}

export function updateProfile(token: string, name: string, language?: 'sq' | 'en') {
  return request<ProfileResponse>('/profile', {
    method: 'PATCH',
    token,
    body: language ? { name, language } : { name },
  });
}

export function updateEmail(token: string, email: string, password: string) {
  return request<ProfileResponse>('/profile/email', {
    method: 'PATCH',
    token,
    body: { email, password },
  });
}
