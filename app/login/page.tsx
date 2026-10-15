import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "6rem", fontFamily: "sans-serif" }}>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
