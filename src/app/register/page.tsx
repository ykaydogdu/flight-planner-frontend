import { RegisterForm } from '@/components/forms/register-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 -mt-16">
        <RegisterForm />
      </div>
    </div>
  )
} 