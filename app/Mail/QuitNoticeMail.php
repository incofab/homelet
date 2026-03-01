<?php

namespace App\Mail;

use App\Models\Lease;
use App\Services\LeaseDocumentService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuitNoticeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Lease $lease)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Quit notice',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quit-notice',
            with: [
                'lease' => $this->lease,
            ]
        );
    }

    public function build(): static
    {
        $document = app(LeaseDocumentService::class)->buildQuitNotice($this->lease);

        return $this->attachData($document, 'quit-notice.txt', [
            'mime' => 'text/plain',
        ]);
    }
}
