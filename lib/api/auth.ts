import { request } from '@/lib/api/client';
import type {
  LoginResponse,
  MeResponse,
  MessageResponse,
  ProfileResponse,
} from '@/lib/api/types';

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
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
