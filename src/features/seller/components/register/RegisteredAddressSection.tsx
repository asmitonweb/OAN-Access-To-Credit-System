import { useState, useEffect } from 'react';
import { FormCard } from './FormCard';
import { InputField } from './InputField';
import { SelectField } from './SelectField';
import { fetchApi } from '@/lib/api/fetchApi';

export interface RegisteredAddressFields {
  registered_street: string;
  registered_city: string;
  registered_country: string;
  registered_postal_code: string;
  registered_kebele?: string;
  registered_woreda?: string;
}

interface RegisteredAddressSectionProps {
  fields: RegisteredAddressFields;
  onChange: (fields: Partial<RegisteredAddressFields>) => void;
}

export function RegisteredAddressSection({ fields, onChange }: RegisteredAddressSectionProps) {
  const [woredas, setWoredas] = useState<{value: string, label: string}[]>([]);
  const [kebeles, setKebeles] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const woredaRes = await fetchApi('frappe.client.get_list', {
          method: 'POST',
          body: JSON.stringify({ doctype: 'A2C Woreda', fields: ['name'], limit_page_length: 500 })
        });
        if (Array.isArray(woredaRes)) {
          setWoredas(woredaRes.map((d: any) => ({ value: d.name, label: d.name })));
        }
        
        const kebeleRes = await fetchApi('frappe.client.get_list', {
          method: 'POST',
          body: JSON.stringify({ doctype: 'A2C Kebele', fields: ['name'], limit_page_length: 500 })
        });
        if (Array.isArray(kebeleRes)) {
          setKebeles(kebeleRes.map((d: any) => ({ value: d.name, label: d.name })));
        }
      } catch (err) {
        console.error('Failed to fetch location data', err);
      }
    }
    fetchData();
  }, []);

  return (
    <FormCard title="Registered Address" bodyClassName="space-y-5">
      <InputField
        label="Street address"
        required
        placeholder="Enter Street address"
        value={fields.registered_street}
        onChange={(e) => onChange({ registered_street: e.target.value })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SelectField
          label="Kebele / Village"
          options={kebeles}
          value={fields.registered_kebele || ""}
          onChange={(e) => onChange({ registered_kebele: e.target.value })}
        />
        <SelectField
          label="Woreda / District"
          options={woredas}
          value={fields.registered_woreda || ""}
          onChange={(e) => onChange({ registered_woreda: e.target.value })}
        />
        <InputField
          label="City"
          required
          placeholder="Enter City"
          value={fields.registered_city}
          onChange={(e) => onChange({ registered_city: e.target.value })}
        />
        <InputField
          label="Country"
          required
          placeholder="Enter Country"
          value={fields.registered_country}
          onChange={(e) => onChange({ registered_country: e.target.value })}
        />
        <InputField
          label="Postal code"
          required
          placeholder="Enter Postal code"
          value={fields.registered_postal_code}
          onChange={(e) => onChange({ registered_postal_code: e.target.value })}
        />
        <InputField
          label="Website"
          placeholder="Enter Website"
          hint="Your website - used as your network address - can be added later"
        />
      </div>
    </FormCard>
  );
}
