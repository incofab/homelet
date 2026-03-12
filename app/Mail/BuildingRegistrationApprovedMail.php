<?php

namespace App\Mail;

use App\Models\BuildingRegistrationRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BuildingRegistrationApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public BuildingRegistrationRequest $request) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Building registration approved',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.building-registration-approved',
            with: [
                'request' => $this->request,
            ]
        );
    }
}
