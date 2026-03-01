<?php

use App\Models\User;
use App\Support\Res;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

if (!function_exists('currentUser')) {
  function currentUser(): User|null
  {
    /** @var User */
    $user = Auth::user();
    return $user;
  }
}

if (!function_exists('isProduction')) {
  function isProduction(): bool
  {
    return app()->environment('production');
  }
}

if (!function_exists('isLocal')) {
  function isLocal(): bool
  {
    return app()->environment('local');
  }
}

if (!function_exists('isTesting')) {
  function isTesting(): bool
  {
    return app()->environment('testing');
  }
}

if (!function_exists('removeHyphenAndCapitalize')) {
  function removeHyphenAndCapitalize($string): string
  {
    return ucwords(str_replace('-', ' ', $string));
  }
}

if (!function_exists('paginateFromRequest')) {
  function paginateFromRequest(
    $query
  ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
    $perPage = request()->query('perPage', 100);
    $page = request()->query('page');

    return $query->paginate(perPage: (int) $perPage, page: (int) $page);
  }
}

if (!function_exists('failRes')) {
  function failRes($message, array $data = []): Res
  {
    return new Res(['success' => false, 'message' => $message, ...$data]);
  }
}

if (!function_exists('successRes')) {
  function successRes($message = '', array $data = []): Res
  {
    return new Res(['success' => true, 'message' => $message, ...$data]);
  }
}

if (!function_exists('dlog')) {
  /** Helper to log data using json encode with pretty print */
  function dlog($data)
  {
    info(json_encode($data, JSON_PRETTY_PRINT));
  }
}

if (!function_exists('randomDigits')) {
  function randomDigits($length)
  {
    $result = '';
    for ($i = 0; $i < $length; $i++) {
      $result .= random_int(0, 9);
    }
    return $result;
  }
}

if (!function_exists('sanitizeFilename')) {
  function sanitizeFilename(string $filename): string
  {
    $filename = basename($filename);
    $sanitized = Str::slug(pathinfo($filename, PATHINFO_FILENAME));
    $extension = pathinfo($filename, PATHINFO_EXTENSION);
    return $extension ? "{$sanitized}.{$extension}" : $sanitized;
  }
}

if (!function_exists('formatWhatsappNumber')) {
  function formatWhatsappNumber(?string $phone): ?string
  {
    $phone = str_replace([' ', '-', '(', ')', '+'], '', $phone ?? '');
    $countryCode = '234';

    if (str_starts_with($phone, '0')) {
      return $countryCode . substr($phone, 1);
    }

    if (!str_starts_with($phone, $countryCode)) {
      return $countryCode . $phone;
    }

    return $phone;
  }
}
