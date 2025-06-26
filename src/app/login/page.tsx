import { LoginForm } from '@/components/forms/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 -mt-16">
      <div className="max-w-md w-full space-y-8">
        <LoginForm />
      </div>
    </div>
  )
} 