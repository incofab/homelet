import { CheckCircle2, Clock3, Mail, MessageCircle, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PlatformAdminContacts } from '../lib/responses';

type BuildingRegistrationSuccessProps = {
  requestId?: number | null;
  adminContacts?: PlatformAdminContacts | null;
  actions?: ReactNode;
};

export function BuildingRegistrationSuccess({
  requestId,
  adminContacts,
  actions,
}: BuildingRegistrationSuccessProps) {
  const contacts = [
    {
      label: 'Email',
      value: adminContacts?.email,
      href: adminContacts?.email ? `mailto:${adminContacts.email}` : undefined,
      icon: Mail,
    },
    {
      label: 'Phone',
      value: adminContacts?.phone,
      href: adminContacts?.phone ? `tel:${adminContacts.phone}` : undefined,
      icon: Phone,
    },
    {
      label: 'WhatsApp',
      value: adminContacts?.whatsapp,
      href: adminContacts?.whatsapp
        ? `https://wa.me/${adminContacts.whatsapp.replace(/\D/g, '')}`
        : undefined,
      icon: MessageCircle,
    },
  ].filter((contact) => contact.value);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-success/20 bg-success/10 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl text-success">Request submitted</h2>
            <p className="text-muted-foreground">
              Your building registration request has been sent to the platform
              admin for review. Please wait for approval before the building is
              added to your account.
            </p>
            {requestId ? (
              <p className="text-sm text-muted-foreground">
                Reference ID: {requestId}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-5">
        <div className="mb-4 flex items-start gap-3">
          <Clock3 size={20} className="mt-1 text-primary" />
          <div>
            <h3 className="text-lg">Need faster approval?</h3>
            <p className="text-sm text-muted-foreground">
              Contact the platform admin with your reference ID so they can
              review your request sooner.
            </p>
          </div>
        </div>

        {contacts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {contacts.map((contact) => {
              const Icon = contact.icon;
              const value = (
                <span className="break-all text-sm text-foreground">
                  {contact.value}
                </span>
              );

              return (
                <div
                  key={contact.label}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon size={16} />
                    <span>{contact.label}</span>
                  </div>
                  {contact.href ? (
                    <a className="hover:text-primary" href={contact.href}>
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {adminContacts?.support_hours ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Support hours: {adminContacts.support_hours}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-col gap-3 sm:flex-row">{actions}</div>
      ) : null}
    </div>
  );
}
