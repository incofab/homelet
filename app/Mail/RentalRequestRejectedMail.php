<?php

namespace App\Mail;

use App\Models\RentalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RentalRequestRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public RentalRequest $rentalRequest) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rental request update',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.rental-request-rejected',
            with: [
                'rentalRequest' => $this->rentalRequest,
            ]
        );
    }
}
