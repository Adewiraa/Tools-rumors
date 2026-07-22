import type { Metadata } from 'next';
import LoginView from '@/views/auth/LoginView';

export const metadata: Metadata = {
  title: 'Login — Gosball Admin',
  description: 'Masuk ke panel admin Gosball',
};

export default function LoginPage() {
  return <LoginView />;
}
