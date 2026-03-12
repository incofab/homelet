<?php

namespace App\Mail;

use App\Models\Lease;
use App\Services\LeaseDocumentService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TenancyAgreementMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Lease $lease) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tenancy agreement',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tenancy-agreement',
            with: [
                'lease' => $this->lease,
            ]
        );
    }

    public function build(): static
    {
        $document = app(LeaseDocumentService::class)->buildTenancyAgreement($this->lease);

        return $this->attachData($document, 'tenancy-agreement.txt', [
            'mime' => 'text/plain',
        ]);
    }
}
