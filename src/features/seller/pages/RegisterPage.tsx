'use client';

import { ContactDetailsSection, type ContactFields } from '@/features/seller/components/register/ContactDetailsSection';
import { OrganisationSection, type OrganisationFields } from '@/features/seller/components/register/OrganisationSection';
import { OrganizationRegisteredPopup } from '@/features/seller/components/register/OrganizationRegisteredPopup';
import { RegisteredAddressSection, type RegisteredAddressFields } from '@/features/seller/components/register/RegisteredAddressSection';
import { RegisterFooterCard } from '@/features/seller/components/register/RegisterFooterCard';
import { RegisterHeaderCard } from '@/features/seller/components/register/RegisterHeaderCard';
import { selectAuthStatus, selectUser } from '@/features/auth/store/authSlice';
import { registerBank, selectOnboardingRegistrationError, selectOnboardingRegistrationStatus } from '@/features/seller/store/onboardingSlice';
import type { AppDispatch } from '@/store';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const registrationStatus = useSelector(selectOnboardingRegistrationStatus);
  const registrationError = useSelector(selectOnboardingRegistrationError);
  const user = useSelector(selectUser);
  const authStatus = useSelector(selectAuthStatus);

  // Mirror of the dashboard's onboarding gate: a bank_admin whose bank is
  // already provisioned (bankId set) has no reason to be here, so bounce them
  // to the dashboard once auth has resolved.
  const authResolved = authStatus === 'succeeded' || authStatus === 'failed';
  const alreadyProvisioned = user?.kind === 'bank_admin' && !!user.bankId;

  const [isAgreed, setIsAgreed] = useState(false);
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Once the admin has just registered, keep them on this page so the success
  // popup is visible. Without this guard, a background `getMe` that reports the
  // now-provisioned bank would flip `alreadyProvisioned` and redirect to the
  // dashboard before the confirmation is ever seen.
  const justRegistered = isSuccessPopupOpen || registrationStatus === 'succeeded';

  useEffect(() => {
    if (authResolved && alreadyProvisioned && !justRegistered) {
      router.replace('/dashboard');
    }
  }, [authResolved, alreadyProvisioned, justRegistered, router]);

  const [orgFields, setOrgFields] = useState<OrganisationFields>({
    bank_name: '',
    entity_type: '',
    bank_code: '',
  });

  const [addressFields, setAddressFields] = useState<RegisteredAddressFields>({
    registered_street: '',
    registered_kebele: '',
    registered_woreda: '',
    registered_city: '',
    registered_country: '',
    registered_postal_code: '',
  });

  const [contactFields, setContactFields] = useState<ContactFields>({
    registered_email: '',
    registered_phone: '',
  });

  const isLoading = registrationStatus === 'loading';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(registerBank({
      ...orgFields,
      ...addressFields,
      ...contactFields,
    }));
    if (registerBank.fulfilled.match(result)) {
      const message = (result.payload as { message?: string } | undefined)?.message ?? null;
      setSuccessMessage(message);
      setIsSuccessPopupOpen(true);
    } else if (registerBank.rejected.match(result)) {
      const msg = (result.payload as string) ?? '';
      if (msg.toLowerCase().includes('already associated')) {
        router.push('/dashboard');
      }
    }
  };

  // Don't flash the registration form while we resolve auth or redirect an
  // already-provisioned admin away.
  if (!authResolved || (alreadyProvisioned && !justRegistered)) {
    return null;
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-[#F8F9FA]">
      <div className="max-w-5xl mx-auto w-full pb-12 pt-8 px-4 sm:px-6">
        <Link
          href="/login/bank-admin"
          className="inline-flex items-center text-[14px] font-semibold text-[#4B5563] hover:text-[#1F2937] transition-colors mb-4"
        >
          <ArrowLeft size={16} className="mr-1.5" />
          Back to Sign In
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          <RegisterHeaderCard />
          <OrganisationSection
            fields={orgFields}
            onChange={(partial) => setOrgFields((prev) => ({ ...prev, ...partial }))}
          />
          <RegisteredAddressSection
            fields={addressFields}
            onChange={(partial) => setAddressFields((prev) => ({ ...prev, ...partial }))}
          />
          <ContactDetailsSection
            fields={contactFields}
            onChange={(partial) => setContactFields((prev) => ({ ...prev, ...partial }))}
            isAgreed={isAgreed}
            setIsAgreed={setIsAgreed}
          />
          {registrationError && (
            <p className="text-sm text-red-600 px-1">{registrationError}</p>
          )}
          <RegisterFooterCard
            isLoading={isLoading}
            isAgreed={isAgreed}
            onBack={() => router.back()}
          />
        </form>

        <OrganizationRegisteredPopup
          isOpen={isSuccessPopupOpen}
          message={successMessage}
          onClose={() => setIsSuccessPopupOpen(false)}
        />
      </div>
    </div>
  );
}
