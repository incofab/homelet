<?php

namespace App\Mail;

use App\Models\Lease;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RenewalReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Lease $lease) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Lease renewal reminder',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.renewal-reminder',
            with: [
                'lease' => $this->lease,
            ]
        );
    }
}
